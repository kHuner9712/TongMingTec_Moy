import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AddOn } from './entities/add-on.entity';
import { Plan } from './entities/plan.entity';
import { QuotaPolicy } from './entities/quota-policy.entity';
import {
  AddOnListQueryDto,
  AddOnStatusChangeDto,
  CreateAddOnDto,
  CreatePlanDto,
  CreateQuotaPolicyDto,
  PlanListQueryDto,
  PlanStatusChangeDto,
  QuotaPolicyListQueryDto,
  QuotaPolicyStatusChangeDto,
  UpdateAddOnDto,
  UpdatePlanDto,
  UpdateQuotaPolicyDto,
} from './dto/plan.dto';
import { isUniqueConstraintViolation } from '../../common/utils/business-no.util';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(AddOn)
    private readonly addOnRepository: Repository<AddOn>,
    @InjectRepository(QuotaPolicy)
    private readonly quotaPolicyRepository: Repository<QuotaPolicy>,
  ) {}

  async findPlans(orgId: string, query: PlanListQueryDto) {
    const qb = this.planRepository
      .createQueryBuilder('p')
      .where('p.orgId = :orgId', { orgId })
      .andWhere('p.deletedAt IS NULL');

    if (query.status) {
      qb.andWhere('p.status = :status', { status: query.status });
    }
    if (query.billingCycle) {
      qb.andWhere('p.billingCycle = :billingCycle', { billingCycle: query.billingCycle });
    }
    if (query.scopeType) {
      qb.andWhere('p.scopeType = :scopeType', { scopeType: query.scopeType });
    }
    if (query.keyword) {
      qb.andWhere('(p.code ILIKE :keyword OR p.name ILIKE :keyword)', {
        keyword: `%${query.keyword}%`,
      });
    }

    qb.orderBy('p.updatedAt', 'DESC');
    qb.skip(((query.page || 1) - 1) * (query.page_size || 20)).take(query.page_size || 20);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findActivePlans(orgId: string): Promise<Plan[]> {
    return this.planRepository.find({
      where: { orgId, status: 'active', deletedAt: null as unknown as undefined },
      order: { updatedAt: 'DESC' },
    });
  }

  async findPlanById(id: string, orgId: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: { id, orgId, deletedAt: null as unknown as undefined },
    });
    if (!plan) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }
    return plan;
  }

  async findPlanDetail(id: string, orgId: string): Promise<{ plan: Plan; addOns: AddOn[]; quotaPolicies: QuotaPolicy[] }> {
    const plan = await this.findPlanById(id, orgId);
    const [addOns, quotaPolicies] = await Promise.all([
      this.addOnRepository.find({
        where: { orgId, planId: plan.id, deletedAt: null as unknown as undefined },
        order: { updatedAt: 'DESC' },
      }),
      this.quotaPolicyRepository.find({
        where: { orgId, planId: plan.id, deletedAt: null as unknown as undefined },
        order: { updatedAt: 'DESC' },
      }),
    ]);

    return { plan, addOns, quotaPolicies };
  }

  async createPlan(orgId: string, dto: CreatePlanDto, userId: string): Promise<Plan> {
    const scopeType = dto.scopeType || 'org';
    const scopeOrgId = scopeType === 'org' ? dto.scopeOrgId || orgId : null;

    const plan = this.planRepository.create({
      orgId,
      code: dto.code,
      name: dto.name,
      description: dto.description || null,
      billingCycle: dto.billingCycle || 'monthly',
      basePrice: dto.basePrice,
      currency: dto.currency || 'CNY',
      seatLimit: dto.seatLimit || 1,
      featureFlagsJson: dto.featureFlagsJson || {},
      status: dto.status || 'active',
      scopeType,
      scopeOrgId,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      createdBy: userId,
    });

    return this.safeSavePlan(plan);
  }

  async updatePlan(id: string, orgId: string, dto: UpdatePlanDto, userId: string): Promise<Plan> {
    const plan = await this.findPlanById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(plan.version, dto.version);

    const scopeType = dto.scopeType ?? plan.scopeType;
    const scopeOrgId = scopeType === 'org'
      ? (dto.scopeOrgId ?? plan.scopeOrgId ?? orgId)
      : null;

    await this.updatePlanWithVersion(id, orgId, expectedVersion, {
      name: dto.name ?? plan.name,
      description: dto.description ?? plan.description,
      billingCycle: dto.billingCycle ?? plan.billingCycle,
      basePrice: dto.basePrice ?? plan.basePrice,
      currency: dto.currency ?? plan.currency,
      seatLimit: dto.seatLimit ?? plan.seatLimit,
      scopeType,
      scopeOrgId,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : plan.effectiveFrom,
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : plan.effectiveTo,
      featureFlagsJson: dto.featureFlagsJson ?? plan.featureFlagsJson,
      updatedBy: userId,
    });

    return this.findPlanById(id, orgId);
  }

  async changePlanStatus(id: string, orgId: string, dto: PlanStatusChangeDto, userId: string): Promise<Plan> {
    const plan = await this.findPlanById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(plan.version, dto.version);

    if (plan.status === 'archived' && dto.status !== 'archived') {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    await this.updatePlanWithVersion(id, orgId, expectedVersion, {
      status: dto.status,
      updatedBy: userId,
    });

    return this.findPlanById(id, orgId);
  }

  async deletePlan(id: string, orgId: string, userId: string, version?: number): Promise<void> {
    const plan = await this.findPlanById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(plan.version, version);

    await this.updatePlanWithVersion(id, orgId, expectedVersion, {
      deletedAt: new Date(),
      updatedBy: userId,
    });
  }

  async findAddOns(orgId: string, query: AddOnListQueryDto) {
    const qb = this.addOnRepository
      .createQueryBuilder('a')
      .where('a.orgId = :orgId', { orgId })
      .andWhere('a.deletedAt IS NULL');

    if (query.status) {
      qb.andWhere('a.status = :status', { status: query.status });
    }
    if (query.billingType) {
      qb.andWhere('a.billingType = :billingType', { billingType: query.billingType });
    }
    if (query.planId) {
      qb.andWhere('a.planId = :planId', { planId: query.planId });
    }

    qb.orderBy('a.updatedAt', 'DESC');
    qb.skip(((query.page || 1) - 1) * (query.page_size || 20)).take(query.page_size || 20);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findAddOnById(id: string, orgId: string): Promise<AddOn> {
    const addOn = await this.addOnRepository.findOne({
      where: { id, orgId, deletedAt: null as unknown as undefined },
    });
    if (!addOn) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }
    return addOn;
  }

  async createAddOn(orgId: string, dto: CreateAddOnDto, userId: string): Promise<AddOn> {
    if (dto.planId) {
      await this.findPlanById(dto.planId, orgId);
    }

    const addOn = this.addOnRepository.create({
      orgId,
      planId: dto.planId || null,
      code: dto.code,
      name: dto.name,
      description: dto.description || null,
      billingType: dto.billingType || 'one_time',
      unitPrice: dto.unitPrice,
      currency: dto.currency || 'CNY',
      quotaDeltaJson: dto.quotaDeltaJson || null,
      status: dto.status || 'active',
      createdBy: userId,
    });

    return this.safeSaveAddOn(addOn);
  }

  async updateAddOn(id: string, orgId: string, dto: UpdateAddOnDto, userId: string): Promise<AddOn> {
    const addOn = await this.findAddOnById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(addOn.version, dto.version);

    await this.updateAddOnWithVersion(id, orgId, expectedVersion, {
      name: dto.name ?? addOn.name,
      description: dto.description ?? addOn.description,
      billingType: dto.billingType ?? addOn.billingType,
      unitPrice: dto.unitPrice ?? addOn.unitPrice,
      currency: dto.currency ?? addOn.currency,
      quotaDeltaJson: dto.quotaDeltaJson ?? addOn.quotaDeltaJson,
      updatedBy: userId,
    });

    return this.findAddOnById(id, orgId);
  }

  async changeAddOnStatus(id: string, orgId: string, dto: AddOnStatusChangeDto, userId: string): Promise<AddOn> {
    const addOn = await this.findAddOnById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(addOn.version, dto.version);

    if (addOn.status === 'archived' && dto.status !== 'archived') {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    await this.updateAddOnWithVersion(id, orgId, expectedVersion, {
      status: dto.status,
      updatedBy: userId,
    });

    return this.findAddOnById(id, orgId);
  }

  async deleteAddOn(id: string, orgId: string, userId: string, version?: number): Promise<void> {
    const addOn = await this.findAddOnById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(addOn.version, version);

    await this.updateAddOnWithVersion(id, orgId, expectedVersion, {
      deletedAt: new Date(),
      updatedBy: userId,
    });
  }

  async findQuotaPolicies(orgId: string, query: QuotaPolicyListQueryDto) {
    const qb = this.quotaPolicyRepository
      .createQueryBuilder('q')
      .where('q.orgId = :orgId', { orgId })
      .andWhere('q.deletedAt IS NULL');

    if (query.status) {
      qb.andWhere('q.status = :status', { status: query.status });
    }
    if (query.planId) {
      qb.andWhere('q.planId = :planId', { planId: query.planId });
    }
    if (query.addOnId) {
      qb.andWhere('q.addOnId = :addOnId', { addOnId: query.addOnId });
    }
    if (query.metricCode) {
      qb.andWhere('q.metricCode = :metricCode', { metricCode: query.metricCode });
    }

    qb.orderBy('q.updatedAt', 'DESC');
    qb.skip(((query.page || 1) - 1) * (query.page_size || 20)).take(query.page_size || 20);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findQuotaPolicyById(id: string, orgId: string): Promise<QuotaPolicy> {
    const quotaPolicy = await this.quotaPolicyRepository.findOne({
      where: { id, orgId, deletedAt: null as unknown as undefined },
    });
    if (!quotaPolicy) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }
    return quotaPolicy;
  }

  async createQuotaPolicy(orgId: string, dto: CreateQuotaPolicyDto, userId: string): Promise<QuotaPolicy> {
    if (!dto.planId && !dto.addOnId) {
      throw new BadRequestException('PARAM_INVALID');
    }

    if (dto.planId) {
      await this.findPlanById(dto.planId, orgId);
    }
    if (dto.addOnId) {
      await this.findAddOnById(dto.addOnId, orgId);
    }

    const quotaPolicy = this.quotaPolicyRepository.create({
      orgId,
      planId: dto.planId || null,
      addOnId: dto.addOnId || null,
      metricCode: dto.metricCode,
      limitValue: dto.limitValue,
      resetCycle: dto.resetCycle || 'monthly',
      overageStrategy: dto.overageStrategy || 'block',
      status: dto.status || 'active',
      createdBy: userId,
    });

    return this.quotaPolicyRepository.save(quotaPolicy);
  }

  async updateQuotaPolicy(
    id: string,
    orgId: string,
    dto: UpdateQuotaPolicyDto,
    userId: string,
  ): Promise<QuotaPolicy> {
    const quotaPolicy = await this.findQuotaPolicyById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(quotaPolicy.version, dto.version);

    await this.updateQuotaPolicyWithVersion(id, orgId, expectedVersion, {
      limitValue: dto.limitValue ?? quotaPolicy.limitValue,
      resetCycle: dto.resetCycle ?? quotaPolicy.resetCycle,
      overageStrategy: dto.overageStrategy ?? quotaPolicy.overageStrategy,
      status: dto.status ?? quotaPolicy.status,
      updatedBy: userId,
    });

    return this.findQuotaPolicyById(id, orgId);
  }

  async changeQuotaPolicyStatus(
    id: string,
    orgId: string,
    dto: QuotaPolicyStatusChangeDto,
    userId: string,
  ): Promise<QuotaPolicy> {
    const quotaPolicy = await this.findQuotaPolicyById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(quotaPolicy.version, dto.version);

    if (quotaPolicy.status === 'archived' && dto.status !== 'archived') {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    await this.updateQuotaPolicyWithVersion(id, orgId, expectedVersion, {
      status: dto.status,
      updatedBy: userId,
    });

    return this.findQuotaPolicyById(id, orgId);
  }

  async deleteQuotaPolicy(id: string, orgId: string, userId: string, version?: number): Promise<void> {
    const quotaPolicy = await this.findQuotaPolicyById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(quotaPolicy.version, version);

    await this.updateQuotaPolicyWithVersion(id, orgId, expectedVersion, {
      deletedAt: new Date(),
      updatedBy: userId,
    });
  }

  private resolveExpectedVersion(currentVersion: number, providedVersion?: number): number {
    if (providedVersion === undefined) {
      return currentVersion;
    }
    if (!Number.isInteger(providedVersion) || providedVersion < 1) {
      throw new BadRequestException('PARAM_INVALID');
    }
    if (providedVersion !== currentVersion) {
      throw new ConflictException('CONFLICT_VERSION');
    }
    return providedVersion;
  }

  private async safeSavePlan(plan: Plan): Promise<Plan> {
    try {
      return await this.planRepository.save(plan);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException('DUPLICATE_CODE');
      }
      throw error;
    }
  }

  private async safeSaveAddOn(addOn: AddOn): Promise<AddOn> {
    try {
      return await this.addOnRepository.save(addOn);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException('DUPLICATE_CODE');
      }
      throw error;
    }
  }

  private async updatePlanWithVersion(
    id: string,
    orgId: string,
    expectedVersion: number,
    patch: Partial<Plan>,
  ): Promise<void> {
    const result = await this.planRepository.update(
      { id, orgId, version: expectedVersion, deletedAt: IsNull() },
      {
        ...(patch as Record<string, unknown>),
        version: () => 'version + 1',
      } as any,
    );

    if ((result.affected ?? 0) !== 1) {
      throw new ConflictException('CONFLICT_VERSION');
    }
  }

  private async updateAddOnWithVersion(
    id: string,
    orgId: string,
    expectedVersion: number,
    patch: Partial<AddOn>,
  ): Promise<void> {
    const result = await this.addOnRepository.update(
      { id, orgId, version: expectedVersion, deletedAt: IsNull() },
      {
        ...(patch as Record<string, unknown>),
        version: () => 'version + 1',
      } as any,
    );

    if ((result.affected ?? 0) !== 1) {
      throw new ConflictException('CONFLICT_VERSION');
    }
  }

  private async updateQuotaPolicyWithVersion(
    id: string,
    orgId: string,
    expectedVersion: number,
    patch: Partial<QuotaPolicy>,
  ): Promise<void> {
    const result = await this.quotaPolicyRepository.update(
      { id, orgId, version: expectedVersion, deletedAt: IsNull() },
      {
        ...(patch as Record<string, unknown>),
        version: () => 'version + 1',
      } as any,
    );

    if ((result.affected ?? 0) !== 1) {
      throw new ConflictException('CONFLICT_VERSION');
    }
  }
}
