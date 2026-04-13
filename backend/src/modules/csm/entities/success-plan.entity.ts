import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type SuccessPlanStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled';

@Entity('success_plans')
export class SuccessPlan extends BaseEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 16, default: 'draft' })
  status: SuccessPlanStatus;

  @Column({ type: 'uuid', name: 'owner_user_id' })
  @Index()
  ownerUserId: string;

  @Column({ type: 'jsonb', default: '{}' })
  payload: Record<string, unknown>;
}
