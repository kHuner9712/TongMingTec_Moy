import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Conversation } from '../../cnv/entities/conversation.entity';
import { Customer } from '../../cm/entities/customer.entity';
import { User } from '../../usr/entities/user.entity';

export enum TicketPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PROCESSING = 'processing',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity('tickets')
export class Ticket extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'conversation_id' })
  @Index()
  conversationId: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'customer_id' })
  @Index()
  customerId: string | null;

  @Column({ type: 'varchar', length: 64, name: 'ticket_no' })
  @Index()
  ticketNo: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  title: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: TicketPriority.NORMAL,
  })
  @Index()
  priority: TicketPriority;

  @Column({
    type: 'varchar',
    length: 16,
    default: TicketStatus.PENDING,
  })
  @Index()
  status: TicketStatus;

  @Column({ type: 'uuid', nullable: true, name: 'assignee_user_id' })
  @Index()
  assigneeUserId: string | null;

  @Column({ type: 'text', nullable: true })
  solution: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true, name: 'closed_reason' })
  closedReason: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'sla_due_at' })
  @Index()
  slaDueAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'first_response_at' })
  @Index()
  firstResponseAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'resolved_at' })
  @Index()
  resolvedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'closed_at' })
  @Index()
  closedAt: Date | null;

  @ManyToOne(() => Conversation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_user_id' })
  assigneeUser: User;
}
