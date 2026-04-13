import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SubscriptionStatus } from '../../../common/statemachine/definitions/subscription.sm';

@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  @Index()
  orderId: string | null;

  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'uuid', name: 'plan_id', nullable: true })
  @Index()
  planId: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    default: 'trial',
  })
  @Index()
  status: SubscriptionStatus;

  @Column({ type: 'timestamptz', name: 'starts_at' })
  @Index()
  startsAt: Date;

  @Column({ type: 'timestamptz', name: 'ends_at' })
  @Index()
  endsAt: Date;

  @Column({ type: 'boolean', name: 'auto_renew', default: false })
  autoRenew: boolean;

  @Column({ type: 'int', name: 'seat_count', default: 1 })
  seatCount: number;

  @Column({ type: 'int', name: 'used_count', default: 0 })
  usedCount: number;

  @Column({ type: 'timestamptz', name: 'last_bill_at', nullable: true })
  lastBillAt: Date | null;
}
