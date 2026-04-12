import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

@Entity('quote_approvals')
export class QuoteApproval extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'quote_id' })
  @Index()
  quoteId: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'uuid', name: 'approver_user_id', nullable: true })
  approverUserId: string | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;
}
