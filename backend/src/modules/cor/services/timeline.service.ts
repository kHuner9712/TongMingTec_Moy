import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerTimelineEvent, TimelineActorType } from '../entities/customer-timeline-event.entity';
import { TimelineQueryDto } from '../dto/timeline-query.dto';
import { EventBusService } from '../../../common/events/event-bus.service';
import { DomainEvent } from '../../../common/events/domain-event';

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(CustomerTimelineEvent)
    private readonly timelineRepo: Repository<CustomerTimelineEvent>,
    private readonly eventBus: EventBusService,
  ) {
    this.subscribeToDomainEvents();
  }

  async appendEvent(
    customerId: string,
    orgId: string,
    eventType: string,
    eventSource: string,
    eventPayload: Record<string, unknown>,
    actorType: TimelineActorType,
    actorId: string | null,
  ): Promise<CustomerTimelineEvent> {
    const event = this.timelineRepo.create({
      orgId,
      customerId,
      eventType,
      eventSource,
      eventPayload,
      occurredAt: new Date(),
      actorType,
      actorId,
    });
    return this.timelineRepo.save(event);
  }

  async getTimeline(
    customerId: string,
    orgId: string,
    query: TimelineQueryDto,
  ): Promise<{ items: CustomerTimelineEvent[]; total: number }> {
    const qb = this.timelineRepo
      .createQueryBuilder('event')
      .where('event.orgId = :orgId', { orgId })
      .andWhere('event.customerId = :customerId', { customerId });

    if (query.eventType) {
      qb.andWhere('event.eventType = :eventType', { eventType: query.eventType });
    }
    if (query.actorType) {
      qb.andWhere('event.actorType = :actorType', { actorType: query.actorType });
    }

    qb.orderBy('event.occurredAt', 'DESC');
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  private subscribeToDomainEvents(): void {
    const customerEventTypes = [
      'customer.created',
      'customer.status_changed',
      'lead.created',
      'lead.status_changed',
      'opportunity.stage_changed',
      'opportunity.result_set',
      'conversation.created',
      'conversation.message_created',
      'ticket.created',
      'ticket.status_changed',
    ];

    for (const eventType of customerEventTypes) {
      this.eventBus.subscribe(eventType, (event: DomainEvent) => {
        this.handleDomainEvent(event).catch((err) => {
          console.error(`[TimelineService] error handling event ${event.eventType}:`, err);
        });
      });
    }
  }

  private async handleDomainEvent(event: DomainEvent): Promise<void> {
    const customerId = event.payload.customerId as string;
    if (!customerId) return;

    const actorType = this.mapActorType(event.payload.actorType as string);
    const actorId = (event.payload.actorId as string) || null;

    await this.appendEvent(
      customerId,
      event.orgId,
      event.eventType,
      event.aggregateType,
      event.payload,
      actorType,
      actorId,
    );
  }

  private mapActorType(actorType?: string): TimelineActorType {
    switch (actorType) {
      case 'customer':
        return TimelineActorType.CUSTOMER;
      case 'ai':
        return TimelineActorType.AI;
      case 'system':
        return TimelineActorType.SYSTEM;
      default:
        return TimelineActorType.USER;
    }
  }
}
