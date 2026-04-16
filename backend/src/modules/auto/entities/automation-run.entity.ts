import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

@Entity('automation_runs')
export class AutomationRun extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'flow_id' })
  @Index()
  flowId: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  @Index()
  status: RunStatus;

  @Column({ type: 'jsonb', name: 'trigger_payload', default: '{}' })
  triggerPayload: Record<string, unknown>;

  @Column({ type: 'timestamptz', name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'finished_at', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'varchar', length: 64, name: 'error_code', nullable: true })
  errorCode: string | null;
}
