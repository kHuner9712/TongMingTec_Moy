import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('ai_prompt_templates')
export class AiPromptTemplate extends BaseEntity {
  @Column({ type: 'varchar', length: 64, name: 'template_code' })
  @Index()
  templateCode: string;

  @Column({ type: 'varchar', length: 64, name: 'agent_code' })
  @Index()
  agentCode: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'text', name: 'system_prompt' })
  systemPrompt: string;

  @Column({ type: 'text', name: 'user_prompt_pattern' })
  userPromptPattern: string;

  @Column({ type: 'jsonb', name: 'input_schema', nullable: true })
  inputSchema: Record<string, unknown> | null;

  @Column({ type: 'jsonb', name: 'output_schema', nullable: true })
  outputSchema: Record<string, unknown> | null;

  @Column({ type: 'jsonb', name: 'safety_rules', nullable: true })
  safetyRules: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;
}
