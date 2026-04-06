import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Organization } from '../../org/entities/organization.entity';

@Entity('departments')
export class Department extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'parent_id' })
  @Index()
  parentId: string | null;

  @Column({ type: 'varchar', length: 64 })
  @Index()
  code: string;

  @Column({ type: 'varchar', length: 128 })
  @Index()
  name: string;

  @Column({ type: 'uuid', nullable: true, name: 'manager_user_id' })
  @Index()
  managerUserId: string | null;

  @Column({ type: 'varchar', length: 255, default: '/' })
  @Index()
  path: string;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  @Index()
  sortOrder: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive: boolean;

  @ManyToOne(() => Department, (dept) => dept.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Department;

  @OneToMany(() => Department, (dept) => dept.parent)
  children: Department[];
}
