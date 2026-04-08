import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

@Entity('ai_takeovers')
export class AiTakeover extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'agent_run_id' })
  @Index()
  agentRunId: string;

  @Column({ type: 'uuid', name: 'customer_id', nullable: true })
  @Index()
  customerId: string | null;

  @Column({ type: 'varchar', length: 32, name: 'resource_type' })
  resourceType: string;

  @Column({ type: 'uuid', name: 'resource_id', nullable: true })
  resourceId: string | null;

  @Column({ type: 'uuid', name: 'takeover_user_id' })
  takeoverUserId: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'timestamptz', name: 'takeover_at' })
  takeoverAt: Date;
}
