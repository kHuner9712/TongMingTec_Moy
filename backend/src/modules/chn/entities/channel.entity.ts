import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum ChannelStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  ERROR = 'error',
}

export enum ChannelType {
  WECHAT = 'wechat',
  WECHAT_MINI = 'wechat_mini',
  WECHAT_WORK = 'wechat_work',
  WEB = 'web',
  APP = 'app',
  PHONE = 'phone',
  EMAIL = 'email',
}

@Entity('channels')
export class Channel extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  @Index()
  code: string;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'channel_type',
  })
  @Index()
  channelType: ChannelType;

  @Column({ type: 'jsonb', name: 'config_json', default: {} })
  configJson: Record<string, unknown>;

  @Column({
    type: 'varchar',
    length: 16,
    default: ChannelStatus.INACTIVE,
  })
  @Index()
  status: ChannelStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'verified_at' })
  @Index()
  verifiedAt: Date | null;
}
