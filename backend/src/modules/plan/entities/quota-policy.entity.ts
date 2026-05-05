import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type QuotaResetCycle = 'monthly' | 'yearly' | 'never';
export type OverageStrategy = 'block' | 'allow' | 'notify';
export type QuotaPolicyStatus = 'active' | 'inactive' | 'archived';

@Entity('quota_policies')
export class QuotaPolicy extends BaseEntity {
  @Column({ type: 'uuid', name: 'plan_id', nullable: true })
  @Index()
  planId: string | null;

  @Column({ type: 'uuid', name: 'add_on_id', nullable: true })
  @Index()
  addOnId: string | null;

  @Column({ type: 'varchar', length: 64, name: 'metric_code' })
  @Index()
  metricCode: string;

  @Column({ type: 'int', name: 'limit_value', default: 0 })
  limitValue: number;

  @Column({ type: 'varchar', length: 16, name: 'reset_cycle', default: 'monthly' })
  resetCycle: QuotaResetCycle;

  @Column({ type: 'varchar', length: 16, name: 'overage_strategy', default: 'block' })
  overageStrategy: OverageStrategy;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  @Index()
  status: QuotaPolicyStatus;
}
