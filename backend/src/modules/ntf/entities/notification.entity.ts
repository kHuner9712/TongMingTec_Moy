import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';
import { User } from '../../usr/entities/user.entity';

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_DUE = 'task_due',
  LEAD_ASSIGNED = 'lead_assigned',
  CONVERSATION_NEW = 'conversation_new',
  TICKET_ASSIGNED = 'ticket_assigned',
  TICKET_ESCALATED = 'ticket_escalated',
  OPPORTUNITY_STAGE_CHANGED = 'opportunity_stage_changed',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}

@Entity('notifications')
export class Notification extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId: string;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'notification_type',
  })
  @Index()
  notificationType: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true, name: 'source_type' })
  @Index()
  sourceType: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'source_id' })
  @Index()
  sourceId: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  @Index()
  isRead: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'read_at' })
  readAt: Date | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
