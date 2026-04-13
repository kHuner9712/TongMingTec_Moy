import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionSeat } from './entities/subscription-seat.entity';
import { SubscriptionStatus, subscriptionStateMachine } from '../../common/statemachine/definitions/subscription.sm';
import { EventBusService } from '../../common/events/event-bus.service';
import { subscriptionStatusChanged, subscriptionOpened } from '../../common/events/subscription-events';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class SubService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionSeat)
    private seatRepository: Repository<SubscriptionSeat>,
    private readonly eventBus: EventBusService,
  ) {}

  async findSubscriptions(
    orgId: string,
    filters: { status?: string; customerId?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: Subscription[]; total: number }> {
    const qb = this.subscriptionRepository
      .createQueryBuilder('s')
      .where('s.orgId = :orgId', { orgId })
      .andWhere('s.deletedAt IS NULL');

    if (filters.status) {
      qb.andWhere('s.status = :status', { status: filters.status });
    }
    if (filters.customerId) {
      qb.andWhere('s.customerId = :customerId', { customerId: filters.customerId });
    }

    qb.orderBy('s.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findSubscriptionById(id: string, orgId: string): Promise<Subscription> {
    const sub = await this.subscriptionRepository.findOne({
      where: { id, orgId, deletedAt: null as unknown as undefined },
    });
    if (!sub) throw new NotFoundException('RESOURCE_NOT_FOUND');
    return sub;
  }

  async findSubscriptionDetail(id: string, orgId: string): Promise<{ subscription: Subscription; seats: SubscriptionSeat[] }> {
    const subscription = await this.findSubscriptionById(id, orgId);
    const seats = await this.seatRepository.find({
      where: { subscriptionId: id, orgId, deletedAt: null as unknown as undefined },
    });
    return { subscription, seats };
  }

  async createSubscription(orgId: string, dto: CreateSubscriptionDto, userId: string): Promise<Subscription> {
    const initialStatus: SubscriptionStatus = 'active';

    const subscription = this.subscriptionRepository.create({
      orgId,
      orderId: dto.orderId || null,
      customerId: dto.customerId,
      planId: dto.planId || null,
      status: initialStatus,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
      autoRenew: dto.autoRenew ?? false,
      seatCount: dto.seatCount ?? 1,
      usedCount: 0,
      createdBy: userId,
    });

    const saved = await this.subscriptionRepository.save(subscription);

    this.eventBus.publish(
      subscriptionOpened({
        orgId,
        subscriptionId: saved.id,
        orderId: dto.orderId || '',
        customerId: dto.customerId,
        actorType: 'user',
        actorId: userId,
      }),
    );

    this.eventBus.publish(
      subscriptionStatusChanged({
        orgId,
        subscriptionId: saved.id,
        fromStatus: 'trial',
        toStatus: initialStatus,
        actorType: 'user',
        actorId: userId,
      }),
    );

    return saved;
  }

  async createSubscriptionFromOrder(
    orgId: string,
    orderId: string,
    customerId: string,
    userId: string,
  ): Promise<Subscription> {
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setFullYear(endsAt.getFullYear() + 1);

    return this.createSubscription(orgId, {
      customerId,
      orderId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      autoRenew: false,
      seatCount: 1,
    }, userId);
  }

  async updateSubscription(
    id: string,
    orgId: string,
    dto: UpdateSubscriptionDto,
    userId: string,
  ): Promise<Subscription> {
    const sub = await this.findSubscriptionById(id, orgId);

    if (sub.version !== dto.version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.seatCount !== undefined) {
      if (dto.seatCount < sub.usedCount) {
        throw new ConflictException('SEAT_COUNT_LESS_THAN_USED');
      }
      updateData.seatCount = dto.seatCount;
    }
    if (dto.autoRenew !== undefined) {
      updateData.autoRenew = dto.autoRenew;
    }
    if (dto.endsAt !== undefined) {
      updateData.endsAt = new Date(dto.endsAt);
    }

    await this.subscriptionRepository.update(id, {
      ...updateData,
      updatedBy: userId,
      version: () => 'version + 1',
    });

    return this.findSubscriptionById(id, orgId);
  }

  async activateSubscription(id: string, orgId: string, userId: string): Promise<Subscription> {
    const sub = await this.findSubscriptionById(id, orgId);
    const fromStatus = sub.status;
    subscriptionStateMachine.validateTransition(sub.status, 'active' as SubscriptionStatus);

    await this.subscriptionRepository.update(id, {
      status: 'active',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      subscriptionStatusChanged({
        orgId,
        subscriptionId: id,
        fromStatus,
        toStatus: 'active',
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findSubscriptionById(id, orgId);
  }

  async suspendSubscription(id: string, orgId: string, reason: string, userId: string, version: number): Promise<Subscription> {
    const sub = await this.findSubscriptionById(id, orgId);

    if (sub.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const fromStatus = sub.status;
    subscriptionStateMachine.validateTransition(sub.status, 'suspended' as SubscriptionStatus);

    await this.subscriptionRepository.update(id, {
      status: 'suspended',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      subscriptionStatusChanged({
        orgId,
        subscriptionId: id,
        fromStatus,
        toStatus: 'suspended',
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findSubscriptionById(id, orgId);
  }

  async cancelSubscription(id: string, orgId: string, reason: string, userId: string): Promise<Subscription> {
    const sub = await this.findSubscriptionById(id, orgId);
    const fromStatus = sub.status;
    subscriptionStateMachine.validateTransition(sub.status, 'cancelled' as SubscriptionStatus);

    await this.subscriptionRepository.update(id, {
      status: 'cancelled',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      subscriptionStatusChanged({
        orgId,
        subscriptionId: id,
        fromStatus,
        toStatus: 'cancelled',
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findSubscriptionById(id, orgId);
  }

  async deleteSubscription(id: string, orgId: string, userId: string): Promise<void> {
    const sub = await this.findSubscriptionById(id, orgId);
    if (!['trial', 'cancelled'].includes(sub.status)) {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }
    await this.subscriptionRepository.update(id, { deletedAt: new Date(), updatedBy: userId });
  }
}
