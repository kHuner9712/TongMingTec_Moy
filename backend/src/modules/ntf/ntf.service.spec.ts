import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { NtfService } from './ntf.service';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';

describe('NtfService', () => {
  let service: NtfService;
  let notificationRepository: jest.Mocked<any>;
  let notificationPreferenceRepository: jest.Mocked<any>;

  const mockNotification = {
    id: 'notif-uuid-123',
    orgId: 'org-uuid-123',
    userId: 'user-uuid-123',
    notificationType: NotificationType.SYSTEM_ANNOUNCEMENT,
    title: 'Test Notification',
    content: 'This is a test notification',
    isRead: false,
    readAt: null,
    sourceType: 'system',
    sourceId: null,
    version: 1,
  };

  const createMockQueryBuilder = () => {
    const qb: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };
    return qb;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NtfService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(NotificationPreference),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NtfService>(NtfService);
    notificationRepository = module.get(getRepositoryToken(Notification));
    notificationPreferenceRepository = module.get(
      getRepositoryToken(NotificationPreference),
    );
  });

  describe('findNotifications', () => {
    it('should return paginated notifications', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockNotification], 1]);
      notificationRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findNotifications(
        'org-uuid-123',
        'user-uuid-123',
        {},
        1,
        10,
      );

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by isRead', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockNotification], 1]);
      notificationRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findNotifications(
        'org-uuid-123',
        'user-uuid-123',
        { isRead: false },
        1,
        10,
      );

      expect(mockQb.andWhere).toHaveBeenCalled();
    });

    it('should filter by notificationType', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockNotification], 1]);
      notificationRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findNotifications(
        'org-uuid-123',
        'user-uuid-123',
        { notificationType: NotificationType.SYSTEM_ANNOUNCEMENT },
        1,
        10,
      );

      expect(mockQb.andWhere).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      notificationRepository.findOne.mockResolvedValue(mockNotification);
      notificationRepository.update.mockResolvedValue({ affected: 1 });
      notificationRepository.findOne.mockResolvedValue({
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      });

      const result = await service.markAsRead(
        'notif-uuid-123',
        'org-uuid-123',
        'user-uuid-123',
      );

      expect(notificationRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when notification not found', async () => {
      notificationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.markAsRead('non-existent', 'org-uuid-123', 'user-uuid-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      notificationRepository.update.mockResolvedValue({ affected: 5 });

      await service.markAllAsRead('org-uuid-123', 'user-uuid-123');

      expect(notificationRepository.update).toHaveBeenCalled();
    });
  });

  describe('createNotification', () => {
    it('should create notification with valid data', async () => {
      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.createNotification(
        'org-uuid-123',
        'user-uuid-123',
        NotificationType.SYSTEM_ANNOUNCEMENT,
        'Test Title',
        'Test Content',
      );

      expect(notificationRepository.save).toHaveBeenCalled();
    });

    it('should create notification with source info', async () => {
      notificationRepository.create.mockReturnValue({
        ...mockNotification,
        sourceType: 'ticket',
        sourceId: 'ticket-uuid-123',
      });
      notificationRepository.save.mockResolvedValue({
        ...mockNotification,
        sourceType: 'ticket',
        sourceId: 'ticket-uuid-123',
      });

      const result = await service.createNotification(
        'org-uuid-123',
        'user-uuid-123',
        NotificationType.TICKET_ASSIGNED,
        'Ticket Update',
        'Your ticket has been updated',
        'ticket',
        'ticket-uuid-123',
      );

      expect(notificationRepository.save).toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      notificationRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('org-uuid-123', 'user-uuid-123');

      expect(result).toBe(5);
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should create preferences when none exists', async () => {
      notificationPreferenceRepository.findOne.mockResolvedValue(null);
      notificationPreferenceRepository.create.mockReturnValue({
        orgId: 'org-uuid-123',
        userId: 'user-uuid-123',
        channels: { inbox: true, email: false },
        muteCategories: ['system'],
        digestTime: '09:00',
        version: 1,
      });
      notificationPreferenceRepository.save.mockResolvedValue({
        orgId: 'org-uuid-123',
        userId: 'user-uuid-123',
        channels: { inbox: true, email: false },
        muteCategories: ['system'],
        digestTime: '09:00',
        version: 1,
      });

      const result = await service.updateNotificationPreferences(
        'org-uuid-123',
        'user-uuid-123',
        {
          channels: { inbox: true, email: false },
          muteCategories: ['system'],
          digestTime: '09:00',
        },
      );

      expect(notificationPreferenceRepository.create).toHaveBeenCalled();
      expect(result.channels).toEqual({ inbox: true, email: false });
    });

    it('should update preferences and increment version', async () => {
      const existing = {
        id: 'pref-uuid-123',
        orgId: 'org-uuid-123',
        userId: 'user-uuid-123',
        channels: { inbox: true, email: true },
        muteCategories: [],
        digestTime: null,
        version: 2,
      };
      notificationPreferenceRepository.findOne.mockResolvedValue(existing);
      notificationPreferenceRepository.save.mockResolvedValue({
        ...existing,
        channels: { inbox: true, email: false },
        muteCategories: ['bill'],
        digestTime: '08:30',
        version: 3,
      });

      const result = await service.updateNotificationPreferences(
        'org-uuid-123',
        'user-uuid-123',
        {
          channels: { inbox: true, email: false },
          muteCategories: ['bill'],
          digestTime: '08:30',
          version: 2,
        },
      );

      expect(notificationPreferenceRepository.save).toHaveBeenCalled();
      expect(result.version).toBe(3);
    });

    it('should throw ConflictException when version mismatch', async () => {
      notificationPreferenceRepository.findOne.mockResolvedValue({
        id: 'pref-uuid-123',
        orgId: 'org-uuid-123',
        userId: 'user-uuid-123',
        channels: { inbox: true },
        muteCategories: [],
        digestTime: null,
        version: 4,
      });

      await expect(
        service.updateNotificationPreferences('org-uuid-123', 'user-uuid-123', {
          channels: { inbox: false },
          version: 2,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
