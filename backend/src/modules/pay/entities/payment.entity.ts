import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PaymentStatus } from '../../../common/statemachine/definitions/payment.sm';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ type: 'uuid', name: 'order_id' })
  @Index()
  orderId: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 32, name: 'payment_no' })
  @Index()
  paymentNo: string;

  @Column({ type: 'varchar', length: 16, name: 'payment_method', nullable: true })
  paymentMethod: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    default: 'pending',
  })
  @Index()
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 8, default: 'CNY' })
  currency: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0, name: 'amount' })
  @Index()
  amount: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'paid_at' })
  paidAt: Date | null;

  @Column({ type: 'varchar', length: 128, nullable: true, name: 'external_txn_id' })
  externalTxnId: string | null;

  @Column({ type: 'text', nullable: true })
  remark: string | null;
}
