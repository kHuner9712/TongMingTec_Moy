import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermission extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'role_id' })
  @Index()
  roleId: string;

  @Column({ type: 'uuid', name: 'permission_id' })
  @Index()
  permissionId: string;

  @Column({ type: 'jsonb', nullable: true, name: 'scope_override' })
  scopeOverride: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true, name: 'granted_by' })
  grantedBy: string | null;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
