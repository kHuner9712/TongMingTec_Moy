import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

export type StepStatus =
  | 'pending'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'skipped';

@Entity('automation_steps')
export class AutomationStep extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'run_id' })
  @Index()
  runId: string;

  @Column({ type: 'varchar', length: 64, name: 'step_code' })
  stepCode: string;

  @Column({ type: 'varchar', length: 32, name: 'step_type' })
  stepType: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: StepStatus;

  @Column({ type: 'jsonb', name: 'input_payload', default: '{}' })
  inputPayload: Record<string, unknown>;

  @Column({ type: 'jsonb', name: 'output_payload', nullable: true })
  outputPayload: Record<string, unknown> | null;

  @Column({ type: 'uuid', name: 'approval_request_id', nullable: true })
  approvalRequestId: string | null;

  @Column({ type: 'boolean', name: 'requires_approval', default: false })
  requiresApproval: boolean;

  @Column({ type: 'jsonb', name: 'business_context', default: '{}' })
  businessContext: Record<string, unknown>;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string | null;
}
