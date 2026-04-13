import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CsmService } from './csm.service';
import { CustomerHealthScore } from './entities/customer-health-score.entity';
import { SuccessPlan } from './entities/success-plan.entity';
import { CustomerReturnVisit } from './entities/customer-return-visit.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CsmService', () => {
  let service: CsmService;
  let healthRepository: any;
  let planRepository: any;
  let visitRepository: any;

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
      createQueryBuilder: jest.fn().mockReturnValue(createMockQb([], 0)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsmService,
        { provide: getRepositoryToken(CustomerHealthScore), useValue: healthRepository },
        { provide: getRepositoryToken(SuccessPlan), useValue: planRepository },
        { provide: getRepositoryToken(CustomerReturnVisit), useValue: visitRepository },
      ],
    }).compile();

    service = module.get<CsmService>(CsmService);
  });

  describe('findHealthScoreByCustomer', () => {
    it('should return health score if found', async () => {
      healthRepository.findOne.mockResolvedValue(mockHealth);
      const result = await service.findHealthScoreByCustomer('customer-1', 'org-1');
      expect(result.id).toBe('health-1');
    });

    it('should throw NotFoundException if not found', async () => {
      healthRepository.findOne.mockResolvedValue(null);
      await expect(service.findHealthScoreByCustomer('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });

    it('should query with orgId for multi-tenant isolation', async () => {
      healthRepository.findOne.mockResolvedValue(mockHealth);
      await service.findHealthScoreByCustomer('customer-1', 'org-1');
      expect(healthRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'customer-1', orgId: 'org-1' }),
        }),
      );
    });
  });

  describe('evaluateHealth', () => {
    it('should create new health score when none exists', async () => {
      healthRepository.findOne.mockResolvedValue(null);
      healthRepository.create.mockReturnValue(mockHealth);
      healthRepository.save.mockResolvedValue(mockHealth);

      const result = await service.evaluateHealth('customer-1', 'org-1', 'user-1');

      expect(healthRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          customerId: 'customer-1',
        }),
      );
    });

    it('should update existing health score', async () => {
      healthRepository.findOne.mockResolvedValue(mockHealth);
      healthRepository.update.mockResolvedValue({ affected: 1 });

      await service.evaluateHealth('customer-1', 'org-1', 'user-1');

      expect(healthRepository.update).toHaveBeenCalled();
    });

    it('should calculate correct level from score', () => {
      expect((service as any).calculateLevel(85)).toBe('high');
      expect((service as any).calculateLevel(60)).toBe('medium');
      expect((service as any).calculateLevel(35)).toBe('low');
      expect((service as any).calculateLevel(20)).toBe('critical');
    });
  });

  describe('createSuccessPlan', () => {
    it('should create success plan with draft status', async () => {
      planRepository.create.mockReturnValue(mockPlan);
      planRepository.save.mockResolvedValue(mockPlan);

      const result = await service.createSuccessPlan('org-1', {
        customerId: 'customer-1',
        title: '初始成功计划',
        ownerUserId: 'user-1',
      }, 'user-1');

      expect(planRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          status: 'draft',
        }),
      );
    });
  });

  describe('updateSuccessPlan', () => {
    it('should update title and status', async () => {
      planRepository.findOne
        .mockResolvedValueOnce(mockPlan)
        .mockResolvedValueOnce({ ...mockPlan, title: 'Updated', status: 'active' });
      planRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateSuccessPlan('plan-1', 'org-1', {
        title: 'Updated',
        status: 'active',
        version: 1,
      }, 'user-1');

      expect(planRepository.update).toHaveBeenCalledWith(
        'plan-1',
        expect.objectContaining({ title: 'Updated', status: 'active' }),
      );
    });

    it('should throw on version conflict', async () => {
      planRepository.findOne.mockResolvedValue({ ...mockPlan, version: 2 });

      await expect(
        service.updateSuccessPlan('plan-1', 'org-1', { title: 'X', version: 1 }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createReturnVisit', () => {
    it('should create return visit', async () => {
      const mockVisit = { id: 'visit-1', customerId: 'customer-1', visitType: 'phone', summary: '回访记录' };
      visitRepository.create.mockReturnValue(mockVisit);
      visitRepository.save.mockResolvedValue(mockVisit);

      const result = await service.createReturnVisit('org-1', {
        customerId: 'customer-1',
        visitType: 'phone',
        summary: '回访记录',
      }, 'user-1');

      expect(visitRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ orgId: 'org-1', visitType: 'phone' }),
      );
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

    it('should reuse existing plan if already exists', async () => {
      healthRepository.findOne.mockResolvedValue(null);
      healthRepository.create.mockReturnValue(mockHealth);
      healthRepository.save.mockResolvedValue(mockHealth);
      planRepository.findOne.mockResolvedValue(mockPlan);

      const result = await service.autoEnrollCustomer('org-1', 'customer-1', 'user-1');

      expect(planRepository.create).not.toHaveBeenCalled();
      expect(result.plan.id).toBe('plan-1');
    });
  });
});
