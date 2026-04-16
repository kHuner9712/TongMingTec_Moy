import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

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
}
