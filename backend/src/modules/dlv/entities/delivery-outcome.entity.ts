import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type DeliveryOutcomeStatus = 'pending' | 'achieved' | 'partial' | 'not_achieved';

@Entity('delivery_outcomes')
export class DeliveryOutcome extends BaseEntity {
  @Column({ type: 'uuid', name: 'delivery_id' })
  @Index()
  deliveryId: string;

  @Column({ type: 'varchar', length: 64, name: 'outcome_code' })
  @Index()
  outcomeCode: string;

  @Column({ type: 'text', name: 'promised_value' })
  promisedValue: string;

  @Column({ type: 'text', name: 'actual_value', nullable: true })
  actualValue: string | null;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  @Index()
  status: DeliveryOutcomeStatus;

  @Column({ type: 'timestamptz', name: 'measured_at', nullable: true })
  measuredAt: Date | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
