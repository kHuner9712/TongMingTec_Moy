import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Department } from '../../org/entities/department.entity';

export enum UserStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  DISABLED = 'disabled',
  LOCKED = 'locked',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'department_id' })
  @Index()
  departmentId: string | null;

  @Column({ type: 'varchar', length: 64 })
  @Index()
  username: string;

  @Column({ type: 'varchar', length: 64, name: 'display_name' })
  @Index()
  displayName: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  @Index()
  email: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  @Index()
  mobile: string | null;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: UserStatus.ACTIVE,
  })
  @Index()
  status: UserStatus;

  @Column({ type: 'varchar', length: 16, default: 'zh-CN' })
  locale: string;

  @Column({ type: 'varchar', length: 64, default: 'Asia/Shanghai' })
  timezone: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  @Index()
  lastLoginAt: Date | null;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;
}
