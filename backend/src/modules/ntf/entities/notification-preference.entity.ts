import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('notification_preferences')
@Unique('UQ_notification_preferences_org_user', ['orgId', 'userId'])
export class NotificationPreference extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  channels: Record<string, boolean>;

  @Column({
    type: 'text',
    array: true,
    name: 'mute_categories',
    default: () => "'{}'",
  })
  muteCategories: string[];

  @Column({ type: 'varchar', length: 8, name: 'digest_time', nullable: true })
  digestTime: string | null;
}
