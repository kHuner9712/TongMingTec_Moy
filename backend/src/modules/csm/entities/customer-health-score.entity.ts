import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type HealthLevel = 'low' | 'medium' | 'high' | 'critical';

@Entity('customer_health_scores')
export class CustomerHealthScore extends BaseEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  score: number;

  @Column({ type: 'varchar', length: 16, default: 'medium' })
  @Index()
  level: HealthLevel;

  @Column({ type: 'jsonb', default: '{}' })
  factors: Record<string, unknown>;

  @Column({ type: 'timestamptz', name: 'evaluated_at' })
  evaluatedAt: Date;
}
