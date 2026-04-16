import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type TriggerStatus = 'active' | 'paused' | 'archived';

@Entity('automation_triggers')
export class AutomationTrigger extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 128 })
  eventType: string;

  @Column({ type: 'varchar', length: 64 })
  actionType: string;

  @Column({ type: 'jsonb', default: '{}' })
  condition: Record<string, unknown>;

  @Column({ type: 'jsonb', default: '{}' })
  actionPayload: Record<string, unknown>;

  @Column({
    type: 'varchar',
    length: 16,
    default: 'active',
  })
  @Index()
  status: TriggerStatus;

  @Column({ type: 'int', default: 0 })
  executionCount: number;

  @Column({ type: 'int', default: 0 })
  failureCount: number;

  @Column({ type: 'timestamptz', name: 'last_executed_at', nullable: true })
  lastExecutedAt: Date | null;
}
