import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DeliveryStatus } from '../../../common/statemachine/definitions/delivery.sm';

@Entity('delivery_orders')
export class DeliveryOrder extends BaseEntity {
  @Column({ type: 'varchar', length: 32, name: 'delivery_no' })
  @Index()
  deliveryNo: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'uuid', name: 'contract_id', nullable: true })
  @Index()
  contractId: string | null;

  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  @Index()
  orderId: string | null;

  @Column({ type: 'uuid', name: 'payment_id', nullable: true })
  @Index()
  paymentId: string | null;

  @Column({ type: 'uuid', name: 'subscription_id', nullable: true })
  @Index()
  subscriptionId: string | null;

  @Column({ type: 'uuid', name: 'success_plan_id', nullable: true })
  @Index()
  successPlanId: string | null;

  @Column({ type: 'uuid', name: 'owner_user_id', nullable: true })
  @Index()
  ownerUserId: string | null;

  @Column({ type: 'varchar', length: 24, default: 'draft' })
  @Index()
  status: DeliveryStatus;

  @Column({ type: 'text', name: 'target_outcome_summary', nullable: true })
  targetOutcomeSummary: string | null;

  @Column({ type: 'timestamptz', name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'ready_for_acceptance_at', nullable: true })
  readyForAcceptanceAt: Date | null;

  @Column({ type: 'timestamptz', name: 'accepted_at', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'closed_at', nullable: true })
  closedAt: Date | null;
}
