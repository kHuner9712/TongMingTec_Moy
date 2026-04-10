import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AiTakeover } from '../art/entities/ai-takeover.entity';
import { AiAgentRun, AgentRunStatus } from '../art/entities/ai-agent-run.entity';
import { TakeoverCenterService } from './services/takeover-center.service';

describe('TakeoverCenterService', () => {
  let service: TakeoverCenterService;
  let takeoverRepo: any;
  let runRepo: any;

  const mockTakeover = {
    id: 'takeover-1',
    orgId: 'org-1',
    agentRunId: 'run-1',
    resourceType: 'customer',
    resourceId: 'cust-1',
    takeoverUserId: 'user-1',
    reason: '需要人工介入',
    takeoverAt: new Date(),
  };

  const mockRun = {
    id: 'run-1',
    orgId: 'org-1',
    status: AgentRunStatus.AWAITING_APPROVAL,
    outputPayload: { resourceType: 'customer', resourceId: 'cust-1' },
  };

  beforeEach(async () => {
    takeoverRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    runRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TakeoverCenterService,
        { provide: getRepositoryToken(AiTakeover), useValue: takeoverRepo },
        { provide: getRepositoryToken(AiAgentRun), useValue: runRepo },
      ],
    }).compile();

    service = module.get<TakeoverCenterService>(TakeoverCenterService);
  });

  describe('getActiveTakeovers', () => {
    it('should return empty array when no active runs', async () => {
      runRepo.find.mockResolvedValue([]);

      const result = await service.getActiveTakeovers('org-1');

      expect(result).toEqual([]);
    });

    it('should return takeovers for active runs', async () => {
      runRepo.find.mockResolvedValue([{ id: 'run-1' }]);
      takeoverRepo.find.mockResolvedValue([mockTakeover]);

      const result = await service.getActiveTakeovers('org-1');

      expect(runRepo.find).toHaveBeenCalledWith({
        where: { orgId: 'org-1', status: AgentRunStatus.TAKEN_OVER },
        select: ['id'],
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getTakeoverStats', () => {
    it('should return takeover stats', async () => {
      takeoverRepo.count.mockResolvedValue(10);
      runRepo.count.mockResolvedValue(3);

      const result = await service.getTakeoverStats('org-1');

      expect(result).toEqual({
        total: 10,
        active: 3,
        resolved: 7,
      });
    });
  });

  describe('takeover', () => {
    it('should create a takeover record and update run status', async () => {
      runRepo.findOne.mockResolvedValue(mockRun);
      takeoverRepo.create.mockReturnValue(mockTakeover);
      takeoverRepo.save.mockResolvedValue(mockTakeover);
      runRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.takeover('run-1', 'org-1', 'user-1', '需要人工介入');

      expect(takeoverRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          agentRunId: 'run-1',
          takeoverUserId: 'user-1',
          reason: '需要人工介入',
        }),
      );
      expect(runRepo.update).toHaveBeenCalledWith('run-1', {
        status: AgentRunStatus.TAKEN_OVER,
      });
    });

    it('should throw NotFoundException when run not found', async () => {
      runRepo.findOne.mockResolvedValue(null);

      await expect(
        service.takeover('nonexistent', 'org-1', 'user-1', 'reason'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolve', () => {
    it('should resolve a takeover and update run status', async () => {
      const takenOverRun = { ...mockRun, status: AgentRunStatus.TAKEN_OVER };
      takeoverRepo.findOne.mockResolvedValue(mockTakeover);
      runRepo.findOne.mockResolvedValue(takenOverRun);
      runRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.resolve('takeover-1', 'org-1', 'user-1', '问题已解决');

      expect(runRepo.update).toHaveBeenCalledWith('run-1', {
        status: AgentRunStatus.SUCCEEDED,
        errorMessage: '问题已解决',
      });
    });

    it('should throw NotFoundException when takeover not found', async () => {
      takeoverRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resolve('nonexistent', 'org-1', 'user-1', 'resolution'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not update run status if run is not taken over', async () => {
      const activeRun = { ...mockRun, status: AgentRunStatus.SUCCEEDED };
      takeoverRepo.findOne.mockResolvedValue(mockTakeover);
      runRepo.findOne.mockResolvedValue(activeRun);

      const result = await service.resolve('takeover-1', 'org-1', 'user-1', 'resolution');

      expect(runRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('getTakeoverRecords', () => {
    it('should return takeover records with optional filter', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTakeover]),
      };
      takeoverRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getTakeoverRecords('org-1', { agentRunId: 'run-1' });

      expect(mockQb.where).toHaveBeenCalledWith('to.org_id = :orgId', { orgId: 'org-1' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('to.agent_run_id = :agentRunId', { agentRunId: 'run-1' });
      expect(result).toHaveLength(1);
    });

    it('should return all records when no filter', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTakeover]),
      };
      takeoverRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getTakeoverRecords('org-1');

      expect(mockQb.andWhere).not.toHaveBeenCalled();
    });
  });
});
