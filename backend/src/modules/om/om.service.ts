import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opportunity, OpportunityStage, OpportunityResult } from './entities/opportunity.entity';
import { OpportunityStageHistory } from './entities/opportunity-stage-history.entity';
import { opportunityStateMachine } from '../../common/statemachine/definitions/opportunity.sm';
import { EventBusService } from '../../common/events/event-bus.service';
import { opportunityStageChanged, opportunityResultSet } from '../../common/events/opportunity-events';

type OpportunityCommitBand = 'low' | 'medium' | 'high';

interface OpportunityForecastDriver {
  label: string;
  score: number;
  reason: string;
}

@Injectable()
export class OmService {
  constructor(
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
    @InjectRepository(OpportunityStageHistory)
    private historyRepository: Repository<OpportunityStageHistory>,
    private readonly eventBus: EventBusService,
  ) {}

  async findOpportunities(
    orgId: string,
    userId: string,
    dataScope: string,
    filters: { stage?: string; result?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: Opportunity[]; total: number }> {
    const qb = this.opportunityRepository.createQueryBuilder('opp').where('opp.orgId = :orgId', { orgId });

    if (dataScope === 'self') {
      qb.andWhere('opp.ownerUserId = :userId', { userId });
    }

    if (filters.stage) {
      qb.andWhere('opp.stage = :stage', { stage: filters.stage });
    }

    if (filters.result) {
      qb.andWhere('opp.result = :result', { result: filters.result });
    }

    qb.orderBy('opp.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOpportunityById(id: string, orgId: string): Promise<Opportunity> {
    const opp = await this.opportunityRepository.findOne({
      where: { id, orgId },
    });

    if (!opp) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }

    return opp;
  }

  async createOpportunity(
    orgId: string,
    data: Partial<Opportunity>,
    userId: string,
  ): Promise<Opportunity> {
    const opp = this.opportunityRepository.create({
      ...data,
      orgId,
      ownerUserId: userId,
      stage: OpportunityStage.DISCOVERY,
    });

    return this.opportunityRepository.save(opp);
  }

  async updateOpportunity(
    id: string,
    orgId: string,
    data: Partial<Opportunity>,
    version: number,
  ): Promise<Opportunity> {
    const opp = await this.findOpportunityById(id, orgId);

    if (opp.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    await this.opportunityRepository.update(id, {
      ...data,
      version: () => 'version + 1',
    });

    return this.findOpportunityById(id, orgId);
  }

  async changeStage(
    id: string,
    orgId: string,
    toStage: OpportunityStage,
    reason: string,
    userId: string,
    version: number,
  ): Promise<Opportunity> {
    const opp = await this.findOpportunityById(id, orgId);

    if (opp.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const fromStage = opp.stage;
    opportunityStateMachine.validateTransition(opp.stage, toStage);

    const history = this.historyRepository.create({
      opportunityId: opp.id,
      orgId,
      fromStage: opp.stage,
      toStage,
      changeReason: reason,
      createdBy: userId,
    });

    await this.historyRepository.save(history);

    await this.opportunityRepository.update(id, {
      stage: toStage,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      opportunityStageChanged({
        orgId,
        opportunityId: id,
        fromStage,
        toStage,
        reason,
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findOpportunityById(id, orgId);
  }

  async markResult(
    id: string,
    orgId: string,
    result: OpportunityResult,
    reason: string,
    userId: string,
    version: number,
  ): Promise<Opportunity> {
    const opp = await this.findOpportunityById(id, orgId);

    if (opp.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    if (opp.stage !== OpportunityStage.NEGOTIATION) {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    const history = this.historyRepository.create({
      opportunityId: opp.id,
      orgId,
      fromStage: opp.stage,
      toStage: opp.stage,
      resultAfter: result,
      changeReason: reason,
      createdBy: userId,
    });

    await this.historyRepository.save(history);

    await this.opportunityRepository.update(id, {
      result,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      opportunityResultSet({
        orgId,
        opportunityId: id,
        result: result === OpportunityResult.WON ? 'won' : 'lost',
        reason,
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findOpportunityById(id, orgId);
  }

  async getForecast(
    id: string,
    orgId: string,
    userId: string,
    dataScope: string,
    options: { forecastModel: string; includeDrivers: boolean },
  ): Promise<{
    opportunityId: string;
    winRate: number;
    commitBand: OpportunityCommitBand;
    drivers: OpportunityForecastDriver[];
  }> {
    const opp = await this.findOpportunityById(id, orgId);
    this.assertDataScopeAccess(opp, userId, dataScope);

    if (opp.result === OpportunityResult.WON) {
      return {
        opportunityId: opp.id,
        winRate: 100,
        commitBand: 'high',
        drivers: options.includeDrivers
          ? [
              {
                label: '商机结果',
                score: 100,
                reason: '该商机已赢单，预测按确定成交计算',
              },
            ]
          : [],
      };
    }

    if (opp.result === OpportunityResult.LOST) {
      return {
        opportunityId: opp.id,
        winRate: 0,
        commitBand: 'low',
        drivers: options.includeDrivers
          ? [
              {
                label: '商机结果',
                score: 0,
                reason: '该商机已输单，预测按失败处理',
              },
            ]
          : [],
      };
    }

    const drivers: OpportunityForecastDriver[] = [];

    const stageScoreMap: Record<OpportunityStage, number> = {
      [OpportunityStage.DISCOVERY]: 28,
      [OpportunityStage.QUALIFICATION]: 46,
      [OpportunityStage.PROPOSAL]: 68,
      [OpportunityStage.NEGOTIATION]: 82,
    };

    let score = stageScoreMap[opp.stage];
    drivers.push({
      label: '当前阶段',
      score: stageScoreMap[opp.stage],
      reason: `当前阶段为 ${opp.stage}，基准成交概率 ${stageScoreMap[opp.stage]}%`,
    });

    if (opp.pauseReason) {
      score -= 15;
      drivers.push({
        label: '暂停状态',
        score: -15,
        reason: `存在暂停原因：${opp.pauseReason}`,
      });
    } else {
      score += 5;
      drivers.push({
        label: '推进活跃度',
        score: 5,
        reason: '无暂停标记，按活跃推进加分',
      });
    }

    if (opp.expectedCloseDate) {
      const diffDays = this.calculateDateDiffInDays(opp.expectedCloseDate);
      if (diffDays <= 30) {
        score += 8;
        drivers.push({
          label: '预计成交时间',
          score: 8,
          reason: `预计 ${Math.max(diffDays, 0)} 天内成交，窗口清晰`,
        });
      } else if (diffDays > 120) {
        score -= 8;
        drivers.push({
          label: '预计成交时间',
          score: -8,
          reason: `预计成交窗口较远（${diffDays} 天），不确定性提升`,
        });
      }
    } else {
      score -= 4;
      drivers.push({
        label: '预计成交时间',
        score: -4,
        reason: '未设置预计成交日期，预测可靠性降低',
      });
    }

    const amount = Number(opp.amount || 0);
    if (amount >= 300000) {
      score += 4;
      drivers.push({
        label: '金额规模',
        score: 4,
        reason: '高金额商机通常伴随更稳定决策链',
      });
    } else if (amount <= 50000) {
      score -= 2;
      drivers.push({
        label: '金额规模',
        score: -2,
        reason: '金额较小，需求优先级波动可能更大',
      });
    }

    if (options.forecastModel !== 'default') {
      drivers.push({
        label: '预测模型',
        score: 0,
        reason: `暂未启用 ${options.forecastModel} 专属模型，已回退 default`,
      });
    }

    const winRate = Number(this.clamp(score, 0, 99.99).toFixed(2));
    return {
      opportunityId: opp.id,
      winRate,
      commitBand: this.resolveCommitBand(winRate),
      drivers: options.includeDrivers ? drivers : [],
    };
  }

  async pauseOpportunity(
    id: string,
    orgId: string,
    pauseReason: string,
    userId: string,
    dataScope: string,
    version: number,
  ): Promise<Opportunity> {
    const normalizedReason = pauseReason.trim();
    if (!normalizedReason) {
      throw new BadRequestException('PARAM_INVALID');
    }

    const opp = await this.findOpportunityById(id, orgId);
    this.assertDataScopeAccess(opp, userId, dataScope);

    if (opp.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    if (opp.result) {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    const history = this.historyRepository.create({
      opportunityId: opp.id,
      orgId,
      fromStage: opp.stage,
      toStage: opp.stage,
      changeReason: `pause:${normalizedReason}`,
      createdBy: userId,
    });

    await this.historyRepository.save(history);

    await this.opportunityRepository.update(id, {
      pauseReason: normalizedReason,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      opportunityStageChanged({
        orgId,
        opportunityId: id,
        fromStage: opp.stage,
        toStage: opp.stage,
        reason: normalizedReason,
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findOpportunityById(id, orgId);
  }

  async findStageHistory(id: string, orgId: string): Promise<OpportunityStageHistory[]> {
    return this.historyRepository.find({
      where: { opportunityId: id, orgId },
      order: { changedAt: 'DESC' },
    });
  }

  async getSummary(
    orgId: string,
    userId: string,
    dataScope: string,
  ): Promise<{
    total: number;
    totalAmount: number;
    byStage: Record<OpportunityStage, number>;
    byResult: { won: number; lost: number };
  }> {
    const qb = this.opportunityRepository.createQueryBuilder('opp').where('opp.orgId = :orgId', { orgId });

    if (dataScope === 'self') {
      qb.andWhere('opp.ownerUserId = :userId', { userId });
    }

    const opportunities = await qb.getMany();

    const byStage: Record<OpportunityStage, number> = {
      [OpportunityStage.DISCOVERY]: 0,
      [OpportunityStage.QUALIFICATION]: 0,
      [OpportunityStage.PROPOSAL]: 0,
      [OpportunityStage.NEGOTIATION]: 0,
    };

    let won = 0;
    let lost = 0;
    let totalAmount = 0;

    for (const opp of opportunities) {
      if (opp.result === OpportunityResult.WON) {
        won++;
        totalAmount += opp.amount || 0;
      } else if (opp.result === OpportunityResult.LOST) {
        lost++;
      } else {
        byStage[opp.stage]++;
        totalAmount += opp.amount || 0;
      }
    }

    return {
      total: opportunities.length,
      totalAmount,
      byStage,
      byResult: { won, lost },
    };
  }

  private assertDataScopeAccess(
    opportunity: Opportunity,
    userId: string,
    dataScope: string,
  ): void {
    if (dataScope === 'self' && opportunity.ownerUserId !== userId) {
      throw new ForbiddenException('AUTH_FORBIDDEN');
    }
  }

  private resolveCommitBand(winRate: number): OpportunityCommitBand {
    if (winRate >= 70) {
      return 'high';
    }
    if (winRate >= 40) {
      return 'medium';
    }
    return 'low';
  }

  private clamp(value: number, min: number, max: number): number {
    if (value < min) {
      return min;
    }
    if (value > max) {
      return max;
    }
    return value;
  }

  private calculateDateDiffInDays(targetDate: Date): number {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const diffMs = endDate.getTime() - startOfToday.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
}
