import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum OpportunityStage {
  DISCOVERY = 'discovery',
  QUALIFICATION = 'qualification',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
}

export enum OpportunityResult {
  WON = 'won',
  LOST = 'lost',
}

@Entity('opportunities')
export class Opportunity extends BaseEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'uuid', nullable: true, name: 'lead_id' })
  @Index()
  leadId: string | null;

  @Column({ type: 'uuid', name: 'owner_user_id' })
  @Index()
  ownerUserId: string;

  @Column({ type: 'varchar', length: 128 })
  @Index()
  name: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  @Index()
  amount: number;

  @Column({ type: 'varchar', length: 8, default: 'CNY' })
  currency: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: OpportunityStage.DISCOVERY,
  })
  @Index()
  stage: OpportunityStage;

  @Column({
    type: 'varchar',
    length: 8,
    nullable: true,
  })
  @Index()
  result: OpportunityResult | null;

  @Column({ type: 'date', nullable: true, name: 'expected_close_date' })
  @Index()
  expectedCloseDate: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'pause_reason' })
  pauseReason: string | null;
}
