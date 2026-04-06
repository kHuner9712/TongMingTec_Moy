import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

@Entity('audit_logs')
export class AuditLog extends AppendOnlyEntity {
  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  @Index()
  userId: string | null;

  @Column({ type: 'varchar', length: 64 })
  @Index()
  action: string;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'resource_type',
  })
  @Index()
  resourceType: string;

  @Column({ type: 'uuid', nullable: true, name: 'resource_id' })
  @Index()
  resourceId: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'before_snapshot' })
  beforeSnapshot: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'after_snapshot' })
  afterSnapshot: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string | null;
}
