import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type DeliveryMilestoneStatus = 'pending' | 'done' | 'blocked';

@Entity('delivery_milestones')
export class DeliveryMilestone extends BaseEntity {
  @Column({ type: 'uuid', name: 'delivery_id' })
  @Index()
  deliveryId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 1 })
  @Index()
  sequence: number;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  @Index()
  status: DeliveryMilestoneStatus;

  @Column({ type: 'timestamptz', name: 'due_at', nullable: true })
  dueAt: Date | null;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt: Date | null;
}
