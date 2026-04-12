import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';

@Injectable()
export class NtfService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private notificationPreferenceRepository: Repository<NotificationPreference>,
  ) {}

  async findNotifications(
    orgId: string,
    userId: string,
    filters: {
      isRead?: boolean;
      notificationType?: string;
      category?: string;
      sourceType?: string;
    },
    page: number,
    pageSize: number,
  ): Promise<{ items: Notification[]; total: number }> {
    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.orgId = :orgId', { orgId })
      .andWhere('notification.userId = :userId', { userId });

    if (filters.isRead !== undefined) {
      qb.andWhere('notification.isRead = :isRead', { isRead: filters.isRead });
    }

    const typeFilter = filters.category || filters.notificationType;
    if (typeFilter) {
      qb.andWhere('notification.notificationType = :notificationType', {
        notificationType: typeFilter,
      });
    }

    if (filters.sourceType) {
      qb.andWhere('notification.sourceType = :sourceType', {
        sourceType: filters.sourceType,
      });
    }

    qb.orderBy('notification.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async markAsRead(
    id: string,
    orgId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, orgId, userId },
    });

    if (!notification) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }

    await this.notificationRepository.update(id, {
      isRead: true,
      readAt: new Date(),
    });

    return this.notificationRepository.findOne({
      where: { id, orgId, userId },
    }) as Promise<Notification>;
  }

  async markAllAsRead(orgId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { orgId, userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async updateNotificationPreferences(
    orgId: string,
    userId: string,
    payload: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreference> {
    const channels = this.normalizeChannels(payload.channels);
    const existing = await this.notificationPreferenceRepository.findOne({
      where: { orgId, userId },
    });

    if (existing) {
      if (payload.version && payload.version !== existing.version) {
        throw new ConflictException('CONFLICT_VERSION');
      }

      existing.channels = channels;
      if (payload.muteCategories) {
        existing.muteCategories = payload.muteCategories;
      }
      if (payload.digestTime !== undefined) {
        existing.digestTime = payload.digestTime;
      }
      existing.updatedBy = userId;
      existing.version += 1;

      return this.notificationPreferenceRepository.save(existing);
    }

    const created = this.notificationPreferenceRepository.create({
      orgId,
      userId,
      channels,
      muteCategories: payload.muteCategories || [],
      digestTime: payload.digestTime || null,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.notificationPreferenceRepository.save(created);
  }

  private normalizeChannels(
    channels: Record<string, boolean>,
  ): Record<string, boolean> {
    return Object.entries(channels || {}).reduce<Record<string, boolean>>(
      (acc, [channel, enabled]) => {
        if (typeof enabled === 'boolean') {
          acc[channel] = enabled;
        }
        return acc;
      },
      {},
    );
  }

  async createNotification(
    orgId: string,
    userId: string,
    notificationType: NotificationType,
    title: string,
    content: string,
    sourceType?: string,
    sourceId?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      orgId,
      userId,
      notificationType,
      title,
      content,
      sourceType: sourceType || null,
      sourceId: sourceId || null,
      isRead: false,
      createdBy: userId,
    });

    return this.notificationRepository.save(notification);
  }

  async getUnreadCount(orgId: string, userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { orgId, userId, isRead: false },
    });
  }
}
