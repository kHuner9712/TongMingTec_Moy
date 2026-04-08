import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum ToolType {
  READ_API = 'read_api',
  WRITE_API = 'write_api',
  KB_SEARCH = 'kb_search',
  WORKFLOW_EXECUTE = 'workflow_execute',
  INTEGRATION_EXECUTE = 'integration_execute',
  NOTIFICATION_SEND = 'notification_send',
  REPORT_EXPORT = 'report_export',
}

@Entity('ai_tools')
export class AiTool extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  @Index()
  code: string;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ type: 'varchar', length: 32, name: 'tool_type' })
  @Index()
  toolType: ToolType;

  @Column({ type: 'jsonb' })
  config: Record<string, unknown>;

  @Column({ type: 'varchar', length: 16, name: 'risk_level' })
  riskLevel: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;
}
