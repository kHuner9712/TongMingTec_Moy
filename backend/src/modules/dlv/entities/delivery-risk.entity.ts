import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type DeliveryRiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DeliveryRiskStatus = 'open' | 'mitigated' | 'closed';

@Entity('delivery_risks')
export class DeliveryRisk extends BaseEntity {
  @Column({ type: 'uuid', name: 'delivery_id' })
  @Index()
  deliveryId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true, name: 'mitigation_plan' })
  mitigationPlan: string | null;

  @Column({ type: 'varchar', length: 16, default: 'medium' })
  @Index()
  severity: DeliveryRiskSeverity;

  @Column({ type: 'varchar', length: 16, default: 'open' })
  @Index()
  status: DeliveryRiskStatus;

  @Column({ type: 'uuid', name: 'owner_user_id', nullable: true })
  @Index()
  ownerUserId: string | null;

  @Column({ type: 'timestamptz', name: 'resolved_at', nullable: true })
  resolvedAt: Date | null;
}
