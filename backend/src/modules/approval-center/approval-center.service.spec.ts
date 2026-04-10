import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AiApprovalRequest, ApprovalStatus } from '../art/entities/ai-approval-request.entity';
import { AiAgentRun, AgentRunStatus } from '../art/entities/ai-agent-run.entity';
import { ApprovalCenterService } from './services/approval-center.service';
import { EventBusService } from '../../common/events/event-bus.service';

describe('ApprovalCenterService', () => {
  let service: ApprovalCenterService;
  let approvalRepo: any;
  let runRepo: any;
  let eventBus: any;

  const mockApproval = {
    id: 'approval-1',
    orgId: 'org-1',
    agentRunId: 'run-1',
    resourceType: 'customer',
    resourceId: 'cust-1',
    requestedAction: 'update',
    riskLevel: 'medium',
    status: ApprovalStatus.PENDING,
    explanation: 'AI建议更新客户信息',
    version: 1,
  };

  beforeEach(async () => {
    approvalRepo = {
      count: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    runRepo = {
      update: jest.fn(),
    };

    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalCenterService,
        { provide: getRepositoryToken(AiApprovalRequest), useValue: approvalRepo },
        { provide: getRepositoryToken(AiAgentRun), useValue: runRepo },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<ApprovalCenterService>(ApprovalCenterService);
  });

  describe('getPendingCount', () => {
    it('should return count of pending approvals', async () => {
      approvalRepo.count.mockResolvedValue(3);

      const result = await service.getPendingCount('org-1');

      expect(approvalRepo.count).toHaveBeenCalledWith({
        where: { orgId: 'org-1', status: ApprovalStatus.PENDING },
      });
      expect(result).toBe(3);
    });
  });

  describe('getApprovalStats', () => {
    it('should return approval stats by status', async () => {
      approvalRepo.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);

      const result = await service.getApprovalStats('org-1');

      expect(result).toEqual({
        pending: 5,
        approved: 10,
        rejected: 3,
        expired: 1,
      });
    });
  });

  describe('createApprovalRequest', () => {
    it('should create a pending approval request', async () => {
      approvalRepo.create.mockReturnValue(mockApproval);
      approvalRepo.save.mockResolvedValue(mockApproval);

      const result = await service.createApprovalRequest('run-1', 'org-1', {
        resourceType: 'customer',
        resourceId: 'cust-1',
        requestedAction: 'update',
        riskLevel: 'medium',
        beforeSnapshot: null,
        proposedAfterSnapshot: null,
        explanation: 'AI建议更新客户信息',
      });

      expect(approvalRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          agentRunId: 'run-1',
          status: ApprovalStatus.PENDING,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should set expiresAt to 24 hours from now', async () => {
      approvalRepo.create.mockReturnValue(mockApproval);
      approvalRepo.save.mockResolvedValue(mockApproval);

      await service.createApprovalRequest('run-1', 'org-1', {
        resourceType: 'customer',
        resourceId: 'cust-1',
        requestedAction: 'update',
        riskLevel: 'medium',
        beforeSnapshot: null,
        proposedAfterSnapshot: null,
        explanation: 'test',
      });

      const createCall = approvalRepo.create.mock.calls[0][0];
      expect(createCall.expiresAt).toBeDefined();
      expect(createCall.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('listPending', () => {
    it('should return pending approvals ordered by createdAt DESC', async () => {
      approvalRepo.find.mockResolvedValue([mockApproval]);

      const result = await service.listPending('org-1');

      expect(approvalRepo.find).toHaveBeenCalledWith({
        where: { orgId: 'org-1', status: ApprovalStatus.PENDING },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('listAll', () => {
    it('should return all approvals with optional status filter', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockApproval]),
      };
      approvalRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.listAll('org-1', { status: 'pending' });

      expect(mockQb.where).toHaveBeenCalledWith('req.orgId = :orgId', { orgId: 'org-1' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('req.status = :status', { status: 'pending' });
      expect(result).toHaveLength(1);
    });
  });

  describe('approve', () => {
    it('should throw NotFoundException when approval not found', async () => {
      approvalRepo.findOne.mockResolvedValue(null);

      await expect(
        service.approve('nonexistent', 'org-1', 'user-1', 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when version mismatch', async () => {
      approvalRepo.findOne.mockResolvedValue({ ...mockApproval, version: 2 });

      await expect(
        service.approve('approval-1', 'org-1', 'user-1', 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('reject', () => {
    it('should throw NotFoundException when approval not found', async () => {
      approvalRepo.findOne.mockResolvedValue(null);

      await expect(
        service.reject('nonexistent', 'org-1', 'user-1', 'reason', 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when version mismatch', async () => {
      approvalRepo.findOne.mockResolvedValue({ ...mockApproval, version: 2 });

      await expect(
        service.reject('approval-1', 'org-1', 'user-1', 'reason', 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('cancel', () => {
    it('should throw NotFoundException when approval not found', async () => {
      approvalRepo.findOne.mockResolvedValue(null);

      await expect(
        service.cancel('nonexistent', 'org-1', 'user-1', 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkExpired', () => {
    it('should return 0 when no expired pending requests', async () => {
      approvalRepo.find.mockResolvedValue([]);

      const result = await service.checkExpired();

      expect(result).toBe(0);
    });
  });
});
