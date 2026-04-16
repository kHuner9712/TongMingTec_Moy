import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type DeliveryTaskStatus = 'pending' | 'in_progress' | 'done' | 'blocked';

@Entity('delivery_tasks')
export class DeliveryTask extends BaseEntity {
  @Column({ type: 'uuid', name: 'delivery_id' })
  @Index()
  deliveryId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', name: 'owner_user_id', nullable: true })
  @Index()
  ownerUserId: string | null;

  @Column({ type: 'uuid', name: 'linked_task_id', nullable: true })
  @Index()
  linkedTaskId: string | null;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  @Index()
  status: DeliveryTaskStatus;

  @Column({ type: 'timestamptz', name: 'due_at', nullable: true })
  dueAt: Date | null;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt: Date | null;
}
