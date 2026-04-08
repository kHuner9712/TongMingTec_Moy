import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

export enum SnapshotType {
  PRE_EXECUTION = 'pre_execution',
  POST_EXECUTION = 'post_execution',
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
}

@Entity('customer_state_snapshots')
export class CustomerStateSnapshot extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 32, name: 'snapshot_type' })
  @Index()
  snapshotType: SnapshotType;

  @Column({ type: 'jsonb', name: 'state_data' })
  stateData: Record<string, unknown>;

  @Column({ type: 'uuid', name: 'agent_run_id', nullable: true })
  @Index()
  agentRunId: string | null;

  @Column({ type: 'varchar', length: 64, name: 'trigger_event', nullable: true })
  triggerEvent: string | null;
}
