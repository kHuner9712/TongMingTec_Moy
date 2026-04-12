import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

@Entity('quote_versions')
export class QuoteVersion extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'quote_id' })
  @Index()
  quoteId: string;

  @Column({ type: 'int', name: 'version_no' })
  versionNo: number;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0, name: 'total_amount' })
  totalAmount: number;
}
