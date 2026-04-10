import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AiRollback } from '../art/entities/ai-rollback.entity';
import { AiAgentRun, AgentRunStatus } from '../art/entities/ai-agent-run.entity';
import { RollbackCenterService } from './services/rollback-center.service';

describe('RollbackCenterService', () => {
  let service: RollbackCenterService;
  let rollbackRepo: any;
  let runRepo: any;

  const mockRollback = {
    id: 'rollback-1',
    orgId: 'org-1',
    agentRunId: 'run-1',
    resourceType: 'customer',
    resourceId: 'cust-1',
    result: 'succeeded',
    rolledBackBy: 'user-1',
    rolledBackAt: new Date(),
  };

  const mockRun = {
    id: 'run-1',
    orgId: 'org-1',
    status: AgentRunStatus.SUCCEEDED,
    executionMode: 'auto',
    outputPayload: { resourceType: 'customer', resourceId: 'cust-1' },
    inputPayload: { action: 'update_customer' },
  };

  beforeEach(async () => {
    rollbackRepo = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    runRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RollbackCenterService,
        { provide: getRepositoryToken(AiRollback), useValue: rollbackRepo },
        { provide: getRepositoryToken(AiAgentRun), useValue: runRepo },
      ],
    }).compile();

    service = module.get<RollbackCenterService>(RollbackCenterService);
  });

  describe('getRollbackStats', () => {
    it('should return rollback stats', async () => {
      rollbackRepo.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(2);

      const result = await service.getRollbackStats('org-1');

      expect(result).toEqual({
        total: 10,
        succeeded: 8,
        failed: 2,
      });
    });

    it('should return zero stats when no rollbacks', async () => {
      rollbackRepo.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getRollbackStats('org-1');

      expect(result).toEqual({ total: 0, succeeded: 0, failed: 0 });
    });
  });

  describe('rollback', () => {
    it('should create a rollback record and update run status', async () => {
      runRepo.findOne.mockResolvedValue(mockRun);
      rollbackRepo.create.mockReturnValue(mockRollback);
      rollbackRepo.save.mockResolvedValue(mockRollback);
      runRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.rollback('run-1', 'org-1', 'user-1');

      expect(rollbackRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          agentRunId: 'run-1',
          rolledBackBy: 'user-1',
          result: 'succeeded',
        }),
      );
      expect(runRepo.update).toHaveBeenCalledWith('run-1', {
        status: AgentRunStatus.ROLLED_BACK,
      });
    });

    it('should throw NotFoundException when run not found', async () => {
      runRepo.findOne.mockResolvedValue(null);

      await expect(
        service.rollback('nonexistent', 'org-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should capture beforeSnapshot from run inputPayload', async () => {
      runRepo.findOne.mockResolvedValue(mockRun);
      rollbackRepo.create.mockReturnValue(mockRollback);
      rollbackRepo.save.mockResolvedValue(mockRollback);
      runRepo.update.mockResolvedValue({ affected: 1 });

      await service.rollback('run-1', 'org-1', 'user-1');

      expect(rollbackRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          beforeSnapshot: mockRun.inputPayload,
        }),
      );
    });

    it('should capture rollbackScope from run', async () => {
      runRepo.findOne.mockResolvedValue(mockRun);
      rollbackRepo.create.mockReturnValue(mockRollback);
      rollbackRepo.save.mockResolvedValue(mockRollback);
      runRepo.update.mockResolvedValue({ affected: 1 });

      await service.rollback('run-1', 'org-1', 'user-1');

      expect(rollbackRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          rollbackScope: { agentRunId: 'run-1', executionMode: 'auto' },
        }),
      );
    });
  });

  describe('getRollbackRecords', () => {
    it('should return rollback records with optional filter', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockRollback]),
      };
      rollbackRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getRollbackRecords('org-1', { agentRunId: 'run-1' });

      expect(mockQb.where).toHaveBeenCalledWith('rb.org_id = :orgId', { orgId: 'org-1' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('rb.agent_run_id = :agentRunId', { agentRunId: 'run-1' });
      expect(result).toHaveLength(1);
    });

    it('should return all records when no filter', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockRollback]),
      };
      rollbackRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getRollbackRecords('org-1');

      expect(mockQb.andWhere).not.toHaveBeenCalled();
    });
  });
});
