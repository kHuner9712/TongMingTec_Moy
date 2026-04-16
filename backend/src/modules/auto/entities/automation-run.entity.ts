import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

export type RunStatus =
  | 'pending'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

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

  @Column({ type: 'varchar', length: 128, name: 'trigger_event_type', nullable: true })
  triggerEventType: string | null;

  @Column({ type: 'jsonb', name: 'trigger_condition_snapshot', default: '{}' })
  triggerConditionSnapshot: Record<string, unknown>;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'triggered_by_type',
    default: 'system',
  })
  triggeredByType: string;

  @Column({ type: 'uuid', name: 'triggered_by_id', nullable: true })
  triggeredById: string | null;

  @Column({ type: 'jsonb', name: 'business_context', default: '{}' })
  businessContext: Record<string, unknown>;

  @Column({ type: 'varchar', length: 16, name: 'approval_state', nullable: true })
  approvalState: string | null;

  @Column({ type: 'jsonb', name: 'manual_intervention', nullable: true })
  manualIntervention: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 64, name: 'current_step_code', nullable: true })
  currentStepCode: string | null;

  @Column({ type: 'timestamptz', name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'finished_at', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'varchar', length: 64, name: 'error_code', nullable: true })
  errorCode: string | null;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string | null;
}
