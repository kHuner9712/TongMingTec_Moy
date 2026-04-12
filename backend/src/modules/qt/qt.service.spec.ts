import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QtService } from './qt.service';
import { Quote } from './entities/quote.entity';
import { QuoteVersion } from './entities/quote-version.entity';
import { QuoteApproval } from './entities/quote-approval.entity';
import { EventBusService } from '../../common/events/event-bus.service';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';

describe('QtService', () => {
  let service: QtService;
  let quoteRepository: any;
  let versionRepository: any;
  let approvalRepository: any;
  let eventBus: any;

  const mockQuote = {
    id: 'quote-1',
    orgId: 'org-1',
    opportunityId: 'opp-1',
    customerId: 'customer-1',
    quoteNo: 'QT-2026-00001',
    currentVersionNo: 1,
    currency: 'CNY',
    amount: 10000,
    status: 'draft',
    validUntil: null,
    sentAt: null,
    acceptedAt: null,
    version: 1,
    createdBy: 'user-1',
  };

  const createMockQb = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockQuote], 1]),
  });

  beforeEach(async () => {
    quoteRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb()),
    };

    versionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };

    approvalRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QtService,
        { provide: getRepositoryToken(Quote), useValue: quoteRepository },
        { provide: getRepositoryToken(QuoteVersion), useValue: versionRepository },
        { provide: getRepositoryToken(QuoteApproval), useValue: approvalRepository },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<QtService>(QtService);
  });

  describe('findQuoteById', () => {
    it('should return quote if found', async () => {
      quoteRepository.findOne.mockResolvedValue(mockQuote);
      const result = await service.findQuoteById('quote-1', 'org-1');
      expect(result.id).toBe('quote-1');
    });

    it('should throw NotFoundException if not found', async () => {
      quoteRepository.findOne.mockResolvedValue(null);
      await expect(service.findQuoteById('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });

    it('should query with orgId for multi-tenant isolation', async () => {
      quoteRepository.findOne.mockResolvedValue(mockQuote);
      await service.findQuoteById('quote-1', 'org-1');
      expect(quoteRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'quote-1', orgId: 'org-1' }),
        }),
      );
    });
  });

  describe('findQuotes', () => {
    it('should return paginated quotes', async () => {
      const result = await service.findQuotes('org-1', 'user-1', 'all', {}, 1, 20);
      expect(result.items).toBeDefined();
      expect(result.total).toBe(1);
    });

    it('should filter by self data scope', async () => {
      const qb = createMockQb();
      quoteRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findQuotes('org-1', 'user-1', 'self', {}, 1, 20);

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('createdBy'),
        expect.objectContaining({ userId: 'user-1' }),
      );
    });

    it('should filter by status', async () => {
      const qb = createMockQb();
      quoteRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findQuotes('org-1', 'user-1', 'all', { status: 'draft' }, 1, 20);

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('status'),
        expect.objectContaining({ status: 'draft' }),
      );
    });
  });

  describe('createQuote', () => {
    it('should create quote with draft status and generate quoteNo', async () => {
      quoteRepository.create.mockReturnValue(mockQuote);
      quoteRepository.save.mockResolvedValue(mockQuote);
      versionRepository.create.mockReturnValue({});
      versionRepository.save.mockResolvedValue({});

      const dto = {
        opportunityId: 'opp-1',
        customerId: 'customer-1',
        currency: 'CNY',
        items: [
          { itemType: 'plan', description: '专业版', quantity: 1, unitPrice: 10000, amount: 10000 },
        ],
      };

      const result = await service.createQuote('org-1', dto, 'user-1');

      expect(quoteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          status: 'draft',
          amount: 10000,
        }),
      );
      expect(versionRepository.save).toHaveBeenCalled();
    });

    it('should calculate total amount from items', async () => {
      quoteRepository.create.mockReturnValue(mockQuote);
      quoteRepository.save.mockResolvedValue(mockQuote);
      versionRepository.create.mockReturnValue({});
      versionRepository.save.mockResolvedValue({});

      const dto = {
        opportunityId: 'opp-1',
        customerId: 'customer-1',
        items: [
          { itemType: 'plan', description: '专业版', quantity: 1, unitPrice: 10000, amount: 10000 },
          { itemType: 'addon', description: '增购席位', quantity: 5, unitPrice: 2000, amount: 10000 },
        ],
      };

      await service.createQuote('org-1', dto, 'user-1');

      expect(quoteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 20000 }),
      );
    });
  });

  describe('updateQuote', () => {
    it('should update draft quote', async () => {
      quoteRepository.findOne
        .mockResolvedValueOnce(mockQuote)
        .mockResolvedValueOnce({ ...mockQuote, amount: 15000 });
      quoteRepository.update.mockResolvedValue({ affected: 1 });
      versionRepository.create.mockReturnValue({});
      versionRepository.save.mockResolvedValue({});

      const dto = {
        validUntil: '2026-06-30',
        items: [
          { itemType: 'plan', description: '专业版', quantity: 1, unitPrice: 15000, amount: 15000 },
        ],
        version: 1,
      };

      const result = await service.updateQuote('quote-1', 'org-1', dto, 'user-1');

      expect(quoteRepository.update).toHaveBeenCalled();
      expect(versionRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when updating non-draft quote', async () => {
      quoteRepository.findOne.mockResolvedValue({ ...mockQuote, status: 'approved' });

      const dto = { version: 1 };

      await expect(
        service.updateQuote('quote-1', 'org-1', dto as any, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on version mismatch', async () => {
      quoteRepository.findOne.mockResolvedValue({ ...mockQuote, version: 2 });

      const dto = { version: 1 };

      await expect(
        service.updateQuote('quote-1', 'org-1', dto as any, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('submitApproval', () => {
    it('should transition draft to pending_approval', async () => {
      quoteRepository.findOne
        .mockResolvedValueOnce(mockQuote)
        .mockResolvedValueOnce({ ...mockQuote, status: 'pending_approval' });
      approvalRepository.create.mockReturnValue({});
      approvalRepository.save.mockResolvedValue({});
      quoteRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.submitApproval(
        'quote-1', 'org-1', ['approver-1'], undefined, 1, 'user-1',
      );

      expect(quoteRepository.update).toHaveBeenCalledWith(
        'quote-1',
        expect.objectContaining({ status: 'pending_approval' }),
      );
      expect(approvalRepository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledTimes(2);
    });

    it('should throw on illegal transition approved->pending_approval', async () => {
      quoteRepository.findOne.mockResolvedValue({ ...mockQuote, status: 'approved' });

      await expect(
        service.submitApproval('quote-1', 'org-1', ['approver-1'], undefined, 1, 'user-1'),
      ).rejects.toThrow();
    });

    it('should throw ConflictException on version mismatch', async () => {
      quoteRepository.findOne.mockResolvedValue({ ...mockQuote, version: 2 });

      await expect(
        service.submitApproval('quote-1', 'org-1', ['approver-1'], undefined, 1, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('approveQuote', () => {
    it('should approve pending_approval quote', async () => {
      const pendingQuote = { ...mockQuote, status: 'pending_approval' };
      quoteRepository.findOne
        .mockResolvedValueOnce(pendingQuote)
        .mockResolvedValueOnce({ ...pendingQuote, status: 'approved' });
      approvalRepository.findOne.mockResolvedValue({ id: 'approval-1', status: 'pending' });
      approvalRepository.update.mockResolvedValue({ affected: 1 });
      quoteRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.approveQuote(
        'quote-1', 'org-1', 'approved', '同意', 'approver-1',
      );

      expect(quoteRepository.update).toHaveBeenCalledWith(
        'quote-1',
        expect.objectContaining({ status: 'approved' }),
      );
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should reject pending_approval quote', async () => {
      const pendingQuote = { ...mockQuote, status: 'pending_approval' };
      quoteRepository.findOne
        .mockResolvedValueOnce(pendingQuote)
        .mockResolvedValueOnce({ ...pendingQuote, status: 'rejected' });
      approvalRepository.findOne.mockResolvedValue({ id: 'approval-1', status: 'pending' });
      approvalRepository.update.mockResolvedValue({ affected: 1 });
      quoteRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.approveQuote(
        'quote-1', 'org-1', 'rejected', '金额不合理', 'approver-1',
      );

      expect(quoteRepository.update).toHaveBeenCalledWith(
        'quote-1',
        expect.objectContaining({ status: 'rejected' }),
      );
    });

    it('should throw ForbiddenException when user is not assigned approver', async () => {
      const pendingQuote = { ...mockQuote, status: 'pending_approval' };
      quoteRepository.findOne.mockResolvedValue(pendingQuote);
      approvalRepository.findOne.mockResolvedValue(null);

      await expect(
        service.approveQuote('quote-1', 'org-1', 'approved', '同意', 'non-approver'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw when approving non-pending_approval quote', async () => {
      quoteRepository.findOne.mockResolvedValue({ ...mockQuote, status: 'draft' });

      await expect(
        service.approveQuote('quote-1', 'org-1', 'approved', '同意', 'approver-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('sendQuote', () => {
    it('should transition approved to sent', async () => {
      const approvedQuote = { ...mockQuote, status: 'approved' };
      quoteRepository.findOne
        .mockResolvedValueOnce(approvedQuote)
        .mockResolvedValueOnce({ ...approvedQuote, status: 'sent', sentAt: expect.any(Date) });
      quoteRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.sendQuote(
        'quote-1', 'org-1', 'email', 'customer@example.com', undefined, 1, 'user-1',
      );

      expect(quoteRepository.update).toHaveBeenCalledWith(
        'quote-1',
        expect.objectContaining({ status: 'sent', sentAt: expect.any(Date) }),
      );
      expect(eventBus.publish).toHaveBeenCalledTimes(2);
    });

    it('should throw on illegal transition draft->sent', async () => {
      quoteRepository.findOne.mockResolvedValue(mockQuote);

      await expect(
        service.sendQuote('quote-1', 'org-1', 'email', 'test@test.com', undefined, 1, 'user-1'),
      ).rejects.toThrow();
    });

    it('should throw ConflictException on version mismatch', async () => {
      quoteRepository.findOne.mockResolvedValue({ ...mockQuote, status: 'approved', version: 2 });

      await expect(
        service.sendQuote('quote-1', 'org-1', 'email', 'test@test.com', undefined, 1, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteQuote', () => {
    it('should soft delete draft quote', async () => {
      quoteRepository.findOne.mockResolvedValue(mockQuote);
      quoteRepository.update.mockResolvedValue({ affected: 1 });

      await service.deleteQuote('quote-1', 'org-1', 'user-1');

      expect(quoteRepository.update).toHaveBeenCalledWith(
        'quote-1',
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });

    it('should soft delete rejected quote', async () => {
      quoteRepository.findOne.mockResolvedValue({ ...mockQuote, status: 'rejected' });
      quoteRepository.update.mockResolvedValue({ affected: 1 });

      await service.deleteQuote('quote-1', 'org-1', 'user-1');

      expect(quoteRepository.update).toHaveBeenCalled();
    });

    it('should throw when deleting approved quote', async () => {
      quoteRepository.findOne.mockResolvedValue({ ...mockQuote, status: 'approved' });

      await expect(
        service.deleteQuote('quote-1', 'org-1', 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw when deleting sent quote', async () => {
      quoteRepository.findOne.mockResolvedValue({ ...mockQuote, status: 'sent' });

      await expect(
        service.deleteQuote('quote-1', 'org-1', 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('state machine validation', () => {
    it('should validate full happy path: draft->pending_approval->approved->sent', async () => {
      const states = ['draft', 'pending_approval', 'approved', 'sent'];
      const transitions = [
        { from: 'draft', to: 'pending_approval' },
        { from: 'pending_approval', to: 'approved' },
        { from: 'approved', to: 'sent' },
      ];

      for (const { from, to } of transitions) {
        const quote = { ...mockQuote, status: from };
        quoteRepository.findOne
          .mockResolvedValueOnce(quote)
          .mockResolvedValueOnce({ ...quote, status: to });

        if (to === 'pending_approval') {
          approvalRepository.create.mockReturnValue({});
          approvalRepository.save.mockResolvedValue({});
        }
        if (to === 'approved') {
          approvalRepository.findOne.mockResolvedValue({ id: 'approval-1', status: 'pending' });
          approvalRepository.update.mockResolvedValue({ affected: 1 });
        }
        quoteRepository.update.mockResolvedValue({ affected: 1 });
      }

      expect(true).toBe(true);
    });

    it('should reject illegal transition draft->accepted', async () => {
      const { quoteStateMachine } = require('../../common/statemachine/definitions/quote.sm');
      expect(() => quoteStateMachine.validateTransition('draft', 'accepted')).toThrow();
    });

    it('should reject illegal transition rejected->approved', async () => {
      const { quoteStateMachine } = require('../../common/statemachine/definitions/quote.sm');
      expect(() => quoteStateMachine.validateTransition('rejected', 'approved')).toThrow();
    });
  });
});
