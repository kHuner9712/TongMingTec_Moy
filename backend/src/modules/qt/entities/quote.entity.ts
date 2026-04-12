import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { QuoteStatus } from '../../../common/statemachine/definitions/quote.sm';

@Entity('quotes')
export class Quote extends BaseEntity {
  @Column({ type: 'uuid', name: 'opportunity_id' })
  @Index()
  opportunityId: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 32, name: 'quote_no' })
  @Index()
  quoteNo: string;

  @Column({ type: 'int', name: 'current_version_no', default: 1 })
  currentVersionNo: number;

  @Column({ type: 'varchar', length: 8, default: 'CNY' })
  currency: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  @Index()
  amount: number;

  @Column({
    type: 'varchar',
    length: 16,
    default: 'draft',
  })
  @Index()
  status: QuoteStatus;

  @Column({ type: 'date', nullable: true, name: 'valid_until' })
  @Index()
  validUntil: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'sent_at' })
  @Index()
  sentAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'accepted_at' })
  @Index()
  acceptedAt: Date | null;
}
