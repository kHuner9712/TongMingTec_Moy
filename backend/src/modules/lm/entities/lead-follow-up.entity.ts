import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';
import { Lead } from './lead.entity';

export enum FollowType {
  CALL = 'call',
  WECHAT = 'wechat',
  EMAIL = 'email',
  MEETING = 'meeting',
  MANUAL = 'manual',
}

export enum FollowResult {
  CONTINUE = 'continue',
  PAUSE = 'pause',
  CONVERT = 'convert',
  INVALID = 'invalid',
}

@Entity('lead_follow_ups')
export class LeadFollowUp extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'lead_id' })
  @Index()
  leadId: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: FollowType.MANUAL,
    name: 'follow_type',
  })
  @Index()
  followType: FollowType;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  result: FollowResult | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'next_action_at' })
  @Index()
  nextActionAt: Date | null;

  @ManyToOne(() => Lead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;
}
