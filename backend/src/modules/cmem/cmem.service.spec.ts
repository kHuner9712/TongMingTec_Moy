import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CustomerContext } from './entities/customer-context.entity';
import { CustomerIntent } from './entities/customer-intent.entity';
import { CustomerRisk, RiskLevel } from './entities/customer-risk.entity';
import { CustomerNextAction, NextActionStatus } from './entities/customer-next-action.entity';
import { ContextService } from './services/context.service';
import { IntentService } from './services/intent.service';
import { RiskService } from './services/risk.service';
import { NextActionService } from './services/next-action.service';

describe('ContextService', () => {
  let service: ContextService;
  let contextRepo: any;

  beforeEach(async () => {
    contextRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContextService,
        { provide: getRepositoryToken(CustomerContext), useValue: contextRepo },
      ],
    }).compile();

    service = module.get<ContextService>(ContextService);
  });

  describe('updateContext', () => {
    it('should create new context when not exists', async () => {
      contextRepo.findOne.mockResolvedValue(null);
      contextRepo.create.mockReturnValue({ id: 'ctx-1', contextData: {} });
      contextRepo.save.mockResolvedValue({ id: 'ctx-1', contextData: {} });

      const result = await service.updateContext('cust-1', 'org-1', 'communication', { lastContact: '2024-01-01' });

      expect(contextRepo.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should update existing context', async () => {
      const existing = { id: 'ctx-1', contextData: { lastContact: '2024-01-01' } };
      contextRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValue({ ...existing, contextData: { lastContact: '2024-02-01' } });
      contextRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateContext('cust-1', 'org-1', 'communication', { lastContact: '2024-02-01' });

      expect(contextRepo.update).toHaveBeenCalled();
    });
  });

  describe('getContext', () => {
    it('should return contexts for a customer', async () => {
      contextRepo.find.mockResolvedValue([{ id: 'ctx-1' }]);

      const result = await service.getContext('cust-1', 'org-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('getLatestContext', () => {
    it('should return null when no context exists', async () => {
      contextRepo.find.mockResolvedValue([]);

      const result = await service.getLatestContext('cust-1', 'org-1');

      expect(result).toBeNull();
    });
  });
});

describe('IntentService', () => {
  let service: IntentService;
  let intentRepo: any;

  beforeEach(async () => {
    intentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntentService,
        { provide: getRepositoryToken(CustomerIntent), useValue: intentRepo },
      ],
    }).compile();

    service = module.get<IntentService>(IntentService);
  });

  describe('detectIntent', () => {
    it('should detect complaint intent from keywords', async () => {
      intentRepo.create.mockReturnValue({ id: 'intent-1', intentType: 'complaint' });
      intentRepo.save.mockResolvedValue({ id: 'intent-1', intentType: 'complaint' });

      const result = await service.detectIntent('cust-1', 'org-1', {
        content: '我要投诉你们的服务',
        sourceType: 'chat',
      });

      expect(intentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ intentType: 'complaint' }),
      );
    });

    it('should default to inquiry intent when no keywords match', async () => {
      intentRepo.create.mockReturnValue({ id: 'intent-2', intentType: 'inquiry' });
      intentRepo.save.mockResolvedValue({ id: 'intent-2', intentType: 'inquiry' });

      const result = await service.detectIntent('cust-1', 'org-1', {
        content: '你好，请问一下',
        sourceType: 'chat',
      });

      expect(intentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ intentType: 'inquiry' }),
      );
    });
  });

  describe('getIntent', () => {
    it('should return null when no intent exists', async () => {
      intentRepo.find.mockResolvedValue([]);

      const result = await service.getIntent('cust-1', 'org-1');

      expect(result).toBeNull();
    });
  });
});

describe('RiskService', () => {
  let service: RiskService;
  let riskRepo: any;
  let riskQb: any;

  beforeEach(async () => {
    riskQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    riskRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(riskQb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskService,
        { provide: getRepositoryToken(CustomerRisk), useValue: riskRepo },
      ],
    }).compile();

    service = module.get<RiskService>(RiskService);
  });

  describe('assessRisk', () => {
    it('should assess HIGH risk for silent days > 30', async () => {
      riskRepo.create.mockReturnValue({ id: 'risk-1', riskLevel: RiskLevel.HIGH });
      riskRepo.save.mockResolvedValue({ id: 'risk-1', riskLevel: RiskLevel.HIGH });

      const result = await service.assessRisk('cust-1', 'org-1', { silentDays: 45 });

      expect(riskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ riskLevel: RiskLevel.HIGH }),
      );
    });

    it('should assess CRITICAL risk for overdue bills > 2', async () => {
      riskRepo.create.mockReturnValue({ id: 'risk-2', riskLevel: RiskLevel.CRITICAL });
      riskRepo.save.mockResolvedValue({ id: 'risk-2', riskLevel: RiskLevel.CRITICAL });

      const result = await service.assessRisk('cust-1', 'org-1', { overdueBills: 3 });

      expect(riskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ riskLevel: RiskLevel.CRITICAL }),
      );
    });

    it('should assess LOW risk for healthy customer', async () => {
      riskRepo.create.mockReturnValue({ id: 'risk-3', riskLevel: RiskLevel.LOW });
      riskRepo.save.mockResolvedValue({ id: 'risk-3', riskLevel: RiskLevel.LOW });

      const result = await service.assessRisk('cust-1', 'org-1', { silentDays: 3 });

      expect(riskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ riskLevel: RiskLevel.LOW }),
      );
    });
  });

  describe('getLatestRiskLevel', () => {
    it('should return null when no risk assessment exists', async () => {
      riskRepo.find.mockResolvedValue([]);

      const result = await service.getLatestRiskLevel('cust-1', 'org-1');

      expect(result).toBeNull();
    });
  });

  describe('getRisksByOrg', () => {
    it('should apply filters and return paged results', async () => {
      riskQb.getManyAndCount.mockResolvedValue([
        [{ id: 'risk-1', riskLevel: RiskLevel.HIGH }],
        1,
      ]);

      const result = await service.getRisksByOrg('org-1', {
        riskLevel: RiskLevel.HIGH,
        riskType: 'overdue',
        page: 2,
        pageSize: 10,
      });

      expect(riskRepo.createQueryBuilder).toHaveBeenCalledWith('r');
      expect(riskQb.andWhere).toHaveBeenCalledWith('r.risk_level = :riskLevel', {
        riskLevel: RiskLevel.HIGH,
      });
      expect(riskQb.andWhere).toHaveBeenCalledWith(
        `r.risk_factors ->> 'riskType' = :riskType`,
        { riskType: 'overdue' },
      );
      expect(riskQb.skip).toHaveBeenCalledWith(10);
      expect(riskQb.take).toHaveBeenCalledWith(10);
      expect(result.meta).toEqual({ page: 2, pageSize: 10, total: 1 });
      expect(result.items).toHaveLength(1);
    });

    it('should use default paging when query is empty', async () => {
      riskQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.getRisksByOrg('org-1');

      expect(riskQb.skip).toHaveBeenCalledWith(0);
      expect(riskQb.take).toHaveBeenCalledWith(50);
      expect(result.meta).toEqual({ page: 1, pageSize: 50, total: 0 });
    });
  });
});

describe('NextActionService', () => {
  let service: NextActionService;
  let actionRepo: any;

  beforeEach(async () => {
    actionRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NextActionService,
        { provide: getRepositoryToken(CustomerNextAction), useValue: actionRepo },
      ],
    }).compile();

    service = module.get<NextActionService>(NextActionService);
  });

  describe('recommend', () => {
    it('should recommend churn_recovery for churn_risk + high risk', async () => {
      actionRepo.create.mockReturnValue({ id: 'action-1', actionType: 'churn_recovery' });
      actionRepo.save.mockResolvedValue({ id: 'action-1', actionType: 'churn_recovery' });

      const result = await service.recommend('cust-1', 'org-1', 'churn_risk', 'high');

      expect(actionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: 'churn_recovery' }),
      );
    });

    it('should recommend routine_followup as fallback', async () => {
      actionRepo.create.mockReturnValue({ id: 'action-2', actionType: 'routine_followup' });
      actionRepo.save.mockResolvedValue({ id: 'action-2', actionType: 'routine_followup' });

      const result = await service.recommend('cust-1', 'org-1', 'inquiry', 'low');

      expect(actionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: 'routine_followup' }),
      );
    });
  });

  describe('acceptAction', () => {
    it('should accept a pending action', async () => {
      const mockAction = { id: 'action-1', orgId: 'org-1', status: NextActionStatus.PENDING };
      actionRepo.findOne.mockResolvedValue(mockAction);
      actionRepo.save.mockResolvedValue({ ...mockAction, status: NextActionStatus.ACCEPTED });

      const result = await service.acceptAction('action-1', 'org-1');

      expect(result.status).toBe(NextActionStatus.ACCEPTED);
    });

    it('should throw NotFoundException for non-existent action', async () => {
      actionRepo.findOne.mockResolvedValue(null);

      await expect(service.acceptAction('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('dismissAction', () => {
    it('should dismiss a pending action', async () => {
      const mockAction = { id: 'action-1', orgId: 'org-1', status: NextActionStatus.PENDING };
      actionRepo.findOne.mockResolvedValue(mockAction);
      actionRepo.save.mockResolvedValue({ ...mockAction, status: NextActionStatus.DISMISSED });

      const result = await service.dismissAction('action-1', 'org-1');

      expect(result.status).toBe(NextActionStatus.DISMISSED);
    });
  });

  describe('getPendingActions', () => {
    it('should return pending actions for a customer', async () => {
      actionRepo.find.mockResolvedValue([{ id: 'action-1', status: NextActionStatus.PENDING }]);

      const result = await service.getPendingActions('cust-1', 'org-1');

      expect(result).toHaveLength(1);
    });
  });
});
