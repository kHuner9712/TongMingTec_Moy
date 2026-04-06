import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../usr/entities/user.entity';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskSourceType {
  MANUAL = 'manual',
  LEAD = 'lead',
  OPPORTUNITY = 'opportunity',
  CONVERSATION = 'conversation',
  TICKET = 'ticket',
}

@Entity('tasks')
export class Task extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Index()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'assignee_user_id' })
  @Index()
  assigneeUserId: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: true,
    name: 'source_type',
  })
  @Index()
  sourceType: TaskSourceType | null;

  @Column({ type: 'uuid', nullable: true, name: 'source_id' })
  @Index()
  sourceId: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'due_at' })
  @Index()
  dueAt: Date | null;

  @Column({
    type: 'varchar',
    length: 16,
    default: TaskStatus.PENDING,
  })
  @Index()
  status: TaskStatus;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_user_id' })
  assigneeUser: User;
}
