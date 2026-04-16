import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashService } from './dash.service';
import { MetricSnapshot } from './entities/metric-snapshot.entity';
import { Lead } from '../lm/entities/lead.entity';
import { Conversation } from '../cnv/entities/conversation.entity';
import { Contract } from '../ct/entities/contract.entity';
import { Order } from '../ord/entities/order.entity';
import { Ticket } from '../tk/entities/ticket.entity';
import { EventBusService } from '../../common/events/event-bus.service';

type MockQb = {
  select: jest.Mock;
  addSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  setParameters: jest.Mock;
  innerJoin: jest.Mock;
  leftJoin: jest.Mock;
  groupBy: jest.Mock;
  addGroupBy: jest.Mock;
  getRawOne: jest.Mock;
  getRawMany: jest.Mock;
};

function createMockQb(
  rawOne: Record<string, string> = { sample: '0', value: '0', numerator: '0' },
  rawMany: any[] = [],
): MockQb {
  return {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(rawOne),
    getRawMany: jest.fn().mockResolvedValue(rawMany),
  };
}

describe('DashService', () => {
  let service: DashService;
  let metricRepo: any;

  const leadRepo = {
    createQueryBuilder: jest.fn().mockImplementation(() => createMockQb()),
  };

  const conversationRepo = {
    createQueryBuilder: jest.fn().mockImplementation(() => createMockQb()),
  };

  const contractRepo = {
    createQueryBuilder: jest.fn().mockImplementation(() => createMockQb()),
  };

  const orderRepo = {
    createQueryBuilder: jest
      .fn()
      .mockImplementation(() => createMockQb({ sample: '0', value: '0' }, [])),
  };

  const ticketRepo = {
    createQueryBuilder: jest.fn().mockImplementation(() => createMockQb()),
  };

  const eventBus = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    metricRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashService,
        { provide: getRepositoryToken(MetricSnapshot), useValue: metricRepo },
        { provide: getRepositoryToken(Lead), useValue: leadRepo },
        { provide: getRepositoryToken(Conversation), useValue: conversationRepo },
        { provide: getRepositoryToken(Contract), useValue: contractRepo },
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(Ticket), useValue: ticketRepo },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<DashService>(DashService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns executive dashboard payload with range fallback', async () => {
    const result = await service.getExecutiveDashboard('org-1', 'invalid-range');

    expect(result.board).toBe('executive');
    expect(result.range).toBe('30d');
    expect(Array.isArray(result.groups)).toBe(true);
    expect(Array.isArray(result.indicators)).toBe(true);
    expect(Array.isArray(result.moduleCoverage)).toBe(true);
  });

  it('returns sales dashboard payload for 7d range', async () => {
    const result = await service.getSalesDashboard('org-1', '7d');

    expect(result.board).toBe('sales');
    expect(result.range).toBe('7d');
    expect(result.groups.length).toBeGreaterThan(0);
  });

  it('records metric snapshot', async () => {
    const now = new Date();
    const mockSnapshot = {
      id: 'metric-1',
      orgId: 'org-1',
      metricKey: 'test_metric',
      metricType: 'gauge',
      value: 10,
      dimensions: {},
      snapshotAt: now,
      createdBy: 'user-1',
    };

    metricRepo.create.mockReturnValue(mockSnapshot);
    metricRepo.save.mockResolvedValue(mockSnapshot);

    const result = await service.recordMetric(
      'org-1',
      'test_metric',
      'gauge',
      10,
      {},
      'user-1',
    );

    expect(metricRepo.create).toHaveBeenCalled();
    expect(metricRepo.save).toHaveBeenCalledWith(mockSnapshot);
    expect(result).toEqual(mockSnapshot);
  });
});
