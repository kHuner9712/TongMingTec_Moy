import { Test, TestingModule } from '@nestjs/testing';
import { TkService } from './tk.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket, TicketStatus, TicketPriority } from './entities/ticket.entity';
import { TicketLog } from './entities/ticket-log.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventBusService } from '../../common/events/event-bus.service';

describe('TkService', () => {
  let service: TkService;
  let ticketRepository: jest.Mocked<any>;
  let logRepository: jest.Mocked<any>;

  const mockTicket = {
    id: 'ticket-uuid-123',
    orgId: 'org-uuid-123',
    conversationId: 'conv-uuid-123',
    customerId: 'customer-uuid-123',
    ticketNo: 'TK-001',
    title: '产品咨询工单',
    status: TicketStatus.PENDING,
    priority: TicketPriority.NORMAL,
    assigneeUserId: null,
    resolvedAt: null,
    closedAt: null,
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
        TkService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(createMockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(TicketLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {},
        },
        {
          provide: EventBusService,
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<TkService>(TkService);
    ticketRepository = module.get(getRepositoryToken(Ticket));
    logRepository = module.get(getRepositoryToken(TicketLog));
  });

  describe('findTicketById', () => {
    it('should return ticket if found', async () => {
      ticketRepository.findOne.mockResolvedValue(mockTicket);

      const result = await service.findTicketById('ticket-uuid-123', 'org-uuid-123');

      expect(result.id).toBe('ticket-uuid-123');
      expect(result.status).toBe(TicketStatus.PENDING);
    });

    it('should throw NotFoundException if ticket not found', async () => {
      ticketRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findTicketById('nonexistent', 'org-uuid-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findTickets', () => {
    it('should return paginated tickets with filters', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockTicket], 1]);
      ticketRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findTickets(
        'org-uuid-123',
        'user-uuid-123',
        'org',
        { status: TicketStatus.PENDING },
        1,
        10,
      );

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by self dataScope', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockTicket], 1]);
      ticketRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findTickets(
        'org-uuid-123',
        'user-uuid-123',
        'self',
        {},
        1,
        10,
      );

      expect(mockQb.andWhere).toHaveBeenCalled();
    });
  });

  describe('createTicket', () => {
    it('should create ticket with pending status', async () => {
      ticketRepository.create.mockReturnValue(mockTicket);
      ticketRepository.save.mockResolvedValue(mockTicket);
      logRepository.create.mockReturnValue({});
      logRepository.save.mockResolvedValue({});

      const result = await service.createTicket('org-uuid-123', {
        conversationId: 'conv-uuid-123',
        customerId: 'customer-uuid-123',
        title: '产品咨询工单',
        priority: TicketPriority.NORMAL,
      }, 'user-uuid-123');

      expect(ticketRepository.create).toHaveBeenCalled();
      expect(ticketRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(TicketStatus.PENDING);
    });
  });

  describe('assign', () => {
    it('should assign ticket to user', async () => {
      ticketRepository.findOne.mockResolvedValue(mockTicket);
      ticketRepository.update.mockResolvedValue({ affected: 1 });
      logRepository.create.mockReturnValue({});
      logRepository.save.mockResolvedValue({});

      const result = await service.assign(
        'ticket-uuid-123',
        'org-uuid-123',
        'agent-uuid-123',
        'user-uuid-123',
        1,
      );

      expect(ticketRepository.update).toHaveBeenCalledWith(
        'ticket-uuid-123',
        expect.objectContaining({ assigneeUserId: 'agent-uuid-123' }),
      );
    });

    it('should throw ConflictException for version mismatch', async () => {
      ticketRepository.findOne.mockResolvedValue({
        ...mockTicket,
        version: 2,
      });

      await expect(
        service.assign('ticket-uuid-123', 'org-uuid-123', 'agent-uuid-123', 'user-uuid-123', 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('resolve', () => {
    it('should resolve ticket', async () => {
      ticketRepository.findOne.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.PROCESSING,
        assigneeUserId: 'agent-uuid-123',
      });
      ticketRepository.update.mockResolvedValue({ affected: 1 });
      logRepository.create.mockReturnValue({});
      logRepository.save.mockResolvedValue({});

      const result = await service.resolve(
        'ticket-uuid-123',
        'org-uuid-123',
        '问题已解决',
        'user-uuid-123',
        1,
      );

      expect(ticketRepository.update).toHaveBeenCalledWith(
        'ticket-uuid-123',
        expect.objectContaining({ status: TicketStatus.RESOLVED }),
      );
    });

    it('should throw ConflictException if not in progress', async () => {
      ticketRepository.findOne.mockResolvedValue(mockTicket);

      await expect(
        service.resolve('ticket-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for version mismatch', async () => {
      ticketRepository.findOne.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.PROCESSING,
        assigneeUserId: 'agent-uuid-123',
        version: 2,
      });

      await expect(
        service.resolve('ticket-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('close', () => {
    it('should close resolved ticket', async () => {
      ticketRepository.findOne.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.RESOLVED,
      });
      ticketRepository.update.mockResolvedValue({ affected: 1 });
      logRepository.create.mockReturnValue({});
      logRepository.save.mockResolvedValue({});

      const result = await service.close(
        'ticket-uuid-123',
        'org-uuid-123',
        '问题已关闭',
        'user-uuid-123',
        1,
      );

      expect(ticketRepository.update).toHaveBeenCalledWith(
        'ticket-uuid-123',
        expect.objectContaining({ status: TicketStatus.CLOSED }),
      );
    });

    it('should close pending ticket', async () => {
      ticketRepository.findOne.mockResolvedValue(mockTicket);
      ticketRepository.update.mockResolvedValue({ affected: 1 });
      logRepository.create.mockReturnValue({});
      logRepository.save.mockResolvedValue({});

      const result = await service.close(
        'ticket-uuid-123',
        'org-uuid-123',
        '问题已关闭',
        'user-uuid-123',
        1,
      );

      expect(ticketRepository.update).toHaveBeenCalledWith(
        'ticket-uuid-123',
        expect.objectContaining({ status: TicketStatus.CLOSED }),
      );
    });

    it('should throw ConflictException for version mismatch', async () => {
      ticketRepository.findOne.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.RESOLVED,
        version: 2,
      });

      await expect(
        service.close('ticket-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('SM-ticket state machine validation', () => {
    it('should allow transition from pending to assigned', async () => {
      ticketRepository.findOne.mockResolvedValue(mockTicket);
      ticketRepository.update.mockResolvedValue({ affected: 1 });
      logRepository.create.mockReturnValue({});
      logRepository.save.mockResolvedValue({});

      await expect(
        service.assign('ticket-uuid-123', 'org-uuid-123', 'agent-uuid-123', 'user-uuid-123', 1),
      ).resolves.not.toThrow();
    });

    it('should allow transition from assigned to in_progress', async () => {
      ticketRepository.findOne.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.ASSIGNED,
        assigneeUserId: 'agent-uuid-123',
        version: 1,
      });
      ticketRepository.update.mockResolvedValue({ affected: 1 });
      logRepository.create.mockReturnValue({});
      logRepository.save.mockResolvedValue({});

      await expect(
        service.start('ticket-uuid-123', 'org-uuid-123', 'user-uuid-123', 1),
      ).resolves.not.toThrow();
    });

    it('should allow transition from in_progress to resolved', async () => {
      ticketRepository.findOne.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.PROCESSING,
        assigneeUserId: 'agent-uuid-123',
        version: 1,
      });
      ticketRepository.update.mockResolvedValue({ affected: 1 });
      logRepository.create.mockReturnValue({});
      logRepository.save.mockResolvedValue({});

      await expect(
        service.resolve('ticket-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).resolves.not.toThrow();
    });

    it('should allow transition from resolved to closed', async () => {
      ticketRepository.findOne.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.RESOLVED,
        version: 1,
      });
      ticketRepository.update.mockResolvedValue({ affected: 1 });
      logRepository.create.mockReturnValue({});
      logRepository.save.mockResolvedValue({});

      await expect(
        service.close('ticket-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).resolves.not.toThrow();
    });

    it('should block transition from closed to resolved', async () => {
      ticketRepository.findOne.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.CLOSED,
        version: 1,
      });

      await expect(
        service.resolve('ticket-uuid-123', 'org-uuid-123', 'reason', 'user-uuid-123', 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('multi-tenant isolation', () => {
    it('should only return tickets from same org', async () => {
      ticketRepository.findOne.mockResolvedValue(mockTicket);

      await service.findTicketById('ticket-uuid-123', 'org-uuid-123');

      expect(ticketRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: 'org-uuid-123',
          }),
        }),
      );
    });

    it('should throw NotFoundException for cross-org access', async () => {
      ticketRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findTicketById('ticket-uuid-123', 'different-org-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
