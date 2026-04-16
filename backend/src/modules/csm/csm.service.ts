import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CustomerHealthScore, HealthLevel } from './entities/customer-health-score.entity';
import { SuccessPlan, SuccessPlanStatus } from './entities/success-plan.entity';
import { CustomerReturnVisit } from './entities/customer-return-visit.entity';
import { IntentService } from '../cmem/services/intent.service';
import { RiskService } from '../cmem/services/risk.service';
import { DlvService } from '../dlv/dlv.service';
import { successPlanStateMachine } from '../../common/statemachine/definitions/success-plan.sm';
import {
  CreateSuccessPlanDto,
  UpdateSuccessPlanDto,
  CreateReturnVisitDto,
} from './dto/csm.dto';

const INTENT_SCORE_MAP: Record<string, number> = {
  purchase: 15,
  renewal: 10,
  inquiry: 5,
  engagement: 5,
  complaint: -15,
  churn_risk: -20,
};

const RISK_SCORE_MAP: Record<string, number> = {
  low: 0,
  medium: -10,
  high: -20,
  critical: -30,
};

@Injectable()
export class CsmService {
  constructor(
    @InjectRepository(CustomerHealthScore)
    private healthRepository: Repository<CustomerHealthScore>,
    @InjectRepository(SuccessPlan)
    private planRepository: Repository<SuccessPlan>,
    @InjectRepository(CustomerReturnVisit)
    private visitRepository: Repository<CustomerReturnVisit>,
    private readonly intentService: IntentService,
    private readonly riskService: RiskService,
    private readonly dlvService: DlvService,
  ) {}

  async findHealthScores(
    orgId: string,
    filters: { level?: string; customerId?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: CustomerHealthScore[]; total: number }> {
    const qb = this.healthRepository
      .createQueryBuilder('h')
      .where('h.orgId = :orgId', { orgId })
      .andWhere('h.deletedAt IS NULL');

    if (filters.level) {
      qb.andWhere('h.level = :level', { level: filters.level });
    }
    if (filters.customerId) {
      qb.andWhere('h.customerId = :customerId', { customerId: filters.customerId });
    }

    qb.orderBy('h.evaluatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findHealthScoreByCustomer(
    customerId: string,
    orgId: string,
  ): Promise<CustomerHealthScore> {
    const health = await this.healthRepository.findOne({
      where: { customerId, orgId, deletedAt: null as unknown as undefined },
    });
    if (!health) throw new NotFoundException('RESOURCE_NOT_FOUND');
    return health;
  }

  async evaluateHealth(
    customerId: string,
    orgId: string,
    userId: string,
    deliverySignal?: {
      deliveryId: string;
      deliveryStatus: string;
    },
  ): Promise<CustomerHealthScore> {
    const factors: Record<string, unknown> = {};
    let score = 50;

    try {
      const latestIntent = await this.intentService.getLatestIntent(customerId, orgId);
      if (latestIntent) {
        const intentDelta = INTENT_SCORE_MAP[latestIntent.intentType] || 0;
        score += intentDelta;
        factors['intentType'] = latestIntent.intentType;
        factors['intentConfidence'] = latestIntent.confidence;
        factors['intentDelta'] = intentDelta;
      }
    } catch {
      factors['intentError'] = 'intent_service_unavailable';
    }

    try {
      const latestRiskLevel = await this.riskService.getLatestRiskLevel(customerId, orgId);
      if (latestRiskLevel) {
        const riskDelta = RISK_SCORE_MAP[latestRiskLevel] || 0;
        score += riskDelta;
        factors['riskLevel'] = latestRiskLevel;
        factors['riskDelta'] = riskDelta;
      }
    } catch {
      factors['riskError'] = 'risk_service_unavailable';
    }

    const recentVisits = await this.visitRepository.count({
      where: { customerId, orgId } as any,
    });
    if (recentVisits > 0) {
      const visitBonus = Math.min(recentVisits * 3, 15);
      score += visitBonus;
      factors['visitCount'] = recentVisits;
      factors['visitBonus'] = visitBonus;
    }

    const activePlan = await this.planRepository.findOne({
      where: { customerId, orgId, status: 'active' as SuccessPlanStatus, deletedAt: null as unknown as undefined },
    });
    if (activePlan) {
      score += 10;
      factors['hasActivePlan'] = true;
      factors['planBonus'] = 10;
    }

    try {
      const deliverySummary = await this.dlvService.getCustomerDeliverySummary(orgId, customerId);
      factors['deliverySummary'] = deliverySummary;

      const deliveryDelta =
        deliverySummary.achievedOutcomes * 2 +
        deliverySummary.acceptedDeliveries * 3 -
        deliverySummary.blockedDeliveries * 4 -
        deliverySummary.pendingRisks * 2;

      if (deliveryDelta !== 0) {
        score += Math.max(-20, Math.min(20, deliveryDelta));
        factors['deliverySummaryDelta'] = Math.max(-20, Math.min(20, deliveryDelta));
      }
    } catch {
      factors['deliverySummaryError'] = 'delivery_summary_unavailable';
    }

    if (deliverySignal) {
      factors['deliveryId'] = deliverySignal.deliveryId;
      factors['deliveryStatus'] = deliverySignal.deliveryStatus;

      if (deliverySignal.deliveryStatus === 'accepted') {
        score += 8;
        factors['deliveryDelta'] = 8;
      } else if (deliverySignal.deliveryStatus === 'closed') {
        score += 10;
        factors['deliveryDelta'] = 10;
      } else if (deliverySignal.deliveryStatus === 'blocked') {
        score -= 12;
        factors['deliveryDelta'] = -12;
      }
    }

    score = Math.max(0, Math.min(100, score));

    const level = this.calculateLevel(score);
    factors['autoEvaluated'] = true;
    factors['evaluatedAt'] = new Date().toISOString();
    factors['baseScore'] = 50;

    const existing = await this.healthRepository.findOne({
      where: { customerId, orgId, deletedAt: null as unknown as undefined },
    });

    if (existing) {
      await this.healthRepository.update(existing.id, {
        score,
        level,
        factors: factors as any,
        evaluatedAt: new Date(),
        updatedBy: userId,
        version: () => 'version + 1',
      });
      return this.findHealthScoreByCustomer(customerId, orgId);
    }

    const health = this.healthRepository.create({
      orgId,
      customerId,
      score,
      level,
      factors,
      evaluatedAt: new Date(),
      createdBy: userId,
    });

    return this.healthRepository.save(health);
  }

  private calculateLevel(score: number): HealthLevel {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'low';
    return 'critical';
  }

  async createSuccessPlan(
    orgId: string,
    dto: CreateSuccessPlanDto,
    userId: string,
  ): Promise<SuccessPlan> {
    const plan = this.planRepository.create({
      orgId,
      customerId: dto.customerId,
      title: dto.title,
      status: 'draft' as SuccessPlanStatus,
      ownerUserId: dto.ownerUserId,
      payload: dto.payload || {},
      createdBy: userId,
    });

    return this.planRepository.save(plan);
  }

  async findSuccessPlans(
    orgId: string,
    filters: { status?: string; customerId?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: SuccessPlan[]; total: number }> {
    const qb = this.planRepository
      .createQueryBuilder('p')
      .where('p.orgId = :orgId', { orgId })
      .andWhere('p.deletedAt IS NULL');

    if (filters.status) {
      qb.andWhere('p.status = :status', { status: filters.status });
    }
    if (filters.customerId) {
      qb.andWhere('p.customerId = :customerId', { customerId: filters.customerId });
    }

    qb.orderBy('p.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findSuccessPlanById(id: string, orgId: string): Promise<SuccessPlan> {
    const plan = await this.planRepository.findOne({
      where: { id, orgId, deletedAt: null as unknown as undefined },
    });
    if (!plan) throw new NotFoundException('RESOURCE_NOT_FOUND');
    return plan;
  }

  async updateSuccessPlan(
    id: string,
    orgId: string,
    dto: UpdateSuccessPlanDto,
    userId: string,
  ): Promise<SuccessPlan> {
    const plan = await this.findSuccessPlanById(id, orgId);

    if (plan.version !== dto.version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.payload !== undefined) updateData.payload = dto.payload;

    if (dto.status !== undefined && dto.status !== plan.status) {
      successPlanStateMachine.validateTransition(plan.status, dto.status as SuccessPlanStatus);
      updateData.status = dto.status;
    }

    const result = await this.planRepository.update(
      { id, orgId, version: dto.version, deletedAt: IsNull() },
      {
      ...updateData,
      updatedBy: userId,
      version: () => 'version + 1',
      } as any,
    );

    if ((result.affected ?? 0) !== 1) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    return this.findSuccessPlanById(id, orgId);
  }

  async createReturnVisit(
    orgId: string,
    dto: CreateReturnVisitDto,
    userId: string,
  ): Promise<CustomerReturnVisit> {
    const visit = this.visitRepository.create({
      orgId,
      customerId: dto.customerId,
      visitType: dto.visitType,
      summary: dto.summary,
      nextVisitAt: dto.nextVisitAt ? new Date(dto.nextVisitAt) : null,
      createdBy: userId,
    });

    return this.visitRepository.save(visit);
  }

  async findReturnVisits(
    orgId: string,
    customerId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: CustomerReturnVisit[]; total: number }> {
    const qb = this.visitRepository
      .createQueryBuilder('v')
      .where('v.orgId = :orgId', { orgId })
      .andWhere('v.customerId = :customerId', { customerId });

    qb.orderBy('v.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async autoEnrollCustomer(
    orgId: string,
    customerId: string,
    userId: string,
  ): Promise<{ health: CustomerHealthScore; plan: SuccessPlan }> {
    const health = await this.evaluateHealth(customerId, orgId, userId);

    let plan = await this.planRepository.findOne({
      where: { customerId, orgId, deletedAt: null as unknown as undefined },
    });

    if (!plan) {
      plan = await this.createSuccessPlan(orgId, {
        customerId,
        title: `${customerId.slice(0, 8)} 初始成功计划`,
        ownerUserId: userId,
        payload: { autoCreated: true, source: 'deal_chain' },
      }, userId);
    }

    return { health, plan };
  }
}
