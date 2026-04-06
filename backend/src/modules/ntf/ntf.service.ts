import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NtfService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async findNotifications(
    orgId: string,
    userId: string,
    filters: { isRead?: boolean; notificationType?: string },
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

    if (filters.notificationType) {
      qb.andWhere('notification.notificationType = :notificationType', {
        notificationType: filters.notificationType,
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
