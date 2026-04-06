import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Channel } from '../../chn/entities/channel.entity';
import { Customer } from '../../cm/entities/customer.entity';
import { User } from '../../usr/entities/user.entity';

export enum ConversationStatus {
  QUEUED = 'queued',
  WAITING = 'waiting',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
}

@Entity('conversations')
export class Conversation extends BaseEntity {
  @Column({ type: 'uuid', name: 'channel_id' })
  @Index()
  channelId: string;

  @Column({ type: 'uuid', nullable: true, name: 'customer_id' })
  @Index()
  customerId: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true, name: 'external_id' })
  @Index()
  externalId: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'assignee_user_id' })
  @Index()
  assigneeUserId: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    default: ConversationStatus.QUEUED,
  })
  @Index()
  status: ConversationStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'waiting_since' })
  waitingSince: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'first_response_at' })
  @Index()
  firstResponseAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'closed_at' })
  closedAt: Date | null;

  @Column({ type: 'varchar', length: 32, nullable: true, name: 'close_reason' })
  closeReason: string | null;

  @Column({ type: 'int', nullable: true, name: 'rating_score' })
  @Index()
  ratingScore: number | null;

  @Column({ type: 'text', nullable: true, name: 'rating_comment' })
  ratingComment: string | null;

  @ManyToOne(() => Channel, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_user_id' })
  assigneeUser: User;
}
