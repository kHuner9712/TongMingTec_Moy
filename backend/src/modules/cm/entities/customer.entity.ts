import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CustomerStatus {
  POTENTIAL = 'potential',
  ACTIVE = 'active',
  SILENT = 'silent',
  LOST = 'lost',
}

export enum CustomerLevel {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
  VIP = 'VIP',
}

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ type: 'varchar', length: 128 })
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  @Index()
  industry: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  @Index()
  level: CustomerLevel | null;

  @Column({ type: 'uuid', name: 'owner_user_id' })
  @Index()
  ownerUserId: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: CustomerStatus.POTENTIAL,
  })
  @Index()
  status: CustomerStatus;

  @Column({ type: 'varchar', length: 32, nullable: true })
  @Index()
  phone: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  @Index()
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_contact_at' })
  @Index()
  lastContactAt: Date | null;
}
