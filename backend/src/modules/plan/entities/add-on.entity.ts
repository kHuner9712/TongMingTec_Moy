import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type AddOnBillingType = 'one_time' | 'recurring' | 'usage';
export type AddOnStatus = 'active' | 'inactive' | 'archived';

@Entity('add_ons')
export class AddOn extends BaseEntity {
  @Column({ type: 'uuid', name: 'plan_id', nullable: true })
  @Index()
  planId: string | null;

  @Column({ type: 'varchar', length: 64 })
  @Index()
  code: string;

  @Column({ type: 'varchar', length: 64 })
  @Index()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 16, name: 'billing_type', default: 'one_time' })
  @Index()
  billingType: AddOnBillingType;

  @Column({ type: 'numeric', precision: 14, scale: 2, name: 'unit_price', default: 0 })
  unitPrice: number;

  @Column({ type: 'varchar', length: 8, default: 'CNY' })
  currency: string;

  @Column({ type: 'jsonb', name: 'quota_delta_json', nullable: true })
  quotaDeltaJson: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  @Index()
  status: AddOnStatus;
}
