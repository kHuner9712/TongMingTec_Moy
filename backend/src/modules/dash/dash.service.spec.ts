import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashService } from './dash.service';
import { MetricSnapshot } from './entities/metric-snapshot.entity';
import { Customer } from '../cm/entities/customer.entity';
import { Lead } from '../lm/entities/lead.entity';
import { Opportunity } from '../om/entities/opportunity.entity';
import { Contract } from '../ct/entities/contract.entity';
import { Order } from '../ord/entities/order.entity';
import { Payment } from '../pay/entities/payment.entity';
import { Subscription } from '../sub/entities/subscription.entity';
import { Conversation } from '../cnv/entities/conversation.entity';
import { Ticket } from '../tk/entities/ticket.entity';
import { CustomerHealthScore } from '../csm/entities/customer-health-score.entity';

describe('DashService', () => {
  let service: DashService;
  let metricRepo: any;
  let customerRepo: any;
  let leadRepo: any;
  let opportunityRepo: any;
  let contractRepo: any;
  let orderRepo: any;
  let paymentRepo: any;
  let subscriptionRepo: any;
  let conversationRepo: any;
  let ticketRepo: any;
  let healthRepo: any;

  const createMockQb = (rawResult: any[] = []) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(rawResult[0] || null),
    getRawMany: jest.fn().mockResolvedValue(rawResult),
  });

  const ORG_ID = 'org-1';

  beforeEach(async () => {
    metricRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };

    customerRepo = {
      count: jest.fn().mockResolvedValue(0),
    };

    leadRepo = {
      count: jest.fn().mockResolvedValue(0),
    };

    opportunityRepo = {
      count: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockResolvedValue([]),
    };

    contractRepo = {
      count: jest.fn().mockResolvedValue(0),
    };

    orderRepo = {
      count: jest.fn().mockResolvedValue(0),
    };

    paymentRepo = {
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb([{ total: '0' }])),
    };

    subscriptionRepo = {
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb([{ total: '0' }])),
    };

    conversationRepo = {
      count: jest.fn().mockResolvedValue(0),
    };

    ticketRepo = {
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb([])),
    };

    healthRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashService,
        { provide: getRepositoryToken(MetricSnapshot), useValue: metricRepo },
        { provide: getRepositoryToken(Customer), useValue: customerRepo },
        { provide: getRepositoryToken(Lead), useValue: leadRepo },
        { provide: getRepositoryToken(Opportunity), useValue: opportunityRepo },
        { provide: getRepositoryToken(Contract), useValue: contractRepo },
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: getRepositoryToken(Subscription), useValue: subscriptionRepo },
        { provide: getRepositoryToken(Conversation), useValue: conversationRepo },
        { provide: getRepositoryToken(Ticket), useValue: ticketRepo },
        { provide: getRepositoryToken(CustomerHealthScore), useValue: healthRepo },
      ],
    }).compile();

    service = module.get<DashService>(DashService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardSummary', () => {
    it('should return summary with zero values when no data', async () => {
      const result = await service.getDashboardSummary(ORG_ID);

      expect(result.customerMetrics).toBeDefined();
      expect(result.opportunityMetrics).toBeDefined();
      expect(result.dealMetrics).toBeDefined();
      expect(result.paymentMetrics).toBeDefined();
      expect(result.healthMetrics).toBeDefined();
      expect(result.customerMetrics.total).toBe(0);
      expect(result.opportunityMetrics.winRate).toBe(0);
    });

    it('should calculate win rate correctly', async () => {
      opportunityRepo.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3);

      const result = await service.getDashboardSummary(ORG_ID);
      expect(result.opportunityMetrics.total).toBe(10);
      expect(result.opportunityMetrics.won).toBe(3);
      expect(result.opportunityMetrics.winRate).toBe(30);
    });

    it('should calculate health distribution', async () => {
      healthRepo.find.mockResolvedValue([
        { level: 'high', score: 85 },
        { level: 'medium', score: 60 },
        { level: 'low', score: 35 },
        { level: 'critical', score: 15 },
      ]);

      const result = await service.getDashboardSummary(ORG_ID);
      expect(result.healthMetrics.total).toBe(4);
      expect(result.healthMetrics.high).toBe(1);
      expect(result.healthMetrics.medium).toBe(1);
      expect(result.healthMetrics.low).toBe(1);
      expect(result.healthMetrics.critical).toBe(1);
    });
  });

  describe('getSalesDashboard', () => {
    it('should return sales KPI with zero values', async () => {
      const result = await service.getSalesDashboard(ORG_ID);

      expect(result.kpi).toBeDefined();
      expect(result.kpi.totalOpportunities).toBe(0);
      expect(result.kpi.wonOpportunities).toBe(0);
      expect(result.kpi.winRate).toBe(0);
      expect(result.kpi.totalLeads).toBe(0);
      expect(result.kpi.convertedLeads).toBe(0);
      expect(result.kpi.leadConvertRate).toBe(0);
      expect(result.pipeline).toBeDefined();
      expect(result.revenueTrend).toBeDefined();
    });

    it('should calculate lead convert rate', async () => {
      leadRepo.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(5);

      const result = await service.getSalesDashboard(ORG_ID);
      expect(result.kpi.totalLeads).toBe(20);
      expect(result.kpi.convertedLeads).toBe(5);
      expect(result.kpi.leadConvertRate).toBe(25);
    });

    it('should return top opportunities', async () => {
      const mockOpps = [
        { id: 'opp-1', amount: 50000, stage: 'negotiation' },
        { id: 'opp-2', amount: 30000, stage: 'proposal' },
      ];
      opportunityRepo.find.mockResolvedValue(mockOpps);

      const result = await service.getSalesDashboard(ORG_ID);
      expect(result.topOpportunities).toEqual(mockOpps);
    });
  });

  describe('getServiceDashboard', () => {
    it('should return service KPI with zero values', async () => {
      const result = await service.getServiceDashboard(ORG_ID);

      expect(result.kpi).toBeDefined();
      expect(result.kpi.totalConversations).toBe(0);
      expect(result.kpi.queuedConversations).toBe(0);
      expect(result.kpi.totalTickets).toBe(0);
      expect(result.kpi.openTickets).toBe(0);
      expect(result.kpi.resolvedTickets).toBe(0);
      expect(result.kpi.resolveRate).toBe(0);
      expect(result.ticketByPriority).toBeDefined();
      expect(result.ticketByStatus).toBeDefined();
      expect(result.healthDistribution).toBeDefined();
    });

    it('should calculate resolve rate', async () => {
      ticketRepo.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(12);

      const result = await service.getServiceDashboard(ORG_ID);
      expect(result.kpi.totalTickets).toBe(20);
      expect(result.kpi.resolvedTickets).toBe(12);
      expect(result.kpi.resolveRate).toBe(60);
    });
  });

  describe('getExecutiveDashboard', () => {
    it('should return executive summary', async () => {
      const result = await service.getExecutiveDashboard(ORG_ID);

      expect(result.customerMetrics).toBeDefined();
      expect(result.opportunityMetrics).toBeDefined();
      expect(result.dealMetrics).toBeDefined();
      expect(result.healthMetrics).toBeDefined();
      expect(result.subscriptionMetrics).toBeDefined();
      expect(result.pipeline).toBeDefined();
      expect(result.revenueTrend).toBeDefined();
      expect(result.healthDistribution).toBeDefined();
      expect(result.riskAlerts).toBeDefined();
      expect(result.riskAlerts.criticalCustomers).toBe(0);
      expect(result.riskAlerts.highRiskCustomers).toBe(0);
      expect(result.riskAlerts.lowHealthCount).toBe(0);
    });
  });

  describe('getSalesPipeline', () => {
    it('should group opportunities by stage and result', async () => {
      opportunityRepo.find.mockResolvedValue([
        { stage: 'qualification', result: null, updatedAt: new Date() },
        { stage: 'negotiation', result: null, updatedAt: new Date() },
        { stage: 'negotiation', result: 'won', updatedAt: new Date() },
        { stage: null, result: 'lost', updatedAt: new Date() },
      ]);

      const result = await service.getSalesPipeline(ORG_ID);
      expect(result.total).toBe(4);
      expect(result.byStage['qualification']).toBe(1);
      expect(result.byStage['negotiation']).toBe(2);
      expect(result.byResult['won']).toBe(1);
      expect(result.byResult['lost']).toBe(1);
    });
  });

  describe('getRevenueTrend', () => {
    it('should return revenue trend by month', async () => {
      const mockTrend = [
        { month: '2025-01', total: '10000' },
        { month: '2025-02', total: '15000' },
      ];
      paymentRepo.createQueryBuilder.mockReturnValue(createMockQb(mockTrend));

      const result = await service.getRevenueTrend(ORG_ID, 6);
      expect(result).toHaveLength(2);
      expect(result[0].month).toBe('2025-01');
      expect(result[0].revenue).toBe(10000);
      expect(result[1].revenue).toBe(15000);
    });
  });

  describe('getCustomerHealthDistribution', () => {
    it('should return health distribution with average score', async () => {
      healthRepo.find.mockResolvedValue([
        { level: 'high', score: 85 },
        { level: 'medium', score: 55 },
      ]);

      const result = await service.getCustomerHealthDistribution(ORG_ID);
      expect(result.total).toBe(2);
      expect(result.distribution.high).toBe(1);
      expect(result.distribution.medium).toBe(1);
      expect(result.averageScore).toBe(70);
    });

    it('should return zero average when no health scores', async () => {
      healthRepo.find.mockResolvedValue([]);

      const result = await service.getCustomerHealthDistribution(ORG_ID);
      expect(result.total).toBe(0);
      expect(result.averageScore).toBe(0);
    });
  });

  describe('recordMetric', () => {
    it('should create and save a metric snapshot', async () => {
      const mockSnapshot = {
        id: 'metric-1',
        orgId: ORG_ID,
        metricKey: 'daily_revenue',
        metricType: 'gauge',
        value: 5000,
        dimensions: { channel: 'web' },
        snapshotAt: expect.any(Date),
        createdBy: 'user-1',
      };
      metricRepo.create.mockReturnValue(mockSnapshot);
      metricRepo.save.mockResolvedValue(mockSnapshot);

      const result = await service.recordMetric(
        ORG_ID, 'daily_revenue', 'gauge', 5000, { channel: 'web' }, 'user-1',
      );

      expect(metricRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: ORG_ID,
          metricKey: 'daily_revenue',
          metricType: 'gauge',
          value: 5000,
          dimensions: { channel: 'web' },
          createdBy: 'user-1',
        }),
      );
      expect(metricRepo.save).toHaveBeenCalledWith(mockSnapshot);
      expect(result).toEqual(mockSnapshot);
    });
  });

  describe('getMetrics', () => {
    it('should query metrics with date range using Between', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-06-01');
      const mockMetrics = [
        { id: 'm-1', metricKey: 'daily_revenue', value: 100, snapshotAt: startDate },
      ];
      metricRepo.find.mockResolvedValue(mockMetrics);

      const result = await service.getMetrics(ORG_ID, 'daily_revenue', startDate, endDate);

      expect(metricRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: ORG_ID,
            metricKey: 'daily_revenue',
          }),
          order: { snapshotAt: 'ASC' },
        }),
      );
      expect(result).toEqual(mockMetrics);
    });
  });
});
