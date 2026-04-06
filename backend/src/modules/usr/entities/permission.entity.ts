import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

export enum RiskLevel {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

@Entity('permissions')
export class Permission extends AppendOnlyEntity {
  @Column({ type: 'varchar', length: 64, name: 'perm_id' })
  @Index()
  permId: string;

  @Column({ type: 'varchar', length: 32 })
  @Index()
  module: string;

  @Column({ type: 'varchar', length: 64 })
  action: string;

  @Column({
    type: 'varchar',
    length: 8,
    default: RiskLevel.P3,
    name: 'risk_level',
  })
  @Index()
  riskLevel: RiskLevel;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;
}
