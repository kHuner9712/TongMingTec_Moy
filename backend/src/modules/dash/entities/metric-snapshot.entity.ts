import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('metric_snapshots')
export class MetricSnapshot extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  @Index()
  metricKey: string;

  @Column({ type: 'varchar', length: 32, name: 'metric_type' })
  metricType: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  value: number;

  @Column({ type: 'jsonb', default: '{}' })
  dimensions: Record<string, unknown>;

  @Column({ type: 'timestamptz', name: 'snapshot_at' })
  @Index()
  snapshotAt: Date;
}
