import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('customer_risks')
export class CustomerRisk extends BaseEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 16 })
  @Index()
  riskLevel: RiskLevel;

  @Column({ type: 'jsonb', name: 'risk_factors' })
  riskFactors: Record<string, unknown>;

  @Column({ type: 'timestamptz', name: 'assessed_at' })
  assessedAt: Date;
}
