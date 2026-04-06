import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';
import { Opportunity, OpportunityResult } from './opportunity.entity';

@Entity('opportunity_stage_histories')
export class OpportunityStageHistory extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'opportunity_id' })
  @Index()
  opportunityId: string;

  @Column({ type: 'varchar', length: 32, nullable: true, name: 'from_stage' })
  fromStage: string | null;

  @Column({ type: 'varchar', length: 32, name: 'to_stage' })
  toStage: string;

  @Column({
    type: 'varchar',
    length: 8,
    nullable: true,
    name: 'result_after',
  })
  resultAfter: OpportunityResult | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'change_reason' })
  changeReason: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()', name: 'changed_at' })
  @Index()
  changedAt: Date;

  @ManyToOne(() => Opportunity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;
}
