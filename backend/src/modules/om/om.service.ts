import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opportunity, OpportunityStage, OpportunityResult } from './entities/opportunity.entity';
import { OpportunityStageHistory } from './entities/opportunity-stage-history.entity';

const STAGE_ORDER = [
  OpportunityStage.DISCOVERY,
  OpportunityStage.QUALIFICATION,
  OpportunityStage.PROPOSAL,
  OpportunityStage.NEGOTIATION,
];

@Injectable()
export class OmService {
  constructor(
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
    @InjectRepository(OpportunityStageHistory)
    private historyRepository: Repository<OpportunityStageHistory>,
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

    const currentIndex = STAGE_ORDER.indexOf(opp.stage);
    const targetIndex = STAGE_ORDER.indexOf(toStage);

    if (targetIndex < currentIndex - 1 || targetIndex > currentIndex + 1) {
      throw new BadRequestException('STATUS_TRANSITION_INVALID');
    }

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
      throw new BadRequestException('STATUS_TRANSITION_INVALID');
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

    return this.findOpportunityById(id, orgId);
  }

  async findStageHistory(id: string, orgId: string): Promise<OpportunityStageHistory[]> {
    return this.historyRepository.find({
      where: { opportunityId: id, orgId },
      order: { changedAt: 'DESC' },
    });
  }
}
