import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum AgentExecutionMode {
  SUGGEST = 'suggest',
  ASSIST = 'assist',
  AUTO = 'auto',
  APPROVAL = 'approval',
}

export enum AgentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

@Entity('ai_agents')
export class AiAgent extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  @Index()
  code: string;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ type: 'varchar', length: 32, name: 'agent_type' })
  agentType: string;

  @Column({ type: 'varchar', length: 16, name: 'execution_mode' })
  executionMode: AgentExecutionMode;

  @Column({ type: 'jsonb', name: 'resource_scope' })
  resourceScope: Record<string, unknown>;

  @Column({ type: 'jsonb', name: 'tool_scope' })
  toolScope: Record<string, unknown>;

  @Column({ type: 'varchar', length: 16, name: 'risk_level' })
  riskLevel: string;

  @Column({ type: 'jsonb', name: 'input_schema' })
  inputSchema: Record<string, unknown>;

  @Column({ type: 'jsonb', name: 'output_schema' })
  outputSchema: Record<string, unknown>;

  @Column({ type: 'boolean', name: 'requires_approval', default: false })
  requiresApproval: boolean;

  @Column({ type: 'jsonb', name: 'rollback_strategy', nullable: true })
  rollbackStrategy: Record<string, unknown> | null;

  @Column({ type: 'jsonb', name: 'takeover_strategy', nullable: true })
  takeoverStrategy: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 16, default: AgentStatus.DRAFT })
  @Index()
  status: AgentStatus;
}
