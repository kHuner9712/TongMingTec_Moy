import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus, orderStateMachine } from '../../common/statemachine/definitions/order.sm';
import { EventBusService } from '../../common/events/event-bus.service';
import { orderStatusChanged } from '../../common/events/order-events';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private itemRepository: Repository<OrderItem>,
    private readonly eventBus: EventBusService,
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
    const orderNo = await this.generateOrderNo(orgId);

    const order = this.orderRepository.create({
      orgId,
      contractId: dto.contractId || null,
      quoteId: dto.quoteId || null,
      customerId: dto.customerId,
      orderNo,
      orderType: (dto.orderType as any) || 'new',
      status: 'draft' as OrderStatus,
      currency: dto.currency || 'CNY',
      totalAmount,
      createdBy: userId,
    });

    const saved = await this.orderRepository.save(order);

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

  async confirmOrder(id: string, orgId: string, userId: string): Promise<Order> {
    const order = await this.findOrderById(id, orgId);
    const fromStatus = order.status;
    orderStateMachine.validateTransition(order.status, 'confirmed' as OrderStatus);

    await this.orderRepository.update(id, {
      status: 'confirmed',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(orderStatusChanged({
      orgId, orderId: id, fromStatus, toStatus: 'confirmed',
      actorType: 'user', actorId: userId,
    }));

    return this.findOrderById(id, orgId);
  }

  async activateOrder(id: string, orgId: string, userId: string): Promise<Order> {
    const order = await this.findOrderById(id, orgId);
    const fromStatus = order.status;
    orderStateMachine.validateTransition(order.status, 'active' as OrderStatus);

    await this.orderRepository.update(id, {
      status: 'active',
      activatedAt: new Date(),
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(orderStatusChanged({
      orgId, orderId: id, fromStatus, toStatus: 'active',
      actorType: 'user', actorId: userId,
    }));

    return this.findOrderById(id, orgId);
  }

  async completeOrder(id: string, orgId: string, userId: string): Promise<Order> {
    const order = await this.findOrderById(id, orgId);
    const fromStatus = order.status;
    orderStateMachine.validateTransition(order.status, 'completed' as OrderStatus);

    await this.orderRepository.update(id, {
      status: 'completed',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(orderStatusChanged({
      orgId, orderId: id, fromStatus, toStatus: 'completed',
      actorType: 'user', actorId: userId,
    }));

    return this.findOrderById(id, orgId);
  }

  async cancelOrder(id: string, orgId: string, reason: string | undefined, userId: string): Promise<Order> {
    const order = await this.findOrderById(id, orgId);
    const fromStatus = order.status;
    orderStateMachine.validateTransition(order.status, 'cancelled' as OrderStatus);

    await this.orderRepository.update(id, {
      status: 'cancelled',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(orderStatusChanged({
      orgId, orderId: id, fromStatus, toStatus: 'cancelled',
      reason,
      actorType: 'user', actorId: userId,
    }));

    return this.findOrderById(id, orgId);
  }

  async deleteOrder(id: string, orgId: string, userId: string): Promise<void> {
    const order = await this.findOrderById(id, orgId);
    if (order.status !== 'draft') throw new ConflictException('STATUS_TRANSITION_INVALID');
    await this.orderRepository.update(id, { deletedAt: new Date(), updatedBy: userId });
  }

  private async generateOrderNo(orgId: string): Promise<string> {
    const count = await this.orderRepository.count({ where: { orgId } });
    const seq = (count + 1).toString().padStart(5, '0');
    const year = new Date().getFullYear();
    return `ORD-${year}-${seq}`;
  }
}
