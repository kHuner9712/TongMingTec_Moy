import { Test, TestingModule } from '@nestjs/testing';
import { TkService } from './tk.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket, TicketStatus, TicketPriority } from './entities/ticket.entity';
import { TicketLog } from './entities/ticket-log.entity';
import { DataSource } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('TkService', () => {
  let service: TkService;
  let ticketRepository: jest.Mocked<any>;
  let logRepository: jest.Mocked<any>;

  const mockTicket = {
    id: 'ticket-uuid-123',
    orgId: 'org-uuid-123',
    conversationId: null,
    customerId: null,
    title: 'Test Ticket',
    description: 'Test description',
    priority: TicketPriority.NORMAL,
    status: TicketStatus.PENDING,
    assigneeUserId: null,
    solution: null,
    closeReason: null,
    firstResponseAt: null,
    resolvedAt: null,
    closedAt: null,
    version: 1,
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
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn(),
            })),
            update: jest.fn(),
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
    });

    it('should throw NotFoundException if not found', async () => {
      ticketRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findTicketById('nonexistent', 'org-uuid-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTicket', () => {
    it('should create ticket with pending status', async () => {
      ticketRepository.create.mockReturnValue(mockTicket);
      ticketRepository.save.mockResolvedValue(mockTicket);
      logRepository.create.mockReturnValue({});
      logRepository.save.mockResolvedValue({});

      const result = await service.createTicket('org-uuid-123', {
        title: 'Test Ticket',
        description: 'Test description',
      }, 'user-uuid-123');

      expect(ticketRepository.save).toHaveBeenCalled();
      expect(logRepository.save).toHaveBeenCalled();
    });
  });

  describe('assign', () => {
    it('should assign ticket to user', async () => {
      ticketRepository.findOne.mockResolvedValue(mockTicket);
      ticketRepository.update.mockResolvedValue({ affected: 1 });
      logRepository.create.mockReturnValue({});
      logRepository.save.mockResolvedValue({});

      await service.assign(
        'ticket-uuid-123',
        'org-uuid-123',
        'agent-uuid-123',
        'user-uuid-123',
        1,
      );

      expect(ticketRepository.update).toHaveBeenCalledWith(
        'ticket-uuid-123',
        expect.objectContaining({
          assigneeUserId: 'agent-uuid-123',
          status: TicketStatus.ASSIGNED,
        }),
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
    it('should resolve ticket with solution', async () => {
      ticketRepository.findOne.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.IN_PROGRESS,
      });
      ticketRepository.update.mockResolvedValue({ affected: 1 });
      logRepository.create.mockReturnValue({});
      logRepository.save.mockResolvedValue({});

      await service.resolve(
        'ticket-uuid-123',
        'org-uuid-123',
        'Problem solved',
        'user-uuid-123',
        1,
      );

      expect(ticketRepository.update).toHaveBeenCalledWith(
        'ticket-uuid-123',
        expect.objectContaining({
          status: TicketStatus.RESOLVED,
          solution: 'Problem solved',
        }),
      );
    });

    it('should throw BadRequestException for invalid status', async () => {
      ticketRepository.findOne.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.PENDING,
      });

      await expect(
        service.resolve('ticket-uuid-123', 'org-uuid-123', 'Solution', 'user-uuid-123', 1),
      ).rejects.toThrow(BadRequestException);
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

      await service.close(
        'ticket-uuid-123',
        'org-uuid-123',
        'Customer satisfied',
        'user-uuid-123',
        1,
      );

      expect(ticketRepository.update).toHaveBeenCalledWith(
        'ticket-uuid-123',
        expect.objectContaining({
          status: TicketStatus.CLOSED,
          closeReason: 'Customer satisfied',
        }),
      );
    });
  });
});
