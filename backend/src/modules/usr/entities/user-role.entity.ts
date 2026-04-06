import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';
import { User } from './user.entity';
import { Role } from './role.entity';

export enum UserRoleSource {
  MANUAL = 'manual',
  BOOTSTRAP = 'bootstrap',
  SYNC = 'sync',
}

@Entity('user_roles')
export class UserRole extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId: string;

  @Column({ type: 'uuid', name: 'role_id' })
  @Index()
  roleId: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: UserRoleSource.MANUAL,
  })
  source: UserRoleSource;

  @Column({ type: 'timestamptz', nullable: true, name: 'effective_from' })
  effectiveFrom: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'effective_to' })
  effectiveTo: Date | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
