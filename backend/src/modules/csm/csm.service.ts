import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerHealthScore, HealthLevel } from './entities/customer-health-score.entity';
import { SuccessPlan, SuccessPlanStatus } from './entities/success-plan.entity';
import { CustomerReturnVisit } from './entities/customer-return-visit.entity';
import {
  CreateSuccessPlanDto,
  UpdateSuccessPlanDto,
  CreateReturnVisitDto,
} from './dto/csm.dto';

@Injectable()
export class CsmService {
  constructor(
    @InjectRepository(CustomerHealthScore)
    private healthRepository: Repository<CustomerHealthScore>,
    @InjectRepository(SuccessPlan)
    private planRepository: Repository<SuccessPlan>,
    @InjectRepository(CustomerReturnVisit)
    private visitRepository: Repository<CustomerReturnVisit>,
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
  ): Promise<CustomerHealthScore> {
    const factors: Record<string, unknown> = {};
    let score = 50;

    const existing = await this.healthRepository.findOne({
      where: { customerId, orgId, deletedAt: null as unknown as undefined },
    });

    const level = this.calculateLevel(score);
    factors['autoEvaluated'] = true;
    factors['evaluatedAt'] = new Date().toISOString();

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
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.payload !== undefined) updateData.payload = dto.payload;

    await this.planRepository.update(id, {
      ...updateData,
      updatedBy: userId,
      version: () => 'version + 1',
    });

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
