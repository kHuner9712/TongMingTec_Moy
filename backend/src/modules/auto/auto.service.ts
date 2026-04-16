import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationTrigger, TriggerStatus } from './entities/automation-trigger.entity';
import { CreateAutomationTriggerDto, UpdateAutomationTriggerDto } from './dto/automation-trigger.dto';

@Injectable()
export class AutoService {
  private readonly logger = new Logger(AutoService.name);

  constructor(
    @InjectRepository(AutomationTrigger)
    private triggerRepository: Repository<AutomationTrigger>,
  ) {}

  async findTriggers(
    orgId: string,
    filters: { status?: string; eventType?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: AutomationTrigger[]; total: number }> {
    const qb = this.triggerRepository
      .createQueryBuilder('t')
      .where('t.orgId = :orgId', { orgId })
      .andWhere('t.deletedAt IS NULL');

    if (filters.status) {
      qb.andWhere('t.status = :status', { status: filters.status });
    }
    if (filters.eventType) {
      qb.andWhere('t.eventType = :eventType', { eventType: filters.eventType });
    }

    qb.orderBy('t.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findTriggerById(id: string, orgId: string): Promise<AutomationTrigger> {
    const trigger = await this.triggerRepository.findOne({
      where: { id, orgId, deletedAt: null as unknown as undefined },
    });
    if (!trigger) throw new NotFoundException('RESOURCE_NOT_FOUND');
    return trigger;
  }

  async createTrigger(
    orgId: string,
    dto: CreateAutomationTriggerDto,
    userId: string,
  ): Promise<AutomationTrigger> {
    const trigger = this.triggerRepository.create({
      orgId,
      name: dto.name,
      eventType: dto.eventType,
      actionType: dto.actionType,
      condition: dto.condition || {},
      actionPayload: dto.actionPayload || {},
      status: 'active' as TriggerStatus,
      executionCount: 0,
      failureCount: 0,
      createdBy: userId,
    });

    return this.triggerRepository.save(trigger);
  }

  async updateTrigger(
    id: string,
    orgId: string,
    dto: UpdateAutomationTriggerDto,
    userId: string,
  ): Promise<AutomationTrigger> {
    const trigger = await this.findTriggerById(id, orgId);

    if (trigger.version !== dto.version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.eventType !== undefined) updateData.eventType = dto.eventType;
    if (dto.actionType !== undefined) updateData.actionType = dto.actionType;
    if (dto.condition !== undefined) updateData.condition = dto.condition;
    if (dto.actionPayload !== undefined) updateData.actionPayload = dto.actionPayload;
    if (dto.status !== undefined) updateData.status = dto.status;

    await this.triggerRepository.update(id, {
      ...updateData,
      updatedBy: userId,
      version: () => 'version + 1',
    });

    return this.findTriggerById(id, orgId);
  }

  async deleteTrigger(id: string, orgId: string, userId: string): Promise<void> {
    const trigger = await this.findTriggerById(id, orgId);
    if (trigger.status === 'active') {
      throw new ConflictException('CANNOT_DELETE_ACTIVE_TRIGGER');
    }
    await this.triggerRepository.update(id, { deletedAt: new Date(), updatedBy: userId });
  }

  async findActiveTriggersByEventType(
    orgId: string,
    eventType: string,
  ): Promise<AutomationTrigger[]> {
    return this.triggerRepository.find({
      where: {
        orgId,
        eventType,
        status: 'active' as TriggerStatus,
        deletedAt: null as unknown as undefined,
      },
    });
  }

  async recordExecution(id: string, orgId: string, success: boolean): Promise<void> {
    const updateData: Record<string, unknown> = {
      lastExecutedAt: new Date(),
    };

    if (success) {
      updateData.executionCount = () => 'execution_count + 1';
    } else {
      updateData.failureCount = () => 'failure_count + 1';
    }

    await this.triggerRepository.update(id, updateData);
  }

  evaluateCondition(
    condition: Record<string, unknown>,
    eventPayload: Record<string, unknown>,
  ): boolean {
    if (!condition || Object.keys(condition).length === 0) {
      return true;
    }

    for (const [key, expectedValue] of Object.entries(condition)) {
      const actualValue = eventPayload[key];
      if (actualValue === undefined) return false;
      if (typeof expectedValue === 'object' && expectedValue !== null) {
        if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) return false;
      } else if (actualValue !== expectedValue) {
        return false;
      }
    }

    return true;
  }
}
