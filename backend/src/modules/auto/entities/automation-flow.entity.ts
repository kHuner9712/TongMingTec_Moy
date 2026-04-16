import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type FlowStatus = 'draft' | 'active' | 'paused' | 'archived';

@Entity('automation_flows')
export class AutomationFlow extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  @Index()
  code: string;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 32, name: 'trigger_type' })
  triggerType: string;

  @Column({ type: 'varchar', length: 128, name: 'trigger_event_type', nullable: true })
  triggerEventType: string | null;

  @Column({ type: 'jsonb', default: '{}' })
  triggerCondition: Record<string, unknown>;

  @Column({
    type: 'varchar',
    length: 16,
    default: 'draft',
  })
  @Index()
  status: FlowStatus;

  @Column({ type: 'jsonb', default: '[]' })
  definition: Record<string, unknown>[];

  @Column({ type: 'int', default: 0, name: 'execution_count' })
  executionCount: number;

  @Column({ type: 'int', default: 0, name: 'failure_count' })
  failureCount: number;
}
