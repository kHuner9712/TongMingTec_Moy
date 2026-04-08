import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

export enum AgentRunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  AWAITING_APPROVAL = 'awaiting_approval',
  ROLLED_BACK = 'rolled_back',
  TAKEN_OVER = 'taken_over',
}

@Entity('ai_agent_runs')
export class AiAgentRun extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'agent_id' })
  @Index()
  agentId: string;

  @Column({ type: 'uuid', name: 'customer_id', nullable: true })
  @Index()
  customerId: string | null;

  @Column({ type: 'uuid', name: 'request_id', nullable: true })
  requestId: string | null;

  @Column({ type: 'varchar', length: 16, default: AgentRunStatus.PENDING })
  @Index()
  status: AgentRunStatus;

  @Column({ type: 'jsonb', name: 'input_payload' })
  inputPayload: Record<string, unknown>;

  @Column({ type: 'jsonb', name: 'output_payload', nullable: true })
  outputPayload: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 16, name: 'execution_mode' })
  executionMode: string;

  @Column({ type: 'int', name: 'latency_ms', nullable: true })
  latencyMs: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 6, name: 'token_cost', nullable: true })
  tokenCost: number | null;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string | null;
}
