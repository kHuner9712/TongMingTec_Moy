import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

@Entity('ai_rollbacks')
export class AiRollback extends AppendOnlyEntity {
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

  @Column({ type: 'jsonb', name: 'rollback_scope' })
  rollbackScope: Record<string, unknown>;

  @Column({ type: 'jsonb', name: 'before_snapshot', nullable: true })
  beforeSnapshot: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 16 })
  result: string;

  @Column({ type: 'uuid', name: 'rolled_back_by', nullable: true })
  rolledBackBy: string | null;

  @Column({ type: 'timestamptz', name: 'rolled_back_at' })
  rolledBackAt: Date;
}
