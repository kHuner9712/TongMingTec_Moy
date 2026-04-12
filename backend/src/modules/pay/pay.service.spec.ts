import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PayService } from './pay.service';
import { Payment } from './entities/payment.entity';
import { EventBusService } from '../../common/events/event-bus.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('PayService', () => {
  let service: PayService;
  let paymentRepository: any;
  let eventBus: any;

  const mockPayment = {
    id: 'payment-1',
    orgId: 'org-1',
    orderId: 'order-1',
    customerId: 'customer-1',
    paymentNo: 'PAY-2026-00001',
    paymentMethod: 'bank_transfer',
    status: 'pending',
    currency: 'CNY',
    amount: 5000,
    paidAt: null,
    externalTxnId: null,
    remark: null,
    version: 1,
    createdBy: 'user-1',
  };

  const createMockQb = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockPayment], 1]),
  });

  beforeEach(async () => {
    paymentRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb()),
    };

    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayService,
        { provide: getRepositoryToken(Payment), useValue: paymentRepository },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<PayService>(PayService);
  });

  describe('findPaymentById', () => {
    it('should return payment if found', async () => {
      paymentRepository.findOne.mockResolvedValue(mockPayment);
      const result = await service.findPaymentById('payment-1', 'org-1');
      expect(result.id).toBe('payment-1');
    });

    it('should throw NotFoundException if not found', async () => {
      paymentRepository.findOne.mockResolvedValue(null);
      await expect(service.findPaymentById('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });

    it('should query with orgId for multi-tenant isolation', async () => {
      paymentRepository.findOne.mockResolvedValue(mockPayment);
      await service.findPaymentById('payment-1', 'org-1');
      expect(paymentRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'payment-1', orgId: 'org-1' }),
        }),
      );
    });
  });

  describe('createPayment', () => {
    it('should create payment with pending status', async () => {
      paymentRepository.create.mockReturnValue(mockPayment);
      paymentRepository.save.mockResolvedValue(mockPayment);

      const dto = {
        orderId: 'order-1',
        customerId: 'customer-1',
        amount: 5000,
        paymentMethod: 'bank_transfer',
      };

      const result = await service.createPayment('org-1', dto, 'user-1');

      expect(paymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          status: 'pending',
          orderId: 'order-1',
          customerId: 'customer-1',
          amount: 5000,
        }),
      );
    });
  });

  describe('processPayment', () => {
    it('should transition pending to processing', async () => {
      paymentRepository.findOne
        .mockResolvedValueOnce(mockPayment)
        .mockResolvedValueOnce({ ...mockPayment, status: 'processing' });
      paymentRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.processPayment('payment-1', 'org-1', 'user-1');

      expect(paymentRepository.update).toHaveBeenCalledWith(
        'payment-1',
        expect.objectContaining({ status: 'processing' }),
      );
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should throw on illegal transition succeeded->processing', async () => {
      paymentRepository.findOne.mockResolvedValue({ ...mockPayment, status: 'succeeded' });

      await expect(
        service.processPayment('payment-1', 'org-1', 'user-1'),
      ).rejects.toThrow();
    });
  });

  describe('succeedPayment', () => {
    it('should transition processing to succeeded with paidAt', async () => {
      const processingPayment = { ...mockPayment, status: 'processing' };
      paymentRepository.findOne
        .mockResolvedValueOnce(processingPayment)
        .mockResolvedValueOnce({ ...processingPayment, status: 'succeeded' });
      paymentRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.succeedPayment('payment-1', 'org-1', 'TXN-123', 'user-1');

      expect(paymentRepository.update).toHaveBeenCalledWith(
        'payment-1',
        expect.objectContaining({
          status: 'succeeded',
          paidAt: expect.any(Date),
          externalTxnId: 'TXN-123',
        }),
      );
    });
  });

  describe('failPayment', () => {
    it('should transition processing to failed', async () => {
      const processingPayment = { ...mockPayment, status: 'processing' };
      paymentRepository.findOne
        .mockResolvedValueOnce(processingPayment)
        .mockResolvedValueOnce({ ...processingPayment, status: 'failed' });
      paymentRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.failPayment('payment-1', 'org-1', 'user-1');

      expect(paymentRepository.update).toHaveBeenCalledWith(
        'payment-1',
        expect.objectContaining({ status: 'failed' }),
      );
    });
  });

  describe('refundPayment', () => {
    it('should transition succeeded to refunded', async () => {
      const succeededPayment = { ...mockPayment, status: 'succeeded' };
      paymentRepository.findOne
        .mockResolvedValueOnce(succeededPayment)
        .mockResolvedValueOnce({ ...succeededPayment, status: 'refunded' });
      paymentRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.refundPayment('payment-1', 'org-1', 'user-1');

      expect(paymentRepository.update).toHaveBeenCalledWith(
        'payment-1',
        expect.objectContaining({ status: 'refunded' }),
      );
    });
  });

  describe('voidPayment', () => {
    it('should transition pending to voided', async () => {
      paymentRepository.findOne
        .mockResolvedValueOnce(mockPayment)
        .mockResolvedValueOnce({ ...mockPayment, status: 'voided' });
      paymentRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.voidPayment('payment-1', 'org-1', 'user-1');

      expect(paymentRepository.update).toHaveBeenCalledWith(
        'payment-1',
        expect.objectContaining({ status: 'voided' }),
      );
    });
  });

  describe('deletePayment', () => {
    it('should soft delete pending payment', async () => {
      paymentRepository.findOne.mockResolvedValue(mockPayment);
      paymentRepository.update.mockResolvedValue({ affected: 1 });

      await service.deletePayment('payment-1', 'org-1', 'user-1');

      expect(paymentRepository.update).toHaveBeenCalledWith(
        'payment-1',
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });

    it('should throw when deleting processing payment', async () => {
      paymentRepository.findOne.mockResolvedValue({ ...mockPayment, status: 'processing' });

      await expect(
        service.deletePayment('payment-1', 'org-1', 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('state machine validation', () => {
    it('should reject illegal transition pending->succeeded', () => {
      const { paymentStateMachine } = require('../../common/statemachine/definitions/payment.sm');
      expect(() => paymentStateMachine.validateTransition('pending', 'succeeded')).toThrow();
    });

    it('should reject illegal transition failed->processing', () => {
      const { paymentStateMachine } = require('../../common/statemachine/definitions/payment.sm');
      expect(() => paymentStateMachine.validateTransition('failed', 'processing')).toThrow();
    });

    it('should validate happy path: pending->processing->succeeded', () => {
      const { paymentStateMachine } = require('../../common/statemachine/definitions/payment.sm');
      expect(() => paymentStateMachine.validateTransition('pending', 'processing')).not.toThrow();
      expect(() => paymentStateMachine.validateTransition('processing', 'succeeded')).not.toThrow();
    });

    it('should validate refund path: succeeded->refunded', () => {
      const { paymentStateMachine } = require('../../common/statemachine/definitions/payment.sm');
      expect(() => paymentStateMachine.validateTransition('succeeded', 'refunded')).not.toThrow();
    });

    it('should validate void path: pending->voided', () => {
      const { paymentStateMachine } = require('../../common/statemachine/definitions/payment.sm');
      expect(() => paymentStateMachine.validateTransition('pending', 'voided')).not.toThrow();
    });
  });
});
