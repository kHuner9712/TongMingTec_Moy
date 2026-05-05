import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BillStatus } from '../../../common/statemachine/definitions/bill.sm';

export type BillType = 'subscription' | 'renewal' | 'manual';

@Entity('bills')
export class Bill extends BaseEntity {
  @Column({ type: 'uuid', name: 'subscription_id', nullable: true })
  @Index()
  subscriptionId: string | null;

  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 32, name: 'bill_no' })
  @Index()
  billNo: string;

  @Column({ type: 'varchar', length: 16, name: 'bill_type', default: 'subscription' })
  @Index()
  billType: BillType;

  @Column({ type: 'varchar', length: 16, default: 'draft' })
  @Index()
  status: BillStatus;

  @Column({ type: 'varchar', length: 8, default: 'CNY' })
  currency: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, name: 'subtotal_amount', default: 0 })
  subtotalAmount: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, name: 'tax_amount', default: 0 })
  taxAmount: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, name: 'total_amount', default: 0 })
  @Index()
  totalAmount: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, name: 'paid_amount', default: 0 })
  paidAmount: number;

  @Column({ type: 'timestamptz', name: 'due_at' })
  @Index()
  dueAt: Date;

  @Column({ type: 'timestamptz', name: 'issued_at', nullable: true })
  issuedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'paid_at', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'timestamptz', name: 'overdue_at', nullable: true })
  overdueAt: Date | null;

  @Column({ type: 'timestamptz', name: 'cancelled_at', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'text', nullable: true })
  remark: string | null;
}
