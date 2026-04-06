import { Entity, Column, Index, Unique } from 'typeorm';
import { SystemEntity } from '../../../common/entities/base.entity';

@Entity('org_configs')
@Unique('idx_org_configs_org_key', ['orgId', 'configKey'])
export class OrgConfig extends SystemEntity {
  @Column({ type: 'varchar', length: 64, name: 'config_key' })
  @Index()
  configKey: string;

  @Column({ type: 'jsonb', name: 'config_value' })
  configValue: Record<string, unknown>;
}
