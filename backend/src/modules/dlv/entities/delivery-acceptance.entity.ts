import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type DeliveryAcceptanceResult = 'pending' | 'accepted' | 'rejected';

@Entity('delivery_acceptances')
export class DeliveryAcceptance extends BaseEntity {
  @Column({ type: 'uuid', name: 'delivery_id' })
  @Index()
  deliveryId: string;

  @Column({ type: 'varchar', length: 32, name: 'acceptance_type', default: 'milestone' })
  acceptanceType: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  @Index()
  result: DeliveryAcceptanceResult;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'uuid', name: 'accepted_by_user_id', nullable: true })
  @Index()
  acceptedByUserId: string | null;

  @Column({ type: 'timestamptz', name: 'accepted_at', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'jsonb', default: '{}' })
  payload: Record<string, unknown>;
}
