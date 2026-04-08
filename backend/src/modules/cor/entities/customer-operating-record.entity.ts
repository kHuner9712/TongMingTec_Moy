import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('customer_operating_records')
export class CustomerOperatingRecord extends BaseEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 32, name: 'record_type' })
  @Index()
  recordType: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', name: 'ai_suggestion', nullable: true })
  aiSuggestion: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 64, name: 'human_decision', nullable: true })
  humanDecision: string | null;

  @Column({ type: 'varchar', length: 32, name: 'source_type' })
  sourceType: string;

  @Column({ type: 'uuid', name: 'source_id', nullable: true })
  sourceId: string | null;
}
