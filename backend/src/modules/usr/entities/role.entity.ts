import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum DataScope {
  SELF = 'self',
  TEAM = 'team',
  ORG = 'org',
}

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  @Index()
  code: string;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: DataScope.SELF,
    name: 'data_scope',
  })
  @Index()
  dataScope: DataScope;

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  @Index()
  isDefault: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;
}
