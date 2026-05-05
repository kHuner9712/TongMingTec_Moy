import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type PlanStatus = 'active' | 'inactive' | 'archived';
export type PlanScopeType = 'org' | 'global';
export type PlanBillingCycle = 'monthly' | 'yearly';

@Entity('plans')
export class Plan extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  @Index()
  code: string;

  @Column({ type: 'varchar', length: 64 })
  @Index()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 16, name: 'billing_cycle', default: 'monthly' })
  @Index()
  billingCycle: PlanBillingCycle;

  @Column({ type: 'numeric', precision: 14, scale: 2, name: 'base_price', default: 0 })
  basePrice: number;

  @Column({ type: 'varchar', length: 8, default: 'CNY' })
  currency: string;

  @Column({ type: 'int', name: 'seat_limit', default: 1 })
  seatLimit: number;

  @Column({ type: 'jsonb', name: 'feature_flags_json', default: () => "'{}'::jsonb" })
  featureFlagsJson: Record<string, unknown>;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  @Index()
  status: PlanStatus;

  @Column({ type: 'varchar', length: 16, name: 'scope_type', default: 'org' })
  @Index()
  scopeType: PlanScopeType;

  @Column({ type: 'uuid', name: 'scope_org_id', nullable: true })
  @Index()
  scopeOrgId: string | null;

  @Column({ type: 'timestamptz', name: 'effective_from', nullable: true })
  effectiveFrom: Date | null;

  @Column({ type: 'timestamptz', name: 'effective_to', nullable: true })
  effectiveTo: Date | null;
}
