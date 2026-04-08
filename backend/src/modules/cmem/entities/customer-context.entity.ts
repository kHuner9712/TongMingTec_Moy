import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('customer_contexts')
export class CustomerContext extends BaseEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 32, name: 'context_type' })
  @Index()
  contextType: string;

  @Column({ type: 'jsonb', name: 'context_data' })
  contextData: Record<string, unknown>;

  @Column({ type: 'varchar', length: 64, name: 'last_updated_from', nullable: true })
  lastUpdatedFrom: string | null;

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
  expiresAt: Date | null;
}
