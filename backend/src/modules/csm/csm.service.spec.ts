import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CsmService } from './csm.service';
import { CustomerHealthScore } from './entities/customer-health-score.entity';
import { SuccessPlan } from './entities/success-plan.entity';
import { CustomerReturnVisit } from './entities/customer-return-visit.entity';
import { IntentService } from '../cmem/services/intent.service';
import { RiskService } from '../cmem/services/risk.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CsmService', () => {
  let service: CsmService;
  let healthRepository: any;
  let planRepository: any;
  let visitRepository: any;
  let intentService: any;
  let riskService: any;

  const mockHealth = {
    id: 'health-1',
    orgId: 'org-1',
    customerId: 'customer-1',
    score: 50,
    level: 'medium',
    factors: {},
    evaluatedAt: new Date(),
    version: 1,
  };

  const mockPlan = {
    id: 'plan-1',
    orgId: 'org-1',
    customerId: 'customer-1',
    title: '初始成功计划',
    status: 'draft',
    ownerUserId: 'user-1',
    payload: {},
    version: 1,
  };

  const createMockQb = (items: any[] = [], total = 0) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([items, total]),
  });

  beforeEach(async () => {
    healthRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb([mockHealth], 1)),
    };

    planRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb([mockPlan], 1)),
    };

    visitRepository = {
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb([], 0)),
    };

    intentService = {
      getLatestIntent: jest.fn().mockResolvedValue(null),
    };

    riskService = {
      getLatestRiskLevel: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsmService,
        { provide: getRepositoryToken(CustomerHealthScore), useValue: healthRepository },
        { provide: getRepositoryToken(SuccessPlan), useValue: planRepository },
        { provide: getRepositoryToken(CustomerReturnVisit), useValue: visitRepository },
        { provide: IntentService, useValue: intentService },
        { provide: RiskService, useValue: riskService },
      ],
    }).compile();

    service = module.get<CsmService>(CsmService);
  });

  describe('evaluateHealth - weighted scoring', () => {
    it('should return base score 50 when no intent/risk data', async () => {
      healthRepository.findOne.mockResolvedValue(null);
      healthRepository.create.mockReturnValue(mockHealth);
      healthRepository.save.mockResolvedValue(mockHealth);

      await service.evaluateHealth('customer-1', 'org-1', 'user-1');

      expect(healthRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ score: 50 }),
      );
    });

    it('should add +15 for purchase intent', async () => {
      intentService.getLatestIntent.mockResolvedValue({ intentType: 'purchase', confidence: 0.8 });
      healthRepository.findOne.mockResolvedValue(null);
      healthRepository.create.mockReturnValue({ ...mockHealth, score: 65 });
      healthRepository.save.mockResolvedValue({ ...mockHealth, score: 65 });

      await service.evaluateHealth('customer-1', 'org-1', 'user-1');

      expect(healthRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ score: 65 }),
      );
    });

    it('should subtract -20 for churn_risk intent', async () => {
      intentService.getLatestIntent.mockResolvedValue({ intentType: 'churn_risk', confidence: 0.75 });
      healthRepository.findOne.mockResolvedValue(null);
      healthRepository.create.mockReturnValue({ ...mockHealth, score: 30 });
      healthRepository.save.mockResolvedValue({ ...mockHealth, score: 30 });

      await service.evaluateHealth('customer-1', 'org-1', 'user-1');

      expect(healthRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ score: 30 }),
      );
    });

    it('should subtract -30 for critical risk level', async () => {
      riskService.getLatestRiskLevel.mockResolvedValue('critical');
      healthRepository.findOne.mockResolvedValue(null);
      healthRepository.create.mockReturnValue({ ...mockHealth, score: 20 });
      healthRepository.save.mockResolvedValue({ ...mockHealth, score: 20 });

      await service.evaluateHealth('customer-1', 'org-1', 'user-1');

      expect(healthRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ score: 20 }),
      );
    });

    it('should add visit bonus for recent visits', async () => {
      visitRepository.count.mockResolvedValue(3);
      healthRepository.findOne.mockResolvedValue(null);
      healthRepository.create.mockReturnValue({ ...mockHealth, score: 59 });
      healthRepository.save.mockResolvedValue({ ...mockHealth, score: 59 });

      await service.evaluateHealth('customer-1', 'org-1', 'user-1');

      expect(healthRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ score: 59 }),
      );
    });

    it('should cap visit bonus at 15', async () => {
      visitRepository.count.mockResolvedValue(10);
      healthRepository.findOne.mockResolvedValue(null);
      healthRepository.create.mockReturnValue({ ...mockHealth, score: 65 });
      healthRepository.save.mockResolvedValue({ ...mockHealth, score: 65 });

      await service.evaluateHealth('customer-1', 'org-1', 'user-1');

      expect(healthRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ score: 65 }),
      );
    });

    it('should add +10 for active success plan', async () => {
      planRepository.findOne.mockResolvedValue({ ...mockPlan, status: 'active' });
      healthRepository.findOne.mockResolvedValue(null);
      healthRepository.create.mockReturnValue({ ...mockHealth, score: 60 });
      healthRepository.save.mockResolvedValue({ ...mockHealth, score: 60 });

      await service.evaluateHealth('customer-1', 'org-1', 'user-1');

      expect(healthRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ score: 60 }),
      );
    });

    it('should combine all factors: purchase intent + low risk + visits + plan', async () => {
      intentService.getLatestIntent.mockResolvedValue({ intentType: 'purchase', confidence: 0.8 });
      riskService.getLatestRiskLevel.mockResolvedValue('low');
      visitRepository.count.mockResolvedValue(2);
      planRepository.findOne.mockResolvedValue({ ...mockPlan, status: 'active' });
      healthRepository.findOne.mockResolvedValue(null);
      healthRepository.create.mockReturnValue({ ...mockHealth, score: 81 });
      healthRepository.save.mockResolvedValue({ ...mockHealth, score: 81 });

      await service.evaluateHealth('customer-1', 'org-1', 'user-1');

      expect(healthRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ score: 81, level: 'high' }),
      );
    });

    it('should clamp score to 0-100 range', async () => {
      intentService.getLatestIntent.mockResolvedValue({ intentType: 'churn_risk', confidence: 0.9 });
      riskService.getLatestRiskLevel.mockResolvedValue('critical');
      healthRepository.findOne.mockResolvedValue(null);
      healthRepository.create.mockReturnValue({ ...mockHealth, score: 0 });
      healthRepository.save.mockResolvedValue({ ...mockHealth, score: 0 });

      await service.evaluateHealth('customer-1', 'org-1', 'user-1');

      expect(healthRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ score: 0, level: 'critical' }),
      );
    });

    it('should handle intent service failure gracefully', async () => {
      intentService.getLatestIntent.mockRejectedValue(new Error('service down'));
      healthRepository.findOne.mockResolvedValue(null);
      healthRepository.create.mockReturnValue(mockHealth);
      healthRepository.save.mockResolvedValue(mockHealth);

      await service.evaluateHealth('customer-1', 'org-1', 'user-1');

      expect(healthRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ factors: expect.objectContaining({ intentError: 'intent_service_unavailable' }) }),
      );
    });

    it('should handle risk service failure gracefully', async () => {
      riskService.getLatestRiskLevel.mockRejectedValue(new Error('service down'));
      healthRepository.findOne.mockResolvedValue(null);
      healthRepository.create.mockReturnValue(mockHealth);
      healthRepository.save.mockResolvedValue(mockHealth);

      await service.evaluateHealth('customer-1', 'org-1', 'user-1');

      expect(healthRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ factors: expect.objectContaining({ riskError: 'risk_service_unavailable' }) }),
      );
    });
  });

  describe('calculateLevel', () => {
    it('should return correct levels', () => {
      expect((service as any).calculateLevel(85)).toBe('high');
      expect((service as any).calculateLevel(60)).toBe('medium');
      expect((service as any).calculateLevel(35)).toBe('low');
      expect((service as any).calculateLevel(20)).toBe('critical');
    });
  });

  describe('autoEnrollCustomer', () => {
    it('should create health score and success plan', async () => {
      healthRepository.findOne.mockResolvedValue(null);
      healthRepository.create.mockReturnValue(mockHealth);
      healthRepository.save.mockResolvedValue(mockHealth);
      planRepository.findOne.mockResolvedValue(null);
      planRepository.create.mockReturnValue(mockPlan);
      planRepository.save.mockResolvedValue(mockPlan);

      const result = await service.autoEnrollCustomer('org-1', 'customer-1', 'user-1');

      expect(result.health).toBeDefined();
      expect(result.plan).toBeDefined();
    });
  });
});
