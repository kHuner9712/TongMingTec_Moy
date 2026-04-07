import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum OrganizationStatus {
  PROVISIONING = 'provisioning',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}

export enum OnboardStage {
  BOOTSTRAP_PENDING = 'bootstrap_pending',
  BOOTSTRAP_RUNNING = 'bootstrap_running',
  BOOTSTRAP_COMPLETED = 'bootstrap_completed',
}

@Entity('organizations')
export class Organization extends BaseEntity {
  @Column({ type: 'varchar', length: 64, unique: true })
  @Index()
  code: string;

  @Column({ type: 'varchar', length: 128 })
  @Index()
  name: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: OrganizationStatus.PROVISIONING,
  })
  @Index()
  status: OrganizationStatus;

  @Column({ type: 'varchar', length: 64, default: 'Asia/Shanghai' })
  timezone: string;

  @Column({ type: 'varchar', length: 16, default: 'zh-CN' })
  locale: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'logo_url' })
  logoUrl: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'owner_user_id' })
  ownerUserId: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true, name: 'billing_email' })
  billingEmail: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: OnboardStage.BOOTSTRAP_PENDING,
    name: 'onboard_stage',
  })
  @Index()
  onboardStage: OnboardStage;
}
