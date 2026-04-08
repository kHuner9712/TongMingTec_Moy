import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

export enum TimelineActorType {
  CUSTOMER = 'customer',
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

@Entity('customer_timeline_events')
export class CustomerTimelineEvent extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 64, name: 'event_type' })
  @Index()
  eventType: string;

  @Column({ type: 'varchar', length: 64, name: 'event_source' })
  eventSource: string;

  @Column({ type: 'jsonb', name: 'event_payload' })
  eventPayload: Record<string, unknown>;

  @Column({ type: 'timestamptz', name: 'occurred_at' })
  @Index()
  occurredAt: Date;

  @Column({ type: 'varchar', length: 16, name: 'actor_type' })
  actorType: TimelineActorType;

  @Column({ type: 'uuid', name: 'actor_id', nullable: true })
  actorId: string | null;
}
