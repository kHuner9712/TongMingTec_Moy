import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AiRuntimeService } from './ai-runtime.service';
import { Customer } from '../cm/entities/customer.entity';
import { Customer360Service } from '../cor/services/customer-360.service';
import { TimelineService } from '../cor/services/timeline.service';
import { SnapshotService } from '../cor/services/snapshot.service';
import { NextActionService } from '../cmem/services/next-action.service';
import { RiskService } from '../cmem/services/risk.service';
import { ExecutionEngineService } from '../art/services/execution-engine.service';
import { ApprovalCenterService } from '../approval-center/services/approval-center.service';
import { TakeoverCenterService } from '../takeover-center/services/takeover-center.service';
import { RollbackCenterService } from '../rollback-center/services/rollback-center.service';

describe('AiRuntimeService', () => {
  let service: AiRuntimeService;
  let customerRepo: any;
  let customer360Service: any;
  let timelineService: any;
  let snapshotService: any;
  let nextActionService: any;
  let riskService: any;
  let executionEngine: any;
  let approvalCenter: any;
  let takeoverCenter: any;
  let rollbackCenter: any;

  beforeEach(async () => {
    customerRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    customer360Service = {
      getCustomer360: jest.fn(),
    };

    timelineService = {
      getTimeline: jest.fn(),
    };

    snapshotService = {
      getSnapshots: jest.fn(),
    };

    nextActionService = {
      getNextActions: jest.fn(),
    };

    riskService = {
      getRisksByOrg: jest.fn(),
    };

    executionEngine = {
      listRuns: jest.fn(),
      getRun: jest.fn(),
      execute: jest.fn(),
    };

    approvalCenter = {
      listPending: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
    };

    takeoverCenter = {
      takeover: jest.fn(),
    };

    rollbackCenter = {
      rollback: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiRuntimeService,
        { provide: getRepositoryToken(Customer), useValue: customerRepo },
        { provide: Customer360Service, useValue: customer360Service },
        { provide: TimelineService, useValue: timelineService },
        { provide: SnapshotService, useValue: snapshotService },
        { provide: NextActionService, useValue: nextActionService },
        { provide: RiskService, useValue: riskService },
        { provide: ExecutionEngineService, useValue: executionEngine },
        { provide: ApprovalCenterService, useValue: approvalCenter },
        { provide: TakeoverCenterService, useValue: takeoverCenter },
        { provide: RollbackCenterService, useValue: rollbackCenter },
      ],
    }).compile();

    service = module.get<AiRuntimeService>(AiRuntimeService);
  });

  describe('getCockpitData', () => {
    it('should return cockpit data with metrics', async () => {
      customerRepo.find.mockResolvedValue([
        { id: 'c1', orgId: 'org-1', status: 'active' },
        { id: 'c2', orgId: 'org-1', status: 'silent' },
      ]);
      executionEngine.listRuns.mockResolvedValue([]);
      approvalCenter.listPending.mockResolvedValue([]);
      riskService.getRisksByOrg.mockResolvedValue({
        items: [],
        meta: { page: 1, pageSize: 50, total: 0 },
      });

      const result = await service.getCockpitData('org-1');

      expect(result.keyMetrics.totalCustomers).toBe(2);
      expect(result.keyMetrics.activeCustomers).toBe(1);
      expect(result.keyMetrics.pendingFollowups).toBe(0);
      expect(result.aiInsights).toEqual([]);
      expect(result.riskSignals).toEqual([]);
      expect(result.recommendedTodos).toEqual([]);
    });

    it('should include risk signals when risks exist', async () => {
      customerRepo.find.mockResolvedValue([{ id: 'c1', status: 'active' }]);
      executionEngine.listRuns.mockResolvedValue([]);
      approvalCenter.listPending.mockResolvedValue([]);
      riskService.getRisksByOrg.mockResolvedValue({
        items: [
        { id: 'r1', riskLevel: 'high', riskFactors: { hint: 'churn-risk' }, customerId: 'cust-1' },
        { id: 'r2', riskLevel: 'critical', riskFactors: { hint: 'overdue-risk' }, customerId: 'cust-2' },
        ],
        meta: { page: 1, pageSize: 50, total: 2 },
      });

      const result = await service.getCockpitData('org-1');

      expect(result.aiInsights).toHaveLength(2);
      expect(result.riskSignals).toHaveLength(2);
      expect(result.aiInsights[0].type).toBe('risk_alert');
      expect(result.aiInsights[0].severity).toBe('error');
    });

    it('should include recommended todos from pending approvals', async () => {
      customerRepo.find.mockResolvedValue([]);
      executionEngine.listRuns.mockResolvedValue([]);
      approvalCenter.listPending.mockResolvedValue([
        { id: 'a1', requestedAction: 'update_customer', explanation: 'ai-suggestion' },
      ]);
      riskService.getRisksByOrg.mockResolvedValue({
        items: [],
        meta: { page: 1, pageSize: 50, total: 0 },
      });

      const result = await service.getCockpitData('org-1');

      expect(result.recommendedTodos).toHaveLength(1);
      expect(result.recommendedTodos[0].actionType).toBe('approval');
    });

    it('should handle risk service error gracefully', async () => {
      customerRepo.find.mockResolvedValue([]);
      executionEngine.listRuns.mockResolvedValue([]);
      approvalCenter.listPending.mockResolvedValue([]);
      riskService.getRisksByOrg.mockRejectedValue(new Error('DB error'));

      const result = await service.getCockpitData('org-1');

      expect(result.riskSignals).toEqual([]);
      expect(result.aiInsights).toEqual([]);
    });
  });

  describe('getCustomer360Runtime', () => {
    it('should return 360 view with agent runs', async () => {
      customer360Service.getCustomer360.mockResolvedValue({
        customer: { id: 'cust-1' },
        contacts: [],
      });
      executionEngine.listRuns.mockResolvedValue([{ id: 'run-1' }]);

      const result = await service.getCustomer360Runtime('cust-1', 'org-1');

      expect(result.customer).toBeDefined();
      expect(result.agentRuns).toHaveLength(1);
    });
  });

  describe('getCustomerTimeline', () => {
    it('should delegate to timeline service', async () => {
      timelineService.getTimeline.mockResolvedValue({
        items: [{ id: 'evt-1' }],
        total: 1,
      });

      const result = await service.getCustomerTimeline('cust-1', 'org-1', {} as any);

      expect(timelineService.getTimeline).toHaveBeenCalledWith('cust-1', 'org-1', {});
    });
  });

  describe('getNextActions', () => {
    it('should delegate to next action service', async () => {
      nextActionService.getNextActions.mockResolvedValue([]);

      const result = await service.getNextActions('cust-1', 'org-1');

      expect(nextActionService.getNextActions).toHaveBeenCalledWith('cust-1', 'org-1', undefined);
    });
  });

  describe('getAgentRuns', () => {
    it('should delegate to execution engine', async () => {
      executionEngine.listRuns.mockResolvedValue([]);

      const result = await service.getAgentRuns('org-1', { agentId: 'agent-1' });

      expect(executionEngine.listRuns).toHaveBeenCalledWith('org-1', { agentId: 'agent-1' });
    });
  });

  describe('getAgentRun', () => {
    it('should delegate to execution engine', async () => {
      executionEngine.getRun.mockResolvedValue({ id: 'run-1' });

      const result = await service.getAgentRun('run-1', 'org-1');

      expect(executionEngine.getRun).toHaveBeenCalledWith('run-1', 'org-1');
    });
  });

  describe('executeAgent', () => {
    it('should delegate to execution engine', async () => {
      executionEngine.execute.mockResolvedValue({ id: 'run-1' });

      const result = await service.executeAgent('AGENT-001', { input: 'test' }, 'org-1', 'user-1');

      expect(executionEngine.execute).toHaveBeenCalledWith('AGENT-001', { input: 'test' }, 'org-1', 'user-1', undefined);
    });

    it('should pass customerId when provided', async () => {
      executionEngine.execute.mockResolvedValue({ id: 'run-1' });

      await service.executeAgent('AGENT-001', {}, 'org-1', 'user-1', 'cust-1');

      expect(executionEngine.execute).toHaveBeenCalledWith('AGENT-001', {}, 'org-1', 'user-1', 'cust-1');
    });
  });

  describe('getPendingApprovals', () => {
    it('should delegate to approval center', async () => {
      approvalCenter.listPending.mockResolvedValue([{ id: 'a1' }]);

      const result = await service.getPendingApprovals('org-1');

      expect(approvalCenter.listPending).toHaveBeenCalledWith('org-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('approveRequest', () => {
    it('should delegate to approval center', async () => {
      approvalCenter.approve.mockResolvedValue({ id: 'a1', status: 'approved' });

      const result = await service.approveRequest('a1', 'org-1', 'user-1', 1);

      expect(approvalCenter.approve).toHaveBeenCalledWith('a1', 'org-1', 'user-1', 1);
    });
  });

  describe('rejectRequest', () => {
    it('should delegate to approval center with reason', async () => {
      approvalCenter.reject.mockResolvedValue({ id: 'a1', status: 'rejected' });

      const result = await service.rejectRequest('a1', 'org-1', 'user-1', 'not-allowed', 1);

      expect(approvalCenter.reject).toHaveBeenCalledWith('a1', 'org-1', 'user-1', 'not-allowed', 1);
    });

    it('should delegate to approval center without reason', async () => {
      approvalCenter.reject.mockResolvedValue({ id: 'a1', status: 'rejected' });

      const result = await service.rejectRequest('a1', 'org-1', 'user-1', undefined, 1);

      expect(approvalCenter.reject).toHaveBeenCalledWith('a1', 'org-1', 'user-1', undefined, 1);
    });
  });

  describe('executeTakeover', () => {
    it('should delegate to takeover center', async () => {
      takeoverCenter.takeover.mockResolvedValue({ id: 't1' });

      const result = await service.executeTakeover('run-1', 'org-1', 'user-1', 'manual-takeover');

      expect(takeoverCenter.takeover).toHaveBeenCalledWith('run-1', 'org-1', 'user-1', 'manual-takeover');
    });
  });

  describe('executeRollback', () => {
    it('should delegate to rollback center', async () => {
      rollbackCenter.rollback.mockResolvedValue({ id: 'rb1' });

      const result = await service.executeRollback('run-1', 'org-1', 'user-1');

      expect(rollbackCenter.rollback).toHaveBeenCalledWith('run-1', 'org-1', 'user-1');
    });
  });

  describe('getCustomerSnapshots', () => {
    it('should delegate to snapshot service', async () => {
      snapshotService.getSnapshots.mockResolvedValue({
        items: [{ id: 'snap-1' }],
        total: 1,
      });

      const result = await service.getCustomerSnapshots('cust-1', 'org-1', 1, 20);

      expect(snapshotService.getSnapshots).toHaveBeenCalledWith('cust-1', 'org-1', 1, 20);
    });
  });
});
