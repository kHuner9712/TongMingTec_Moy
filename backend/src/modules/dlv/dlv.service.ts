import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { DeliveryOrder } from './entities/delivery-order.entity';
import { DeliveryMilestone } from './entities/delivery-milestone.entity';
import { DeliveryTask } from './entities/delivery-task.entity';
import { DeliveryAcceptance } from './entities/delivery-acceptance.entity';
import { DeliveryRisk } from './entities/delivery-risk.entity';
import { DeliveryOutcome } from './entities/delivery-outcome.entity';
import {
  ChangeDeliveryStatusDto,
  CreateAcceptanceDto,
  CreateDeliveryDto,
  CreateDeliveryTaskDto,
  CreateMilestoneDto,
  CreateOutcomeDto,
  CreateRiskDto,
  UpdateDeliveryDto,
  UpdateDeliveryTaskDto,
  UpdateMilestoneDto,
  UpdateOutcomeDto,
  UpdateRiskDto,
} from './dto/dlv.dto';
import {
  DeliveryStatus,
  deliveryStateMachine,
} from '../../common/statemachine/definitions/delivery.sm';
import { EventBusService } from '../../common/events/event-bus.service';
import {
  deliveryAcceptanceRecorded,
  deliveryCreated,
  deliveryOutcomeUpdated,
  deliveryRiskReported,
  deliveryStatusChanged,
} from '../../common/events/delivery-events';
import { TskService } from '../tsk/tsk.service';
import { TaskSourceType } from '../tsk/entities/task.entity';
import { NtfService } from '../ntf/ntf.service';
import { NotificationType } from '../ntf/entities/notification.entity';
import {
  generateBusinessNo,
  isUniqueConstraintViolation,
} from '../../common/utils/business-no.util';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class DlvService {
  constructor(
    @InjectRepository(DeliveryOrder)
    private readonly deliveryRepository: Repository<DeliveryOrder>,
    @InjectRepository(DeliveryMilestone)
    private readonly milestoneRepository: Repository<DeliveryMilestone>,
    @InjectRepository(DeliveryTask)
    private readonly deliveryTaskRepository: Repository<DeliveryTask>,
    @InjectRepository(DeliveryAcceptance)
    private readonly acceptanceRepository: Repository<DeliveryAcceptance>,
    @InjectRepository(DeliveryRisk)
    private readonly riskRepository: Repository<DeliveryRisk>,
    @InjectRepository(DeliveryOutcome)
    private readonly outcomeRepository: Repository<DeliveryOutcome>,
    private readonly eventBus: EventBusService,
    private readonly tskService: TskService,
    private readonly ntfService: NtfService,
  ) {}

  async findDeliveries(
    orgId: string,
    filters: {
      status?: string;
      customerId?: string;
      orderId?: string;
      subscriptionId?: string;
    },
    page: number,
    pageSize: number,
  ): Promise<{ items: DeliveryOrder[]; total: number }> {
    const qb = this.deliveryRepository
      .createQueryBuilder('d')
      .where('d.orgId = :orgId', { orgId })
      .andWhere('d.deletedAt IS NULL');

    if (filters.status) qb.andWhere('d.status = :status', { status: filters.status });
    if (filters.customerId) qb.andWhere('d.customerId = :customerId', { customerId: filters.customerId });
    if (filters.orderId) qb.andWhere('d.orderId = :orderId', { orderId: filters.orderId });
    if (filters.subscriptionId) qb.andWhere('d.subscriptionId = :subscriptionId', { subscriptionId: filters.subscriptionId });

    qb.orderBy('d.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findDeliveryById(id: string, orgId: string): Promise<DeliveryOrder> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id, orgId, deletedAt: null as unknown as undefined },
    });
    if (!delivery) throw new NotFoundException('RESOURCE_NOT_FOUND');
    return delivery;
  }

  async findDeliveryByOrderId(orderId: string, orgId: string): Promise<DeliveryOrder> {
    const delivery = await this.deliveryRepository.findOne({
      where: { orderId, orgId, deletedAt: null as unknown as undefined },
    });
    if (!delivery) throw new NotFoundException('RESOURCE_NOT_FOUND');
    return delivery;
  }

  async findDeliveryBySubscriptionId(subscriptionId: string, orgId: string): Promise<DeliveryOrder> {
    const delivery = await this.deliveryRepository.findOne({
      where: { subscriptionId, orgId, deletedAt: null as unknown as undefined },
    });
    if (!delivery) throw new NotFoundException('RESOURCE_NOT_FOUND');
    return delivery;
  }

  async findDeliveryDetail(
    id: string,
    orgId: string,
  ): Promise<{
    delivery: DeliveryOrder;
    milestones: DeliveryMilestone[];
    tasks: DeliveryTask[];
    acceptances: DeliveryAcceptance[];
    risks: DeliveryRisk[];
    outcomes: DeliveryOutcome[];
  }> {
    const delivery = await this.findDeliveryById(id, orgId);

    const [milestones, tasks, acceptances, risks, outcomes] = await Promise.all([
      this.milestoneRepository.find({
        where: { deliveryId: id, orgId, deletedAt: null as unknown as undefined },
        order: { sequence: 'ASC', createdAt: 'ASC' },
      }),
      this.deliveryTaskRepository.find({
        where: { deliveryId: id, orgId, deletedAt: null as unknown as undefined },
        order: { createdAt: 'ASC' },
      }),
      this.acceptanceRepository.find({
        where: { deliveryId: id, orgId, deletedAt: null as unknown as undefined },
        order: { createdAt: 'DESC' },
      }),
      this.riskRepository.find({
        where: { deliveryId: id, orgId, deletedAt: null as unknown as undefined },
        order: { createdAt: 'DESC' },
      }),
      this.outcomeRepository.find({
        where: { deliveryId: id, orgId, deletedAt: null as unknown as undefined },
        order: { createdAt: 'ASC' },
      }),
    ]);

    return { delivery, milestones, tasks, acceptances, risks, outcomes };
  }

  async createDelivery(
    orgId: string,
    dto: CreateDeliveryDto,
    userId: string,
    options?: {
      allowExistingForOrder?: boolean;
      source?: 'manual' | 'order_activation' | 'subscription_opened';
    },
  ): Promise<DeliveryOrder> {
    if (dto.orderId) {
      const existing = await this.deliveryRepository.findOne({
        where: {
          orgId,
          orderId: dto.orderId,
          deletedAt: null as unknown as undefined,
        },
      });

      if (existing) {
        if (options?.allowExistingForOrder) return existing;
        throw new ConflictException('DELIVERY_ALREADY_EXISTS_FOR_ORDER');
      }
    }

    const ownerUserId = dto.ownerUserId || userId;
    const saved = await this.saveDeliveryWithUniqueNo(orgId, {
      title: dto.title,
      description: dto.description || null,
      customerId: dto.customerId,
      contractId: dto.contractId || null,
      orderId: dto.orderId || null,
      paymentId: dto.paymentId || null,
      subscriptionId: dto.subscriptionId || null,
      successPlanId: dto.successPlanId || null,
      ownerUserId,
      status: 'draft',
      targetOutcomeSummary: dto.targetOutcomeSummary || null,
      createdBy: userId,
    });

    this.eventBus.publish(
      deliveryCreated({
        orgId,
        deliveryId: saved.id,
        customerId: saved.customerId,
        orderId: saved.orderId,
        subscriptionId: saved.subscriptionId,
        ownerUserId: saved.ownerUserId,
        actorType: options?.source === 'manual' ? 'user' : 'system',
        actorId: userId,
      }),
    );

    if (saved.ownerUserId) {
      await this.createKickoffTask(orgId, saved, saved.ownerUserId, userId);
      await this.safeNotify(
        orgId,
        saved.ownerUserId,
        NotificationType.SYSTEM_ANNOUNCEMENT,
        `交付单 ${saved.deliveryNo} 已创建`,
        `${saved.title} 已建立，请开始交付实施。`,
        'delivery',
        saved.id,
      );
    }

    return saved;
  }

  async updateDelivery(
    id: string,
    orgId: string,
    dto: UpdateDeliveryDto,
    userId: string,
  ): Promise<DeliveryOrder> {
    const delivery = await this.findDeliveryById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(delivery.version, dto.version);

    const updateData: Record<string, unknown> = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.paymentId !== undefined) updateData.paymentId = dto.paymentId;
    if (dto.subscriptionId !== undefined) updateData.subscriptionId = dto.subscriptionId;
    if (dto.successPlanId !== undefined) updateData.successPlanId = dto.successPlanId;
    if (dto.ownerUserId !== undefined) updateData.ownerUserId = dto.ownerUserId;
    if (dto.targetOutcomeSummary !== undefined) {
      updateData.targetOutcomeSummary = dto.targetOutcomeSummary;
    }

    await this.updateDeliveryWithVersion(id, orgId, expectedVersion, {
      ...(updateData as object),
      updatedBy: userId,
    } as never);

    return this.findDeliveryById(id, orgId);
  }

  async changeStatus(
    id: string,
    orgId: string,
    dto: ChangeDeliveryStatusDto,
    userId: string,
  ): Promise<DeliveryOrder> {
    const delivery = await this.findDeliveryById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(delivery.version, dto.version);

    const fromStatus = delivery.status;
    deliveryStateMachine.validateTransition(fromStatus, dto.status);

    const patch: Record<string, unknown> = {
      status: dto.status,
      updatedBy: userId,
    };

    if (dto.status === 'active' && !delivery.startedAt) {
      patch.startedAt = new Date();
    }
    if (dto.status === 'ready_for_acceptance') {
      patch.readyForAcceptanceAt = new Date();
    }
    if (dto.status === 'accepted') {
      patch.acceptedAt = new Date();
    }
    if (dto.status === 'closed') {
      patch.closedAt = new Date();
    }

    await this.updateDeliveryWithVersion(id, orgId, expectedVersion, patch as never);

    this.eventBus.publish(
      deliveryStatusChanged({
        orgId,
        deliveryId: id,
        customerId: delivery.customerId,
        fromStatus,
        toStatus: dto.status,
        reason: dto.reason,
        actorType: userId === SYSTEM_USER_ID ? 'system' : 'user',
        actorId: userId,
      }),
    );

    const updated = await this.findDeliveryById(id, orgId);

    if (updated.ownerUserId && ['blocked', 'ready_for_acceptance', 'accepted', 'closed'].includes(dto.status)) {
      const statusMap: Record<DeliveryStatus, string> = {
        draft: '草稿',
        active: '进行中',
        blocked: '已阻塞',
        ready_for_acceptance: '待验收',
        accepted: '已验收',
        closed: '已关闭',
      };
      await this.safeNotify(
        orgId,
        updated.ownerUserId,
        NotificationType.SYSTEM_ANNOUNCEMENT,
        `交付单 ${updated.deliveryNo} 状态变更`,
        `状态已更新为「${statusMap[dto.status]}」${dto.reason ? `，原因：${dto.reason}` : ''}`,
        'delivery',
        updated.id,
      );
    }

    return updated;
  }

  async deleteDelivery(
    id: string,
    orgId: string,
    userId: string,
    version?: number,
  ): Promise<void> {
    const delivery = await this.findDeliveryById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(delivery.version, version);
    if (!['draft', 'active'].includes(delivery.status)) {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    await this.updateDeliveryWithVersion(id, orgId, expectedVersion, {
      deletedAt: new Date(),
      updatedBy: userId,
    } as never);
  }

  async createMilestone(
    deliveryId: string,
    orgId: string,
    dto: CreateMilestoneDto,
    userId: string,
  ): Promise<DeliveryMilestone> {
    await this.findDeliveryById(deliveryId, orgId);

    const entity = this.milestoneRepository.create({
      orgId,
      deliveryId,
      title: dto.title,
      description: dto.description || null,
      sequence: dto.sequence || 1,
      status: dto.status || 'pending',
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      completedAt: dto.status === 'done' ? new Date() : null,
      createdBy: userId,
    });

    return this.milestoneRepository.save(entity);
  }

  async updateMilestone(
    id: string,
    deliveryId: string,
    orgId: string,
    dto: UpdateMilestoneDto,
    userId: string,
  ): Promise<DeliveryMilestone> {
    await this.findDeliveryById(deliveryId, orgId);

    const milestone = await this.milestoneRepository.findOne({
      where: { id, deliveryId, orgId, deletedAt: null as unknown as undefined },
    });

    if (!milestone) throw new NotFoundException('RESOURCE_NOT_FOUND');
    if (milestone.version !== dto.version) throw new ConflictException('CONFLICT_VERSION');

    const patch: Record<string, unknown> = {
      updatedBy: userId,
      version: () => 'version + 1',
    };

    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.sequence !== undefined) patch.sequence = dto.sequence;
    if (dto.status !== undefined) {
      patch.status = dto.status;
      patch.completedAt = dto.status === 'done' ? new Date() : null;
    }
    if (dto.dueAt !== undefined) patch.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;

    await this.milestoneRepository.update(id, patch as never);

    const updated = await this.milestoneRepository.findOne({
      where: { id, orgId, deliveryId, deletedAt: null as unknown as undefined },
    });
    if (!updated) throw new NotFoundException('RESOURCE_NOT_FOUND');

    return updated;
  }

  async createDeliveryTask(
    deliveryId: string,
    orgId: string,
    dto: CreateDeliveryTaskDto,
    userId: string,
  ): Promise<DeliveryTask> {
    const delivery = await this.findDeliveryById(deliveryId, orgId);
    const ownerUserId = dto.ownerUserId || delivery.ownerUserId || userId;

    let linkedTaskId: string | null = null;
    if (ownerUserId) {
      try {
        const linked = await this.tskService.createTask(
          orgId,
          {
            title: dto.title,
            description: dto.description || null,
            assigneeUserId: ownerUserId,
            sourceType: TaskSourceType.DELIVERY,
            sourceId: deliveryId,
            dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
          },
          userId,
        );
        linkedTaskId = linked.id;

        await this.safeNotify(
          orgId,
          ownerUserId,
          NotificationType.TASK_ASSIGNED,
          '交付任务已分配',
          dto.title,
          'delivery',
          deliveryId,
        );
      } catch {
        linkedTaskId = null;
      }
    }

    const entity = this.deliveryTaskRepository.create({
      orgId,
      deliveryId,
      title: dto.title,
      description: dto.description || null,
      ownerUserId,
      linkedTaskId,
      status: 'pending',
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      completedAt: null,
      createdBy: userId,
    });

    return this.deliveryTaskRepository.save(entity);
  }

  async updateDeliveryTask(
    id: string,
    deliveryId: string,
    orgId: string,
    dto: UpdateDeliveryTaskDto,
    userId: string,
  ): Promise<DeliveryTask> {
    await this.findDeliveryById(deliveryId, orgId);

    const task = await this.deliveryTaskRepository.findOne({
      where: { id, deliveryId, orgId, deletedAt: null as unknown as undefined },
    });

    if (!task) throw new NotFoundException('RESOURCE_NOT_FOUND');
    if (task.version !== dto.version) throw new ConflictException('CONFLICT_VERSION');

    const patch: Record<string, unknown> = {
      updatedBy: userId,
      version: () => 'version + 1',
    };

    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.ownerUserId !== undefined) patch.ownerUserId = dto.ownerUserId;
    if (dto.status !== undefined) {
      patch.status = dto.status;
      patch.completedAt = dto.status === 'done' ? new Date() : null;
    }
    if (dto.dueAt !== undefined) patch.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;

    await this.deliveryTaskRepository.update(id, patch as never);

    const updated = await this.deliveryTaskRepository.findOne({
      where: { id, orgId, deliveryId, deletedAt: null as unknown as undefined },
    });
    if (!updated) throw new NotFoundException('RESOURCE_NOT_FOUND');

    return updated;
  }

  async createAcceptance(
    deliveryId: string,
    orgId: string,
    dto: CreateAcceptanceDto,
    userId: string,
  ): Promise<DeliveryAcceptance> {
    const delivery = await this.findDeliveryById(deliveryId, orgId);

    const result = dto.result || 'pending';
    const entity = this.acceptanceRepository.create({
      orgId,
      deliveryId,
      acceptanceType: dto.acceptanceType || 'milestone',
      result,
      summary: dto.summary,
      acceptedByUserId: result === 'accepted' ? userId : null,
      acceptedAt: result === 'accepted' ? new Date() : null,
      payload: dto.payload || {},
      createdBy: userId,
    });

    const saved = await this.acceptanceRepository.save(entity);

    this.eventBus.publish(
      deliveryAcceptanceRecorded({
        orgId,
        deliveryId,
        acceptanceId: saved.id,
        result: saved.result,
        actorType: userId === SYSTEM_USER_ID ? 'system' : 'user',
        actorId: userId,
      }),
    );

    if (saved.result === 'accepted' && delivery.status === 'ready_for_acceptance') {
      try {
        await this.changeStatus(
          deliveryId,
          orgId,
          {
            status: 'accepted',
            version: delivery.version,
            reason: '验收记录通过，自动变更为已验收',
          },
          userId,
        );
      } catch {
        // no-op
      }
    }

    return saved;
  }

  async createRisk(
    deliveryId: string,
    orgId: string,
    dto: CreateRiskDto,
    userId: string,
  ): Promise<DeliveryRisk> {
    const delivery = await this.findDeliveryById(deliveryId, orgId);

    const entity = this.riskRepository.create({
      orgId,
      deliveryId,
      title: dto.title,
      mitigationPlan: dto.mitigationPlan || null,
      severity: dto.severity || 'medium',
      status: dto.status || 'open',
      ownerUserId: dto.ownerUserId || delivery.ownerUserId || null,
      resolvedAt: dto.status === 'closed' ? new Date() : null,
      createdBy: userId,
    });

    const saved = await this.riskRepository.save(entity);

    this.eventBus.publish(
      deliveryRiskReported({
        orgId,
        deliveryId,
        riskId: saved.id,
        severity: saved.severity,
        status: saved.status,
        actorType: userId === SYSTEM_USER_ID ? 'system' : 'user',
        actorId: userId,
      }),
    );

    if (saved.ownerUserId && ['high', 'critical'].includes(saved.severity)) {
      await this.safeNotify(
        orgId,
        saved.ownerUserId,
        NotificationType.SYSTEM_ANNOUNCEMENT,
        `交付单 ${delivery.deliveryNo} 出现高风险`,
        `${saved.title}（${saved.severity}）`,
        'delivery',
        delivery.id,
      );
    }

    return saved;
  }

  async updateRisk(
    id: string,
    deliveryId: string,
    orgId: string,
    dto: UpdateRiskDto,
    userId: string,
  ): Promise<DeliveryRisk> {
    await this.findDeliveryById(deliveryId, orgId);

    const risk = await this.riskRepository.findOne({
      where: { id, deliveryId, orgId, deletedAt: null as unknown as undefined },
    });

    if (!risk) throw new NotFoundException('RESOURCE_NOT_FOUND');
    if (risk.version !== dto.version) throw new ConflictException('CONFLICT_VERSION');

    const patch: Record<string, unknown> = {
      updatedBy: userId,
      version: () => 'version + 1',
    };

    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.mitigationPlan !== undefined) patch.mitigationPlan = dto.mitigationPlan;
    if (dto.severity !== undefined) patch.severity = dto.severity;
    if (dto.ownerUserId !== undefined) patch.ownerUserId = dto.ownerUserId;
    if (dto.status !== undefined) {
      patch.status = dto.status;
      patch.resolvedAt = dto.status === 'closed' ? new Date() : null;
    }

    await this.riskRepository.update(id, patch as never);

    const updated = await this.riskRepository.findOne({
      where: { id, orgId, deliveryId, deletedAt: null as unknown as undefined },
    });

    if (!updated) throw new NotFoundException('RESOURCE_NOT_FOUND');

    this.eventBus.publish(
      deliveryRiskReported({
        orgId,
        deliveryId,
        riskId: updated.id,
        severity: updated.severity,
        status: updated.status,
        actorType: userId === SYSTEM_USER_ID ? 'system' : 'user',
        actorId: userId,
      }),
    );

    return updated;
  }

  async createOutcome(
    deliveryId: string,
    orgId: string,
    dto: CreateOutcomeDto,
    userId: string,
  ): Promise<DeliveryOutcome> {
    await this.findDeliveryById(deliveryId, orgId);

    const entity = this.outcomeRepository.create({
      orgId,
      deliveryId,
      outcomeCode: dto.outcomeCode,
      promisedValue: dto.promisedValue,
      actualValue: dto.actualValue || null,
      status: dto.status || 'pending',
      measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : null,
      note: dto.note || null,
      createdBy: userId,
    });

    const saved = await this.outcomeRepository.save(entity);

    this.eventBus.publish(
      deliveryOutcomeUpdated({
        orgId,
        deliveryId,
        outcomeId: saved.id,
        status: saved.status,
        actorType: userId === SYSTEM_USER_ID ? 'system' : 'user',
        actorId: userId,
      }),
    );

    return saved;
  }

  async updateOutcome(
    id: string,
    deliveryId: string,
    orgId: string,
    dto: UpdateOutcomeDto,
    userId: string,
  ): Promise<DeliveryOutcome> {
    await this.findDeliveryById(deliveryId, orgId);

    const outcome = await this.outcomeRepository.findOne({
      where: { id, deliveryId, orgId, deletedAt: null as unknown as undefined },
    });

    if (!outcome) throw new NotFoundException('RESOURCE_NOT_FOUND');
    if (outcome.version !== dto.version) throw new ConflictException('CONFLICT_VERSION');

    const patch: Record<string, unknown> = {
      updatedBy: userId,
      version: () => 'version + 1',
    };

    if (dto.outcomeCode !== undefined) patch.outcomeCode = dto.outcomeCode;
    if (dto.promisedValue !== undefined) patch.promisedValue = dto.promisedValue;
    if (dto.actualValue !== undefined) patch.actualValue = dto.actualValue;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.note !== undefined) patch.note = dto.note;
    if (dto.measuredAt !== undefined) patch.measuredAt = dto.measuredAt ? new Date(dto.measuredAt) : null;

    await this.outcomeRepository.update(id, patch as never);

    const updated = await this.outcomeRepository.findOne({
      where: { id, orgId, deliveryId, deletedAt: null as unknown as undefined },
    });

    if (!updated) throw new NotFoundException('RESOURCE_NOT_FOUND');

    this.eventBus.publish(
      deliveryOutcomeUpdated({
        orgId,
        deliveryId,
        outcomeId: updated.id,
        status: updated.status,
        actorType: userId === SYSTEM_USER_ID ? 'system' : 'user',
        actorId: userId,
      }),
    );

    return updated;
  }

  async ensureDeliveryForActivatedOrder(input: {
    orgId: string;
    orderId: string;
    customerId: string;
    contractId?: string | null;
    ownerUserId?: string | null;
  }): Promise<DeliveryOrder> {
    const created = await this.createDelivery(
      input.orgId,
      {
        title: `订单交付 ${input.orderId.slice(0, 8)}`,
        customerId: input.customerId,
        contractId: input.contractId || undefined,
        orderId: input.orderId,
        ownerUserId: input.ownerUserId || SYSTEM_USER_ID,
        targetOutcomeSummary: '按合同约定完成实施并通过客户验收',
      },
      SYSTEM_USER_ID,
      { allowExistingForOrder: true, source: 'order_activation' },
    );

    if (created.status === 'draft') {
      return this.changeStatus(
        created.id,
        input.orgId,
        {
          status: 'active',
          version: created.version,
          reason: '订单激活自动启动交付',
        },
        SYSTEM_USER_ID,
      );
    }

    return created;
  }

  async bindSubscriptionToOrderDelivery(
    orgId: string,
    orderId: string,
    subscriptionId: string,
    customerId: string,
    ownerUserId: string,
  ): Promise<DeliveryOrder> {
    const existing = await this.deliveryRepository.findOne({
      where: { orderId, orgId, deletedAt: null as unknown as undefined },
    });

    if (!existing) {
      return this.createDelivery(
        orgId,
        {
          title: `订阅交付 ${subscriptionId.slice(0, 8)}`,
          customerId,
          orderId,
          subscriptionId,
          ownerUserId,
          targetOutcomeSummary: '完成订阅开通后的实施交付并实现可验收结果',
        },
        SYSTEM_USER_ID,
        { allowExistingForOrder: true, source: 'subscription_opened' },
      );
    }

    if (existing.subscriptionId === subscriptionId) {
      return existing;
    }

    await this.updateDeliveryWithVersion(existing.id, orgId, existing.version, {
      subscriptionId,
      updatedBy: SYSTEM_USER_ID,
    } as never);

    const updated = await this.findDeliveryById(existing.id, orgId);

    if (updated.ownerUserId) {
      await this.safeNotify(
        orgId,
        updated.ownerUserId,
        NotificationType.SYSTEM_ANNOUNCEMENT,
        `交付单 ${updated.deliveryNo} 已关联订阅`,
        `已绑定订阅 ${subscriptionId.slice(0, 8)}，请确认交付责任与实施节奏。`,
        'delivery',
        updated.id,
      );
    }

    return updated;
  }

  async bindPaymentToOrderDelivery(
    orgId: string,
    orderId: string,
    paymentId: string,
    actorId: string,
  ): Promise<DeliveryOrder | null> {
    const existing = await this.deliveryRepository.findOne({
      where: { orderId, orgId, deletedAt: null as unknown as undefined },
    });

    if (!existing) return null;
    if (existing.paymentId === paymentId) return existing;

    await this.updateDeliveryWithVersion(existing.id, orgId, existing.version, {
      paymentId,
      updatedBy: actorId,
    } as never);

    return this.findDeliveryById(existing.id, orgId);
  }

  async getCustomerDeliverySummary(orgId: string, customerId: string): Promise<{
    totalDeliveries: number;
    activeDeliveries: number;
    blockedDeliveries: number;
    acceptedDeliveries: number;
    achievedOutcomes: number;
    partialOutcomes: number;
    pendingRisks: number;
  }> {
    const deliveries = await this.deliveryRepository.find({
      where: { orgId, customerId, deletedAt: null as unknown as undefined },
      select: ['id', 'status'],
    });

    if (deliveries.length === 0) {
      return {
        totalDeliveries: 0,
        activeDeliveries: 0,
        blockedDeliveries: 0,
        acceptedDeliveries: 0,
        achievedOutcomes: 0,
        partialOutcomes: 0,
        pendingRisks: 0,
      };
    }

    const deliveryIds = deliveries.map((d) => d.id);

    const [achievedOutcomes, partialOutcomes, pendingRisks] = await Promise.all([
      this.outcomeRepository.count({
        where: {
          orgId,
          deliveryId: In(deliveryIds),
          status: 'achieved',
          deletedAt: null as unknown as undefined,
        },
      }),
      this.outcomeRepository.count({
        where: {
          orgId,
          deliveryId: In(deliveryIds),
          status: 'partial',
          deletedAt: null as unknown as undefined,
        },
      }),
      this.riskRepository.count({
        where: {
          orgId,
          deliveryId: In(deliveryIds),
          status: In(['open', 'mitigated']),
          deletedAt: null as unknown as undefined,
        },
      }),
    ]);

    return {
      totalDeliveries: deliveries.length,
      activeDeliveries: deliveries.filter((d) => d.status === 'active').length,
      blockedDeliveries: deliveries.filter((d) => d.status === 'blocked').length,
      acceptedDeliveries: deliveries.filter((d) => ['accepted', 'closed'].includes(d.status)).length,
      achievedOutcomes,
      partialOutcomes,
      pendingRisks,
    };
  }

  private async createKickoffTask(
    orgId: string,
    delivery: DeliveryOrder,
    ownerUserId: string,
    actorUserId: string,
  ): Promise<void> {
    try {
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + 2);

      const linked = await this.tskService.createTask(
        orgId,
        {
          title: `交付启动：${delivery.deliveryNo}`,
          description: `请启动交付单 ${delivery.deliveryNo}（${delivery.title}）并确认里程碑。`,
          assigneeUserId: ownerUserId,
          sourceType: TaskSourceType.DELIVERY,
          sourceId: delivery.id,
          dueAt,
        },
        actorUserId,
      );

      const localTask = this.deliveryTaskRepository.create({
        orgId,
        deliveryId: delivery.id,
        title: '交付启动与计划确认',
        description: '确认交付边界、里程碑与验收口径',
        ownerUserId,
        linkedTaskId: linked.id,
        status: 'pending',
        dueAt,
        createdBy: actorUserId,
      });

      await this.deliveryTaskRepository.save(localTask);
    } catch {
      // no-op
    }
  }

  private async saveDeliveryWithUniqueNo(
    orgId: string,
    payload: Partial<DeliveryOrder>,
  ): Promise<DeliveryOrder> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const deliveryNo = await this.generateDeliveryNo(orgId);
      const delivery = this.deliveryRepository.create({ ...payload, orgId, deliveryNo });

      try {
        return await this.deliveryRepository.save(delivery);
      } catch (error) {
        if (isUniqueConstraintViolation(error, 'idx_delivery_orders_org_no_unique')) {
          continue;
        }
        if (isUniqueConstraintViolation(error, 'idx_delivery_orders_org_order_unique')) {
          throw new ConflictException('DELIVERY_ALREADY_EXISTS_FOR_ORDER');
        }
        throw error;
      }
    }

    throw new ConflictException('DELIVERY_NO_GENERATION_FAILED');
  }

  private async generateDeliveryNo(orgId: string): Promise<string> {
    return generateBusinessNo('DLV', orgId);
  }

  private resolveExpectedVersion(currentVersion: number, providedVersion?: number): number {
    if (providedVersion === undefined) return currentVersion;
    if (!Number.isInteger(providedVersion) || providedVersion < 1) {
      throw new BadRequestException('PARAM_INVALID');
    }
    if (providedVersion !== currentVersion) throw new ConflictException('CONFLICT_VERSION');
    return providedVersion;
  }

  private async updateDeliveryWithVersion(
    id: string,
    orgId: string,
    expectedVersion: number,
    patch: Partial<DeliveryOrder>,
  ): Promise<void> {
    const result = await this.deliveryRepository.update(
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

  private async safeNotify(
    orgId: string,
    userId: string,
    type: NotificationType,
    title: string,
    content: string,
    sourceType: string,
    sourceId: string,
  ): Promise<void> {
    if (!userId) return;

    try {
      await this.ntfService.createNotification(
        orgId,
        userId,
        type,
        title,
        content,
        sourceType,
        sourceId,
      );
    } catch {
      // no-op
    }
  }
}
