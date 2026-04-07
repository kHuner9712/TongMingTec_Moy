import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum LeadStatus {
  NEW = 'new',
  ASSIGNED = 'assigned',
  FOLLOWING = 'following',
  CONVERTED = 'converted',
  INVALID = 'invalid',
}

@Entity('leads')
export class Lead extends BaseEntity {
  @Column({ type: 'varchar', length: 32, default: 'manual' })
  @Index()
  source: string;

  @Column({ type: 'varchar', length: 128 })
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  @Index()
  mobile: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  @Index()
  email: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true, name: 'company_name' })
  @Index()
  companyName: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'owner_user_id' })
  @Index()
  ownerUserId: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    default: LeadStatus.NEW,
  })
  @Index()
  status: LeadStatus;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  @Index()
  score: number | null;

  @Column({ type: 'text', nullable: true, name: 'score_reason' })
  scoreReason: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_follow_up_at' })
  @Index()
  lastFollowUpAt: Date | null;
}
