import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CustomerOperatingRecord } from './entities/customer-operating-record.entity';
import { CustomerTimelineEvent, TimelineActorType } from './entities/customer-timeline-event.entity';
import { CustomerStateSnapshot, SnapshotType } from './entities/customer-state-snapshot.entity';
import { Customer } from '../cm/entities/customer.entity';
import { CustomerContact } from '../cm/entities/customer-contact.entity';
import { Lead } from '../lm/entities/lead.entity';
import { Opportunity } from '../om/entities/opportunity.entity';
import { Conversation } from '../cnv/entities/conversation.entity';
import { Ticket } from '../tk/entities/ticket.entity';
import { OperatingRecordService } from './services/operating-record.service';
import { TimelineService } from './services/timeline.service';
import { SnapshotService } from './services/snapshot.service';
import { Customer360Service } from './services/customer-360.service';
import { ContextService } from '../cmem/services/context.service';
import { IntentService } from '../cmem/services/intent.service';
import { RiskService } from '../cmem/services/risk.service';
import { NextActionService } from '../cmem/services/next-action.service';
import { EventBusService } from '../../common/events/event-bus.service';

describe('OperatingRecordService', () => {
  let service: OperatingRecordService;
  let recordRepo: any;

  beforeEach(async () => {
    recordRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatingRecordService,
        { provide: getRepositoryToken(CustomerOperatingRecord), useValue: recordRepo },
      ],
    }).compile();

    service = module.get<OperatingRecordService>(OperatingRecordService);
  });

  describe('createRecord', () => {
    it('should create an operating record', async () => {
      const mockRecord = { id: 'record-1', customerId: 'cust-1', recordType: 'visit' };
      recordRepo.create.mockReturnValue(mockRecord);
      recordRepo.save.mockResolvedValue(mockRecord);

      const result = await service.createRecord('cust-1', 'org-1', {
        recordType: 'visit',
        content: '客户拜访',
        sourceType: 'manual',
      } as any, 'user-1');

      expect(recordRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'cust-1', orgId: 'org-1' }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('getRecords', () => {
    it('should return paginated records', async () => {
      const mockRecords = [{ id: 'record-1' }, { id: 'record-2' }];
      recordRepo.findAndCount.mockResolvedValue([mockRecords, 2]);

      const result = await service.getRecords('cust-1', 'org-1', 1, 20);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});

describe('TimelineService', () => {
  let service: TimelineService;
  let timelineRepo: any;
  let eventBus: any;

  beforeEach(async () => {
    timelineRepo = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    eventBus = {
      subscribe: jest.fn(),
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimelineService,
        { provide: getRepositoryToken(CustomerTimelineEvent), useValue: timelineRepo },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<TimelineService>(TimelineService);
  });

  describe('appendEvent', () => {
    it('should append a timeline event', async () => {
      const mockEvent = { id: 'event-1', customerId: 'cust-1', eventType: 'customer.created' };
      timelineRepo.create.mockReturnValue(mockEvent);
      timelineRepo.save.mockResolvedValue(mockEvent);

      const result = await service.appendEvent(
        'cust-1', 'org-1', 'customer.created', 'customer',
        { name: '测试' }, TimelineActorType.USER, 'user-1',
      );

      expect(result).toBeDefined();
      expect(timelineRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'cust-1', eventType: 'customer.created' }),
      );
    });
  });

  describe('getTimeline', () => {
    it('should return paginated timeline events', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'event-1' }], 1]),
      };
      timelineRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getTimeline('cust-1', 'org-1', { page: 1, pageSize: 20 } as any);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});

describe('SnapshotService', () => {
  let service: SnapshotService;
  let snapshotRepo: any;

  beforeEach(async () => {
    snapshotRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnapshotService,
        { provide: getRepositoryToken(CustomerStateSnapshot), useValue: snapshotRepo },
      ],
    }).compile();

    service = module.get<SnapshotService>(SnapshotService);
  });

  describe('createSnapshot', () => {
    it('should create a snapshot', async () => {
      const mockSnapshot = { id: 'snap-1', customerId: 'cust-1' };
      snapshotRepo.create.mockReturnValue(mockSnapshot);
      snapshotRepo.save.mockResolvedValue(mockSnapshot);

      const result = await service.createSnapshot({
        customerId: 'cust-1',
        orgId: 'org-1',
        snapshotType: SnapshotType.MANUAL,
        stateData: { status: 'active' },
      });

      expect(result).toBeDefined();
    });
  });

  describe('getLatestSnapshot', () => {
    it('should return the latest snapshot', async () => {
      const mockSnapshot = { id: 'snap-1', customerId: 'cust-1' };
      snapshotRepo.findOne.mockResolvedValue(mockSnapshot);

      const result = await service.getLatestSnapshot('cust-1', 'org-1');

      expect(result).toBeDefined();
    });

    it('should return null when no snapshot exists', async () => {
      snapshotRepo.findOne.mockResolvedValue(null);

      const result = await service.getLatestSnapshot('cust-1', 'org-1');

      expect(result).toBeNull();
    });
  });

  describe('getSnapshots', () => {
    it('should return paginated snapshots', async () => {
      snapshotRepo.findAndCount.mockResolvedValue([[{ id: 'snap-1' }], 1]);

      const result = await service.getSnapshots('cust-1', 'org-1', 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});

describe('Customer360Service', () => {
  let service: Customer360Service;
  let customerRepo: any;
  let contactRepo: any;
  let leadRepo: any;
  let opportunityRepo: any;
  let conversationRepo: any;
  let ticketRepo: any;
  let contextService: any;
  let intentService: any;
  let riskService: any;
  let nextActionService: any;

  const mockCustomer = { id: 'cust-1', orgId: 'org-1', name: '测试客户', riskLevel: 'low' };

  beforeEach(async () => {
    customerRepo = { findOne: jest.fn() };
    contactRepo = { find: jest.fn().mockResolvedValue([]) };
    leadRepo = { find: jest.fn().mockResolvedValue([]) };
    opportunityRepo = { find: jest.fn().mockResolvedValue([]) };
    conversationRepo = { find: jest.fn().mockResolvedValue([]) };
    ticketRepo = { find: jest.fn().mockResolvedValue([]) };
    contextService = { getLatestContext: jest.fn().mockResolvedValue(null) };
    intentService = { getLatestIntent: jest.fn().mockResolvedValue(null) };
    riskService = { getLatestRiskLevel: jest.fn().mockResolvedValue('low') };
    nextActionService = { getPendingActions: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Customer360Service,
        { provide: getRepositoryToken(Customer), useValue: customerRepo },
        { provide: getRepositoryToken(CustomerContact), useValue: contactRepo },
        { provide: getRepositoryToken(Lead), useValue: leadRepo },
        { provide: getRepositoryToken(Opportunity), useValue: opportunityRepo },
        { provide: getRepositoryToken(Conversation), useValue: conversationRepo },
        { provide: getRepositoryToken(Ticket), useValue: ticketRepo },
        { provide: ContextService, useValue: contextService },
        { provide: IntentService, useValue: intentService },
        { provide: RiskService, useValue: riskService },
        { provide: NextActionService, useValue: nextActionService },
      ],
    }).compile();

    service = module.get<Customer360Service>(Customer360Service);
  });

  describe('getCustomer360', () => {
    it('should throw NotFoundException when customer not found', async () => {
      customerRepo.findOne.mockResolvedValue(null);

      await expect(service.getCustomer360('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });
});
