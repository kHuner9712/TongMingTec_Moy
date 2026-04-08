import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum NextActionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DISMISSED = 'dismissed',
  EXPIRED = 'expired',
}

@Entity('customer_next_actions')
export class CustomerNextAction extends BaseEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 32, name: 'action_type' })
  @Index()
  actionType: string;

  @Column({ type: 'int' })
  priority: number;

  @Column({ type: 'text' })
  reasoning: string;

  @Column({ type: 'varchar', length: 16, name: 'suggested_by' })
  suggestedBy: string;

  @Column({ type: 'timestamptz', name: 'suggested_at' })
  suggestedAt: Date;

  @Column({ type: 'varchar', length: 16, default: NextActionStatus.PENDING })
  @Index()
  status: NextActionStatus;
}
