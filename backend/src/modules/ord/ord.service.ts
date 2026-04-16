import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus, orderStateMachine } from '../../common/statemachine/definitions/order.sm';
import { EventBusService } from '../../common/events/event-bus.service';
import { orderStatusChanged } from '../../common/events/order-events';
import { CreateOrderDto } from './dto/order.dto';
import { ApprovalCenterService } from '../approval-center/services/approval-center.service';
import {
  generateBusinessNo,
  isUniqueConstraintViolation,
} from '../../common/utils/business-no.util';

@Injectable()
export class OrdService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private itemRepository: Repository<OrderItem>,
    private readonly eventBus: EventBusService,
    private readonly approvalCenterService: ApprovalCenterService,
  ) {}

  async findOrders(
    orgId: string,
    filters: { status?: string; customerId?: string; orderType?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: Order[]; total: number }> {
    const qb = this.orderRepository
      .createQueryBuilder('o')
      .where('o.orgId = :orgId', { orgId })
      .andWhere('o.deletedAt IS NULL');

    if (filters.status) qb.andWhere('o.status = :status', { status: filters.status });
    if (filters.customerId) qb.andWhere('o.customerId = :customerId', { customerId: filters.customerId });
    if (filters.orderType) qb.andWhere('o.orderType = :orderType', { orderType: filters.orderType });

    qb.orderBy('o.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOrderById(id: string, orgId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, orgId, deletedAt: null as unknown as undefined },
    });
    if (!order) throw new NotFoundException('RESOURCE_NOT_FOUND');
    return order;
  }

  async findOrderDetail(id: string, orgId: string): Promise<{ order: Order; items: OrderItem[] }> {
    const order = await this.findOrderById(id, orgId);
    const items = await this.itemRepository.find({
      where: { orderId: id, orgId },
    });
    return { order, items };
  }

  async createOrder(orgId: string, dto: CreateOrderDto, userId: string): Promise<Order> {
    const totalAmount = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const saved = await this.saveOrderWithUniqueNo(
      orgId,
      {
        contractId: dto.contractId || null,
        quoteId: dto.quoteId || null,
        customerId: dto.customerId,
        orderType: (dto.orderType as any) || 'new',
        status: 'draft' as OrderStatus,
        currency: dto.currency || 'CNY',
        totalAmount,
        createdBy: userId,
      },
    );

    for (const item of dto.items) {
      const orderItem = this.itemRepository.create({
        orgId,
        orderId: saved.id,
        itemType: item.itemType,
        refId: item.refId || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        createdBy: userId,
      });
      await this.itemRepository.save(orderItem);
    }

    return saved;
  }

  async createOrderFromContract(
    orgId: string,
    contractId: string,
    quoteId: string | null,
    customerId: string,
    userId: string,
  ): Promise<Order> {
    return this.createOrder(orgId, {
      contractId,
      quoteId: quoteId || undefined,
      customerId,
      orderType: 'new',
      items: [{ itemType: 'plan', quantity: 1, unitPrice: 0 }],
    }, userId);
  }

  async confirmOrder(id: string, orgId: string, userId: string, version?: number): Promise<Order> {
    const order = await this.findOrderById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(order.version, version);
    const fromStatus = order.status;
    orderStateMachine.validateTransition(order.status, 'pending_approval' as OrderStatus);

    await this.updateOrderWithVersion(id, orgId, expectedVersion, {
      status: 'pending_approval',
      updatedBy: userId,
    });

    await this.approvalCenterService.createBusinessApprovalRequest(orgId, {
      resourceType: 'order',
      resourceId: id,
      requestedAction: 'confirm',
      beforeSnapshot: { status: fromStatus, totalAmount: order.totalAmount },
      proposedAfterSnapshot: { status: 'confirmed', totalAmount: order.totalAmount },
      explanation: `订单 ${order.orderNo} 请求确认，金额 ${order.totalAmount} ${order.currency}`,
      customerId: order.customerId,
    });

    return this.findOrderById(id, orgId);
  }

  async confirmOrderAfterApproval(id: string, orgId: string, version?: number): Promise<Order> {
    const order = await this.findOrderById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(order.version, version);
    const fromStatus = order.status;
    orderStateMachine.validateTransition(order.status, 'confirmed' as OrderStatus);

    const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
    await this.updateOrderWithVersion(id, orgId, expectedVersion, {
      status: 'confirmed',
      updatedBy: SYSTEM_USER_ID,
    });

    this.eventBus.publish(orderStatusChanged({
      orgId, orderId: id, fromStatus, toStatus: 'confirmed',
      actorType: 'system', actorId: 'approval-gateway',
    }));

    return this.findOrderById(id, orgId);
  }

  async revertOrderApproval(id: string, orgId: string, version?: number): Promise<Order> {
    const order = await this.findOrderById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(order.version, version);
    const fromStatus = order.status;
    orderStateMachine.validateTransition(order.status, 'draft' as OrderStatus);

    const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
    await this.updateOrderWithVersion(id, orgId, expectedVersion, {
      status: 'draft',
      updatedBy: SYSTEM_USER_ID,
    });

    this.eventBus.publish(orderStatusChanged({
      orgId, orderId: id, fromStatus, toStatus: 'draft',
      actorType: 'system', actorId: 'approval-gateway',
      reason: '审批拒绝，回退到草稿',
    }));

    return this.findOrderById(id, orgId);
  }

  async activateOrder(id: string, orgId: string, userId: string, version?: number): Promise<Order> {
    const order = await this.findOrderById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(order.version, version);
    const fromStatus = order.status;
    orderStateMachine.validateTransition(order.status, 'active' as OrderStatus);

    await this.updateOrderWithVersion(id, orgId, expectedVersion, {
      status: 'active',
      activatedAt: new Date(),
      updatedBy: userId,
    });

    this.eventBus.publish(orderStatusChanged({
      orgId, orderId: id, fromStatus, toStatus: 'active',
      actorType: 'user', actorId: userId,
    }));

    return this.findOrderById(id, orgId);
  }

  async markSubscriptionOpened(
    orderId: string,
    orgId: string,
    openedAt: Date,
    actorId: string,
  ): Promise<void> {
    await this.trySetHandoverTimestamp(
      orderId,
      orgId,
      'subscriptionOpenedAt',
      openedAt,
      actorId,
    );
  }

  async markDeliveryStarted(
    orderId: string,
    orgId: string,
    startedAt: Date,
    actorId: string,
  ): Promise<void> {
    await this.trySetHandoverTimestamp(
      orderId,
      orgId,
      'deliveryStartedAt',
      startedAt,
      actorId,
    );
  }

  async completeOrder(id: string, orgId: string, userId: string, version?: number): Promise<Order> {
    const order = await this.findOrderById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(order.version, version);
    const fromStatus = order.status;
    orderStateMachine.validateTransition(order.status, 'completed' as OrderStatus);

    await this.updateOrderWithVersion(id, orgId, expectedVersion, {
      status: 'completed',
      updatedBy: userId,
    });

    this.eventBus.publish(orderStatusChanged({
      orgId, orderId: id, fromStatus, toStatus: 'completed',
      actorType: 'user', actorId: userId,
    }));

    return this.findOrderById(id, orgId);
  }

  async cancelOrder(
    id: string,
    orgId: string,
    reason: string | undefined,
    userId: string,
    version?: number,
  ): Promise<Order> {
    const order = await this.findOrderById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(order.version, version);
    const fromStatus = order.status;
    orderStateMachine.validateTransition(order.status, 'cancelled' as OrderStatus);

    await this.updateOrderWithVersion(id, orgId, expectedVersion, {
      status: 'cancelled',
      updatedBy: userId,
    });

    this.eventBus.publish(orderStatusChanged({
      orgId, orderId: id, fromStatus, toStatus: 'cancelled',
      reason,
      actorType: 'user', actorId: userId,
    }));

    return this.findOrderById(id, orgId);
  }

  async deleteOrder(id: string, orgId: string, userId: string, version?: number): Promise<void> {
    const order = await this.findOrderById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(order.version, version);
    if (order.status !== 'draft') throw new ConflictException('STATUS_TRANSITION_INVALID');
    await this.updateOrderWithVersion(id, orgId, expectedVersion, { deletedAt: new Date(), updatedBy: userId });
  }

  private async saveOrderWithUniqueNo(
    orgId: string,
    payload: Partial<Order>,
  ): Promise<Order> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderNo = generateBusinessNo('ORD', orgId);
      const order = this.orderRepository.create({ ...payload, orgId, orderNo });
      try {
        return await this.orderRepository.save(order);
      } catch (error) {
        if (isUniqueConstraintViolation(error, 'uq_orders_org_no')) {
          continue;
        }
        throw error;
      }
    }

    throw new ConflictException('ORDER_NO_GENERATION_FAILED');
  }

  private async updateOrderWithVersion(
    id: string,
    orgId: string,
    expectedVersion: number,
    patch: Partial<Order>,
  ): Promise<void> {
    const result = await this.orderRepository.update(
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

  private resolveExpectedVersion(currentVersion: number, providedVersion?: number): number {
    if (providedVersion === undefined) return currentVersion;
    if (!Number.isInteger(providedVersion) || providedVersion < 1) {
      throw new BadRequestException('PARAM_INVALID');
    }
    if (providedVersion !== currentVersion) throw new ConflictException('CONFLICT_VERSION');
    return providedVersion;
  }

  private async trySetHandoverTimestamp(
    orderId: string,
    orgId: string,
    field: 'subscriptionOpenedAt' | 'deliveryStartedAt',
    occurredAt: Date,
    actorId: string,
  ): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, orgId, deletedAt: null as unknown as undefined },
      select: ['id', 'orgId', 'version', field],
    });

    if (!order || order[field]) {
      return;
    }

    await this.orderRepository.update(
      { id: orderId, orgId, version: order.version, deletedAt: IsNull() },
      {
        [field]: occurredAt,
        updatedBy: actorId,
        version: () => 'version + 1',
      } as any,
    );
  }
}
