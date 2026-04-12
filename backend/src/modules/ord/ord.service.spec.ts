import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdService } from './ord.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { EventBusService } from '../../common/events/event-bus.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('OrdService', () => {
  let service: OrdService;
  let orderRepository: any;
  let itemRepository: any;
  let eventBus: any;

  const mockOrder = {
    id: 'order-1',
    orgId: 'org-1',
    contractId: null,
    quoteId: null,
    customerId: 'customer-1',
    orderNo: 'ORD-2026-00001',
    orderType: 'new',
    status: 'draft',
    currency: 'CNY',
    totalAmount: 1000,
    activatedAt: null,
    version: 1,
    createdBy: 'user-1',
  };

  const createMockQb = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockOrder], 1]),
  });

  beforeEach(async () => {
    orderRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb()),
    };

    itemRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };

    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdService,
        { provide: getRepositoryToken(Order), useValue: orderRepository },
        { provide: getRepositoryToken(OrderItem), useValue: itemRepository },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<OrdService>(OrdService);
  });

  describe('findOrderById', () => {
    it('should return order if found', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      const result = await service.findOrderById('order-1', 'org-1');
      expect(result.id).toBe('order-1');
    });

    it('should throw NotFoundException if not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);
      await expect(service.findOrderById('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });

    it('should query with orgId for multi-tenant isolation', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      await service.findOrderById('order-1', 'org-1');
      expect(orderRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'order-1', orgId: 'org-1' }),
        }),
      );
    });
  });

  describe('createOrder', () => {
    it('should create order with draft status and items', async () => {
      orderRepository.create.mockReturnValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);
      itemRepository.create.mockReturnValue({});
      itemRepository.save.mockResolvedValue({});

      const dto = {
        customerId: 'customer-1',
        items: [{ itemType: 'plan', quantity: 1, unitPrice: 1000 }],
      };

      const result = await service.createOrder('org-1', dto, 'user-1');

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          status: 'draft',
          customerId: 'customer-1',
          totalAmount: 1000,
        }),
      );
      expect(itemRepository.save).toHaveBeenCalled();
    });

    it('should calculate totalAmount from items', async () => {
      orderRepository.create.mockReturnValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);
      itemRepository.create.mockReturnValue({});
      itemRepository.save.mockResolvedValue({});

      const dto = {
        customerId: 'customer-1',
        items: [
          { itemType: 'plan', quantity: 2, unitPrice: 500 },
          { itemType: 'addon', quantity: 1, unitPrice: 200 },
        ],
      };

      await service.createOrder('org-1', dto, 'user-1');

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 1200 }),
      );
    });
  });

  describe('createOrderFromContract', () => {
    it('should create order linked to contract', async () => {
      orderRepository.create.mockReturnValue({ ...mockOrder, contractId: 'contract-1' });
      orderRepository.save.mockResolvedValue({ ...mockOrder, contractId: 'contract-1' });
      itemRepository.create.mockReturnValue({});
      itemRepository.save.mockResolvedValue({});

      const result = await service.createOrderFromContract(
        'org-1', 'contract-1', 'quote-1', 'customer-1', 'user-1',
      );

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ contractId: 'contract-1', quoteId: 'quote-1' }),
      );
    });
  });

  describe('confirmOrder', () => {
    it('should transition draft to confirmed', async () => {
      orderRepository.findOne
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce({ ...mockOrder, status: 'confirmed' });
      orderRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.confirmOrder('order-1', 'org-1', 'user-1');

      expect(orderRepository.update).toHaveBeenCalledWith(
        'order-1',
        expect.objectContaining({ status: 'confirmed' }),
      );
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should throw on illegal transition active->confirmed', async () => {
      orderRepository.findOne.mockResolvedValue({ ...mockOrder, status: 'active' });

      await expect(
        service.confirmOrder('order-1', 'org-1', 'user-1'),
      ).rejects.toThrow();
    });
  });

  describe('activateOrder', () => {
    it('should transition confirmed to active', async () => {
      const confirmedOrder = { ...mockOrder, status: 'confirmed' };
      orderRepository.findOne
        .mockResolvedValueOnce(confirmedOrder)
        .mockResolvedValueOnce({ ...confirmedOrder, status: 'active' });
      orderRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.activateOrder('order-1', 'org-1', 'user-1');

      expect(orderRepository.update).toHaveBeenCalledWith(
        'order-1',
        expect.objectContaining({ status: 'active', activatedAt: expect.any(Date) }),
      );
    });
  });

  describe('completeOrder', () => {
    it('should transition active to completed', async () => {
      const activeOrder = { ...mockOrder, status: 'active' };
      orderRepository.findOne
        .mockResolvedValueOnce(activeOrder)
        .mockResolvedValueOnce({ ...activeOrder, status: 'completed' });
      orderRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.completeOrder('order-1', 'org-1', 'user-1');

      expect(orderRepository.update).toHaveBeenCalledWith(
        'order-1',
        expect.objectContaining({ status: 'completed' }),
      );
    });
  });

  describe('cancelOrder', () => {
    it('should transition confirmed to cancelled', async () => {
      const confirmedOrder = { ...mockOrder, status: 'confirmed' };
      orderRepository.findOne
        .mockResolvedValueOnce(confirmedOrder)
        .mockResolvedValueOnce({ ...confirmedOrder, status: 'cancelled' });
      orderRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.cancelOrder('order-1', 'org-1', '客户取消', 'user-1');

      expect(orderRepository.update).toHaveBeenCalledWith(
        'order-1',
        expect.objectContaining({ status: 'cancelled' }),
      );
    });
  });

  describe('deleteOrder', () => {
    it('should soft delete draft order', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.update.mockResolvedValue({ affected: 1 });

      await service.deleteOrder('order-1', 'org-1', 'user-1');

      expect(orderRepository.update).toHaveBeenCalledWith(
        'order-1',
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });

    it('should throw when deleting confirmed order', async () => {
      orderRepository.findOne.mockResolvedValue({ ...mockOrder, status: 'confirmed' });

      await expect(
        service.deleteOrder('order-1', 'org-1', 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('state machine validation', () => {
    it('should reject illegal transition draft->active', () => {
      const { orderStateMachine } = require('../../common/statemachine/definitions/order.sm');
      expect(() => orderStateMachine.validateTransition('draft', 'active')).toThrow();
    });

    it('should reject illegal transition completed->draft', () => {
      const { orderStateMachine } = require('../../common/statemachine/definitions/order.sm');
      expect(() => orderStateMachine.validateTransition('completed', 'draft')).toThrow();
    });

    it('should validate happy path: draft->confirmed->active->completed', () => {
      const { orderStateMachine } = require('../../common/statemachine/definitions/order.sm');
      expect(() => orderStateMachine.validateTransition('draft', 'confirmed')).not.toThrow();
      expect(() => orderStateMachine.validateTransition('confirmed', 'active')).not.toThrow();
      expect(() => orderStateMachine.validateTransition('active', 'completed')).not.toThrow();
    });

    it('should validate refund path: active->refunded', () => {
      const { orderStateMachine } = require('../../common/statemachine/definitions/order.sm');
      expect(() => orderStateMachine.validateTransition('active', 'refunded')).not.toThrow();
    });
  });
});
