import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('customer_intents')
export class CustomerIntent extends BaseEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 32, name: 'intent_type' })
  @Index()
  intentType: string;

  @Column({ type: 'numeric', precision: 6, scale: 4 })
  confidence: number;

  @Column({ type: 'jsonb' })
  evidence: Record<string, unknown>;

  @Column({ type: 'timestamptz', name: 'detected_at' })
  detectedAt: Date;
}
