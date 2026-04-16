import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubService } from './sub.service';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionSeat } from './entities/subscription-seat.entity';
import { EventBusService } from '../../common/events/event-bus.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SubService', () => {
  let service: SubService;
  let subscriptionRepository: any;
  let seatRepository: any;
  let eventBus: any;

  const mockSubscription = {
    id: 'sub-1',
    orgId: 'org-1',
    orderId: 'order-1',
    customerId: 'customer-1',
    planId: null,
    status: 'active',
    startsAt: new Date('2026-05-01'),
    endsAt: new Date('2027-04-30'),
    autoRenew: false,
    seatCount: 1,
    usedCount: 0,
    lastBillAt: null,
    version: 1,
    createdBy: 'user-1',
  };

  const createMockQb = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockSubscription], 1]),
  });

  beforeEach(async () => {
    subscriptionRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb()),
    };

    seatRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubService,
        { provide: getRepositoryToken(Subscription), useValue: subscriptionRepository },
        { provide: getRepositoryToken(SubscriptionSeat), useValue: seatRepository },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<SubService>(SubService);
  });

  describe('findSubscriptionById', () => {
    it('should return subscription if found', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      const result = await service.findSubscriptionById('sub-1', 'org-1');
      expect(result.id).toBe('sub-1');
    });

    it('should throw NotFoundException if not found', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);
      await expect(service.findSubscriptionById('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });

    it('should query with orgId for multi-tenant isolation', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      await service.findSubscriptionById('sub-1', 'org-1');
      expect(subscriptionRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'sub-1', orgId: 'org-1' }),
        }),
      );
    });
  });

  describe('createSubscription', () => {
    it('should create subscription with active status', async () => {
      subscriptionRepository.create.mockReturnValue(mockSubscription);
      subscriptionRepository.save.mockResolvedValue(mockSubscription);

      const dto = {
        customerId: 'customer-1',
        orderId: 'order-1',
        startsAt: '2026-05-01T00:00:00Z',
        endsAt: '2027-04-30T23:59:59Z',
        autoRenew: false,
        seatCount: 1,
      };

      const result = await service.createSubscription('org-1', dto, 'user-1');

      expect(subscriptionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          status: 'active',
          customerId: 'customer-1',
          orderId: 'order-1',
        }),
      );
      expect(eventBus.publish).toHaveBeenCalledTimes(2);
    });
  });

  describe('createSubscriptionFromOrder', () => {
    it('should create subscription linked to order', async () => {
      subscriptionRepository.create.mockReturnValue(mockSubscription);
      subscriptionRepository.save.mockResolvedValue(mockSubscription);

      const result = await service.createSubscriptionFromOrder(
        'org-1', 'order-1', 'customer-1', 'user-1',
      );

      expect(subscriptionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          orderId: 'order-1',
          customerId: 'customer-1',
        }),
      );
    });
  });

  describe('suspendSubscription', () => {
    it('should transition overdue to suspended', async () => {
      const overdueSub = { ...mockSubscription, status: 'overdue' };
      subscriptionRepository.findOne
        .mockResolvedValueOnce(overdueSub)
        .mockResolvedValueOnce({ ...overdueSub, status: 'suspended' });
      subscriptionRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.suspendSubscription('sub-1', 'org-1', '欠费停服', 'user-1', 1);

      expect(subscriptionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sub-1',
          orgId: 'org-1',
          version: 1,
        }),
        expect.objectContaining({ status: 'suspended' }),
      );
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should throw on version conflict', async () => {
      subscriptionRepository.findOne.mockResolvedValue({ ...mockSubscription, version: 2 });

      await expect(
        service.suspendSubscription('sub-1', 'org-1', 'reason', 'user-1', 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('cancelSubscription', () => {
    it('should transition active to cancelled', async () => {
      const activeSub = { ...mockSubscription, status: 'active' };
      subscriptionRepository.findOne
        .mockResolvedValueOnce(activeSub)
        .mockResolvedValueOnce({ ...activeSub, status: 'cancelled' });
      subscriptionRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.cancelSubscription('sub-1', 'org-1', '客户取消', 'user-1');

      expect(subscriptionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sub-1',
          orgId: 'org-1',
          version: 1,
        }),
        expect.objectContaining({ status: 'cancelled' }),
      );
    });
  });

  describe('updateSubscription', () => {
    it('should update seatCount and autoRenew', async () => {
      subscriptionRepository.findOne
        .mockResolvedValueOnce(mockSubscription)
        .mockResolvedValueOnce({ ...mockSubscription, seatCount: 5, autoRenew: true });
      subscriptionRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateSubscription('sub-1', 'org-1', {
        seatCount: 5,
        autoRenew: true,
        version: 1,
      }, 'user-1');

      expect(subscriptionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sub-1',
          orgId: 'org-1',
          version: 1,
        }),
        expect.objectContaining({ seatCount: 5, autoRenew: true }),
      );
    });

    it('should reject seatCount less than usedCount', async () => {
      subscriptionRepository.findOne.mockResolvedValue({ ...mockSubscription, usedCount: 3 });

      await expect(
        service.updateSubscription('sub-1', 'org-1', { seatCount: 2, version: 1 }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteSubscription', () => {
    it('should soft delete cancelled subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue({ ...mockSubscription, status: 'cancelled' });
      subscriptionRepository.update.mockResolvedValue({ affected: 1 });

      await service.deleteSubscription('sub-1', 'org-1', 'user-1');

      expect(subscriptionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sub-1',
          orgId: 'org-1',
          version: 1,
        }),
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });

    it('should throw when deleting active subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      await expect(
        service.deleteSubscription('sub-1', 'org-1', 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('state machine validation', () => {
    it('should reject illegal transition expired->active', () => {
      const { subscriptionStateMachine } = require('../../common/statemachine/definitions/subscription.sm');
      expect(() => subscriptionStateMachine.validateTransition('expired', 'active')).toThrow();
    });

    it('should reject illegal transition cancelled->active', () => {
      const { subscriptionStateMachine } = require('../../common/statemachine/definitions/subscription.sm');
      expect(() => subscriptionStateMachine.validateTransition('cancelled', 'active')).toThrow();
    });

    it('should validate happy path: trial->active', () => {
      const { subscriptionStateMachine } = require('../../common/statemachine/definitions/subscription.sm');
      expect(() => subscriptionStateMachine.validateTransition('trial', 'active')).not.toThrow();
    });

    it('should validate overdue path: active->overdue->suspended', () => {
      const { subscriptionStateMachine } = require('../../common/statemachine/definitions/subscription.sm');
      expect(() => subscriptionStateMachine.validateTransition('active', 'overdue')).not.toThrow();
      expect(() => subscriptionStateMachine.validateTransition('overdue', 'suspended')).not.toThrow();
    });

    it('should validate resume path: suspended->active', () => {
      const { subscriptionStateMachine } = require('../../common/statemachine/definitions/subscription.sm');
      expect(() => subscriptionStateMachine.validateTransition('suspended', 'active')).not.toThrow();
    });

    it('should validate cancel path: active->cancelled', () => {
      const { subscriptionStateMachine } = require('../../common/statemachine/definitions/subscription.sm');
      expect(() => subscriptionStateMachine.validateTransition('active', 'cancelled')).not.toThrow();
    });
  });
});
