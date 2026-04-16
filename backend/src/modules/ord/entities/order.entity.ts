import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { OrderStatus } from '../../../common/statemachine/definitions/order.sm';

@Entity('orders')
export class Order extends BaseEntity {
  @Column({ type: 'uuid', name: 'contract_id', nullable: true })
  @Index()
  contractId: string | null;

  @Column({ type: 'uuid', name: 'quote_id', nullable: true })
  @Index()
  quoteId: string | null;

  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 32, name: 'order_no' })
  @Index()
  orderNo: string;

  @Column({ type: 'varchar', length: 16, name: 'order_type', default: 'new' })
  @Index()
  orderType: 'new' | 'renewal' | 'addon' | 'refund';

  @Column({
    type: 'varchar',
    length: 16,
    default: 'draft',
  })
  @Index()
  status: OrderStatus;

  @Column({ type: 'varchar', length: 8, default: 'CNY' })
  currency: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0, name: 'total_amount' })
  @Index()
  totalAmount: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'activated_at' })
  activatedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'subscription_opened_at' })
  @Index()
  subscriptionOpenedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'delivery_started_at' })
  @Index()
  deliveryStartedAt: Date | null;
}
