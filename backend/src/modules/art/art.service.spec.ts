import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AiAgent, AgentStatus, AgentExecutionMode } from './entities/ai-agent.entity';
import { AiAgentRun, AgentRunStatus } from './entities/ai-agent-run.entity';
import { AiPromptTemplate } from './entities/ai-prompt-template.entity';
import { AiTool, ToolType } from './entities/ai-tool.entity';
import { AgentRegistryService } from './services/agent-registry.service';
import { ExecutionEngineService } from './services/execution-engine.service';
import { PromptTemplateService } from './services/prompt-template.service';
import { ToolCallingService } from './services/tool-calling.service';
import { ApprovalEngineService } from './services/approval-engine.service';
import { TakeoverEngineService } from './services/takeover-engine.service';
import { RollbackEngineService } from './services/rollback-engine.service';
import { EventBusService } from '../../common/events/event-bus.service';
import { ApprovalCenterService } from '../approval-center/services/approval-center.service';
import { TakeoverCenterService } from '../takeover-center/services/takeover-center.service';
import { RollbackCenterService } from '../rollback-center/services/rollback-center.service';

describe('AgentRegistryService', () => {
  let service: AgentRegistryService;
  let agentRepo: any;
  let eventBus: any;

  const mockAgent = {
    id: 'agent-1',
    orgId: 'org-1',
    code: 'AGENT-001',
    name: '测试Agent',
    status: AgentStatus.DRAFT,
    version: 1,
  };

  beforeEach(async () => {
    agentRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentRegistryService,
        { provide: getRepositoryToken(AiAgent), useValue: agentRepo },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<AgentRegistryService>(AgentRegistryService);
  });

  describe('register', () => {
    it('should register a new agent', async () => {
      agentRepo.findOne.mockResolvedValue(null);
      agentRepo.create.mockReturnValue(mockAgent);
      agentRepo.save.mockResolvedValue(mockAgent);

      const result = await service.register('org-1', {
        code: 'AGENT-001',
        name: '测试Agent',
        agentType: 'customer_service',
        executionMode: 'suggest',
        resourceScope: 'customer',
        toolScope: ['smart_reply'],
        riskLevel: 'low',
      } as any);

      expect(agentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ orgId: 'org-1', code: 'AGENT-001' }),
      );
    });

    it('should throw ConflictException when code already exists', async () => {
      agentRepo.findOne.mockResolvedValue(mockAgent);

      await expect(
        service.register('org-1', { code: 'AGENT-001' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getAgent', () => {
    it('should return agent when found', async () => {
      agentRepo.findOne.mockResolvedValue(mockAgent);

      const result = await service.getAgent('agent-1', 'org-1');

      expect(result).toEqual(mockAgent);
    });

    it('should throw NotFoundException when not found', async () => {
      agentRepo.findOne.mockResolvedValue(null);

      await expect(service.getAgent('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAgentByCode', () => {
    it('should return agent by code', async () => {
      agentRepo.findOne.mockResolvedValue(mockAgent);

      const result = await service.getAgentByCode('AGENT-001', 'org-1');

      expect(result).toEqual(mockAgent);
    });

    it('should return null when not found', async () => {
      agentRepo.findOne.mockResolvedValue(null);

      const result = await service.getAgentByCode('NONEXISTENT', 'org-1');

      expect(result).toBeNull();
    });
  });

  describe('listAgents', () => {
    it('should list agents with filters', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAgent]),
      };
      agentRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.listAgents('org-1', { status: 'active' });

      expect(result).toHaveLength(1);
    });
  });
});

describe('ExecutionEngineService', () => {
  let service: ExecutionEngineService;
  let runRepo: any;
  let agentRegistry: any;
  let approvalEngine: any;
  let eventBus: any;

  const mockAgent = {
    id: 'agent-1',
    code: 'AGENT-001',
    name: '测试Agent',
    status: AgentStatus.ACTIVE,
    executionMode: 'suggest' as AgentExecutionMode,
    riskLevel: 'low',
    agentType: 'customer_service',
  };

  beforeEach(async () => {
    runRepo = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    agentRegistry = {
      getAgentByCode: jest.fn(),
    };

    approvalEngine = {
      createApprovalRequest: jest.fn(),
    };

    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionEngineService,
        { provide: getRepositoryToken(AiAgentRun), useValue: runRepo },
        { provide: AgentRegistryService, useValue: agentRegistry },
        { provide: ApprovalEngineService, useValue: approvalEngine },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<ExecutionEngineService>(ExecutionEngineService);
  });

  describe('execute', () => {
    it('should throw ConflictException when agent not found', async () => {
      agentRegistry.getAgentByCode.mockResolvedValue(null);

      await expect(
        service.execute('NONEXISTENT', {}, 'org-1', 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when agent is not active', async () => {
      agentRegistry.getAgentByCode.mockResolvedValue({
        ...mockAgent,
        status: AgentStatus.PAUSED,
      });

      await expect(
        service.execute('AGENT-001', {}, 'org-1', 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should execute suggest mode and succeed', async () => {
      agentRegistry.getAgentByCode.mockResolvedValue(mockAgent);
      const mockRun = { id: 'run-1', orgId: 'org-1', status: AgentRunStatus.PENDING };
      runRepo.create.mockReturnValue(mockRun);
      runRepo.save.mockResolvedValue(mockRun);
      runRepo.update.mockResolvedValue({ affected: 1 });
      runRepo.findOne.mockResolvedValue({ ...mockRun, status: AgentRunStatus.SUCCEEDED });

      const result = await service.execute('AGENT-001', {}, 'org-1', 'user-1');

      expect(runRepo.create).toHaveBeenCalled();
    });

    it('should execute approval mode and await approval', async () => {
      const approvalAgent = { ...mockAgent, executionMode: 'approval' as AgentExecutionMode };
      agentRegistry.getAgentByCode.mockResolvedValue(approvalAgent);
      const mockRun = { id: 'run-1', orgId: 'org-1', status: AgentRunStatus.PENDING };
      runRepo.create.mockReturnValue(mockRun);
      runRepo.save.mockResolvedValue(mockRun);
      runRepo.update.mockResolvedValue({ affected: 1 });
      runRepo.findOne.mockResolvedValue({ ...mockRun, status: AgentRunStatus.AWAITING_APPROVAL });
      approvalEngine.createApprovalRequest.mockResolvedValue({});

      const result = await service.execute('AGENT-001', {}, 'org-1', 'user-1');

      expect(approvalEngine.createApprovalRequest).toHaveBeenCalled();
    });
  });

  describe('getRun', () => {
    it('should return run when found', async () => {
      runRepo.findOne.mockResolvedValue({ id: 'run-1', orgId: 'org-1' });

      const result = await service.getRun('run-1', 'org-1');

      expect(result).toBeDefined();
    });

    it('should throw ConflictException when not found', async () => {
      runRepo.findOne.mockResolvedValue(null);

      await expect(service.getRun('nonexistent', 'org-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('listRuns', () => {
    it('should list runs with filters', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'run-1' }]),
      };
      runRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.listRuns('org-1', { agentId: 'agent-1' });

      expect(result).toHaveLength(1);
    });
  });
});

describe('PromptTemplateService', () => {
  let service: PromptTemplateService;
  let templateRepo: any;

  beforeEach(async () => {
    templateRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptTemplateService,
        { provide: getRepositoryToken(AiPromptTemplate), useValue: templateRepo },
      ],
    }).compile();

    service = module.get<PromptTemplateService>(PromptTemplateService);
  });

  describe('create', () => {
    it('should create a prompt template', async () => {
      const mockTemplate = { id: 'tpl-1', templateCode: 'TPL-001' };
      templateRepo.create.mockReturnValue(mockTemplate);
      templateRepo.save.mockResolvedValue(mockTemplate);

      const result = await service.create('org-1', {
        templateCode: 'TPL-001',
        agentCode: 'AGENT-001',
        templateVersion: 1,
        systemPrompt: 'You are a helpful assistant',
        userPromptPattern: '{{input}}',
      } as any);

      expect(templateRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ orgId: 'org-1', templateCode: 'TPL-001' }),
      );
    });
  });

  describe('getTemplate', () => {
    it('should return template when found', async () => {
      templateRepo.findOne.mockResolvedValue({ id: 'tpl-1' });

      const result = await service.getTemplate('tpl-1', 'org-1');

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when not found', async () => {
      templateRepo.findOne.mockResolvedValue(null);

      await expect(service.getTemplate('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listTemplates', () => {
    it('should list templates with filters', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'tpl-1' }]),
      };
      templateRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.listTemplates('org-1', { agentCode: 'AGENT-001' });

      expect(result).toHaveLength(1);
    });
  });
});

describe('ToolCallingService', () => {
  let service: ToolCallingService;
  let toolRepo: any;

  beforeEach(async () => {
    toolRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolCallingService,
        { provide: getRepositoryToken(AiTool), useValue: toolRepo },
      ],
    }).compile();

    service = module.get<ToolCallingService>(ToolCallingService);
  });

  describe('registerTool', () => {
    it('should register a new tool', async () => {
      toolRepo.findOne.mockResolvedValue(null);
      toolRepo.create.mockReturnValue({ id: 'tool-1', code: 'TOOL-001' });
      toolRepo.save.mockResolvedValue({ id: 'tool-1', code: 'TOOL-001' });

      const result = await service.registerTool('org-1', {
        code: 'TOOL-001',
        name: '测试工具',
        toolType: 'api_call',
        config: {},
        riskLevel: 'low',
      } as any);

      expect(toolRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ orgId: 'org-1', code: 'TOOL-001' }),
      );
    });

    it('should throw ConflictException when code already exists', async () => {
      toolRepo.findOne.mockResolvedValue({ id: 'tool-1', code: 'TOOL-001' });

      await expect(
        service.registerTool('org-1', { code: 'TOOL-001' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('callTool', () => {
    it('should call an enabled tool', async () => {
      toolRepo.findOne.mockResolvedValue({ id: 'tool-1', code: 'TOOL-001', toolType: 'api_call', enabled: true });

      const result = await service.callTool('TOOL-001', { input: 'test' }, 'org-1');

      expect(result.toolCode).toBe('TOOL-001');
    });

    it('should throw NotFoundException when tool not found', async () => {
      toolRepo.findOne.mockResolvedValue(null);

      await expect(
        service.callTool('NONEXISTENT', {}, 'org-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validatePermission', () => {
    it('should return true for enabled tool', async () => {
      toolRepo.findOne.mockResolvedValue({ id: 'tool-1', enabled: true });

      const result = await service.validatePermission('TOOL-001', 'AGENT-001', 'org-1');

      expect(result).toBe(true);
    });

    it('should return false for non-existent tool', async () => {
      toolRepo.findOne.mockResolvedValue(null);

      const result = await service.validatePermission('NONEXISTENT', 'AGENT-001', 'org-1');

      expect(result).toBe(false);
    });
  });

  describe('listTools', () => {
    it('should list tools for an org', async () => {
      toolRepo.find.mockResolvedValue([{ id: 'tool-1' }]);

      const result = await service.listTools('org-1');

      expect(result).toHaveLength(1);
    });
  });
});

describe('ApprovalEngineService', () => {
  let service: ApprovalEngineService;
  let approvalCenterService: any;

  beforeEach(async () => {
    approvalCenterService = {
      createApprovalRequest: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
      checkExpired: jest.fn(),
      listPending: jest.fn(),
      listAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalEngineService,
        { provide: ApprovalCenterService, useValue: approvalCenterService },
      ],
    }).compile();

    service = module.get<ApprovalEngineService>(ApprovalEngineService);
  });

  describe('createApprovalRequest', () => {
    it('should delegate to approval center service', async () => {
      approvalCenterService.createApprovalRequest.mockResolvedValue({ id: 'approval-1' });

      const result = await service.createApprovalRequest('run-1', 'org-1', {
        resourceType: 'customer',
        resourceId: 'cust-1',
        requestedAction: 'update',
        riskLevel: 'medium',
        beforeSnapshot: null,
        proposedAfterSnapshot: null,
        explanation: 'test',
      });

      expect(approvalCenterService.createApprovalRequest).toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('should delegate approve to approval center service', async () => {
      approvalCenterService.approve.mockResolvedValue({ id: 'approval-1', status: 'approved' });

      const result = await service.approve('approval-1', 'org-1', 'user-1', 1);

      expect(approvalCenterService.approve).toHaveBeenCalledWith('approval-1', 'org-1', 'user-1', 1);
    });
  });

  describe('reject', () => {
    it('should delegate reject to approval center service', async () => {
      approvalCenterService.reject.mockResolvedValue({ id: 'approval-1', status: 'rejected' });

      const result = await service.reject('approval-1', 'org-1', 'user-1', 'reason', 1);

      expect(approvalCenterService.reject).toHaveBeenCalledWith('approval-1', 'org-1', 'user-1', 'reason', 1);
    });
  });
});

describe('TakeoverEngineService', () => {
  let service: TakeoverEngineService;
  let takeoverCenterService: any;

  beforeEach(async () => {
    takeoverCenterService = {
      takeover: jest.fn(),
      getTakeoverRecords: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TakeoverEngineService,
        { provide: TakeoverCenterService, useValue: takeoverCenterService },
      ],
    }).compile();

    service = module.get<TakeoverEngineService>(TakeoverEngineService);
  });

  describe('takeover', () => {
    it('should delegate to takeover center service', async () => {
      takeoverCenterService.takeover.mockResolvedValue({ id: 'takeover-1' });

      const result = await service.takeover('run-1', 'org-1', 'user-1', '需要人工介入');

      expect(takeoverCenterService.takeover).toHaveBeenCalledWith('run-1', 'org-1', 'user-1', '需要人工介入');
    });
  });

  describe('getTakeoverRecords', () => {
    it('should delegate to takeover center service', async () => {
      takeoverCenterService.getTakeoverRecords.mockResolvedValue([{ id: 'takeover-1' }]);

      const result = await service.getTakeoverRecords('org-1');

      expect(result).toHaveLength(1);
    });
  });
});

describe('RollbackEngineService', () => {
  let service: RollbackEngineService;
  let rollbackCenterService: any;

  beforeEach(async () => {
    rollbackCenterService = {
      rollback: jest.fn(),
      getRollbackRecords: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RollbackEngineService,
        { provide: RollbackCenterService, useValue: rollbackCenterService },
      ],
    }).compile();

    service = module.get<RollbackEngineService>(RollbackEngineService);
  });

  describe('rollback', () => {
    it('should delegate to rollback center service', async () => {
      rollbackCenterService.rollback.mockResolvedValue({ id: 'rollback-1' });

      const result = await service.rollback('run-1', 'org-1', 'user-1');

      expect(rollbackCenterService.rollback).toHaveBeenCalledWith('run-1', 'org-1', 'user-1');
    });
  });

  describe('getRollbackRecords', () => {
    it('should delegate to rollback center service', async () => {
      rollbackCenterService.getRollbackRecords.mockResolvedValue([{ id: 'rollback-1' }]);

      const result = await service.getRollbackRecords('org-1');

      expect(result).toHaveLength(1);
    });
  });
});
