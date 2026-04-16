import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { AutomationFlow, FlowStatus } from './entities/automation-flow.entity';
import { AutomationRun, RunStatus } from './entities/automation-run.entity';
import { AutomationStep, StepStatus } from './entities/automation-step.entity';
import {
  ActionExecutionResult,
  AutoActionExecutor,
} from './auto-action-executor.service';
import { AutoService } from './auto.service';
import {
  CreateAutomationFlowDto,
  UpdateAutomationFlowDto,
} from './dto/automation-flow.dto';
import {
  AutomationTemplateDefinition,
  RESULT_CHAIN_TEMPLATES,
} from './automation-template.catalog';
import { ApprovalCenterService } from '../approval-center/services/approval-center.service';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

interface FlowStepDefinition {
  code?: string;
  type?: string;
  actionType?: string;
  payload?: Record<string, unknown>;
  requiresApproval?: boolean;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
}

interface RunContext {
  triggerEventType: string | null;
  triggerConditionSnapshot: Record<string, unknown>;
  triggeredByType: string;
  triggeredById: string | null;
  businessContext: Record<string, unknown>;
}

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);

  constructor(
    @InjectRepository(AutomationFlow)
    private readonly flowRepository: Repository<AutomationFlow>,
    @InjectRepository(AutomationRun)
    private readonly runRepository: Repository<AutomationRun>,
    @InjectRepository(AutomationStep)
    private readonly stepRepository: Repository<AutomationStep>,
    private readonly actionExecutor: AutoActionExecutor,
    private readonly autoService: AutoService,
    private readonly approvalCenterService: ApprovalCenterService,
  ) {}

  async findFlows(
    orgId: string,
    filters: { status?: string; triggerType?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: AutomationFlow[]; total: number }> {
    const qb = this.flowRepository
      .createQueryBuilder('f')
      .where('f.orgId = :orgId', { orgId })
      .andWhere('f.deletedAt IS NULL');

    if (filters.status) {
      qb.andWhere('f.status = :status', { status: filters.status });
    }
    if (filters.triggerType) {
      qb.andWhere('f.triggerType = :triggerType', { triggerType: filters.triggerType });
    }

    qb.orderBy('f.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findFlowById(id: string, orgId: string): Promise<AutomationFlow> {
    const flow = await this.flowRepository.findOne({
      where: { id, orgId, deletedAt: null as unknown as undefined },
    });
    if (!flow) throw new NotFoundException('RESOURCE_NOT_FOUND');
    return flow;
  }

  async findActiveFlowsByEventType(
    orgId: string,
    eventType: string,
  ): Promise<AutomationFlow[]> {
    return this.flowRepository.find({
      where: {
        orgId,
        status: 'active' as FlowStatus,
        triggerType: 'event',
        triggerEventType: eventType,
        deletedAt: null as unknown as undefined,
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async createFlow(
    orgId: string,
    dto: CreateAutomationFlowDto,
    userId: string,
  ): Promise<AutomationFlow> {
    const flow = this.flowRepository.create({
      orgId,
      code: dto.code,
      name: dto.name,
      triggerType: dto.triggerType,
      triggerEventType: dto.triggerEventType || null,
      triggerCondition: dto.triggerCondition || {},
      status: 'draft' as FlowStatus,
      definition: dto.definition || [],
      executionCount: 0,
      failureCount: 0,
      createdBy: userId,
    });

    return this.flowRepository.save(flow);
  }

  async updateFlow(
    id: string,
    orgId: string,
    dto: UpdateAutomationFlowDto,
    userId: string,
  ): Promise<AutomationFlow> {
    const flow = await this.findFlowById(id, orgId);

    if (flow.version !== dto.version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.triggerType !== undefined) updateData.triggerType = dto.triggerType;
    if (dto.triggerEventType !== undefined) updateData.triggerEventType = dto.triggerEventType;
    if (dto.triggerCondition !== undefined) updateData.triggerCondition = dto.triggerCondition;
    if (dto.definition !== undefined) updateData.definition = dto.definition;
    if (dto.status !== undefined) {
      if (dto.status === 'active' && flow.status === 'draft') {
        updateData.status = dto.status;
      } else if (dto.status === 'paused' && flow.status === 'active') {
        updateData.status = dto.status;
      } else if (dto.status === 'active' && flow.status === 'paused') {
        updateData.status = dto.status;
      } else if (dto.status === 'archived') {
        updateData.status = dto.status;
      } else if (dto.status === 'draft' && flow.status === 'active') {
        throw new ConflictException('CANNOT_DEACTIVATE_FLOW');
      } else {
        updateData.status = dto.status;
      }
    }

    await this.flowRepository.update(id, {
      ...updateData,
      updatedBy: userId,
      version: () => 'version + 1',
    });

    return this.findFlowById(id, orgId);
  }

  async deleteFlow(id: string, orgId: string, userId: string): Promise<void> {
    const flow = await this.findFlowById(id, orgId);
    if (flow.status === 'active') {
      throw new ConflictException('CANNOT_DELETE_ACTIVE_FLOW');
    }
    await this.flowRepository.update(id, { deletedAt: new Date(), updatedBy: userId });
  }

  async executeFlow(
    id: string,
    orgId: string,
    eventPayload: Record<string, unknown>,
    userId: string,
  ): Promise<AutomationRun> {
    const flow = await this.findFlowById(id, orgId);

    if (flow.status !== 'active') {
      throw new ConflictException('FLOW_NOT_ACTIVE');
    }

    const conditionMatches = this.autoService.evaluateCondition(
      flow.triggerCondition,
      eventPayload,
    );

    if (!conditionMatches) {
      throw new ConflictException('TRIGGER_CONDITION_NOT_MET');
    }

    return this.startRun(flow, eventPayload, {
      triggerEventType: flow.triggerEventType,
      triggerConditionSnapshot: flow.triggerCondition || {},
      triggeredByType: 'user',
      triggeredById: userId,
      businessContext: this.extractBusinessContext(eventPayload),
    }, userId);
  }

  async executeFlowByEvent(
    flowId: string,
    orgId: string,
    eventType: string,
    eventPayload: Record<string, unknown>,
  ): Promise<AutomationRun | null> {
    const flow = await this.findFlowById(flowId, orgId);
    if (flow.status !== 'active') return null;

    const conditionMatches = this.autoService.evaluateCondition(
      flow.triggerCondition,
      eventPayload,
    );

    if (!conditionMatches) {
      return null;
    }

    const actorType = (eventPayload.actorType as string) || 'system';
    const actorId = (eventPayload.actorId as string) || null;

    return this.startRun(flow, eventPayload, {
      triggerEventType: eventType,
      triggerConditionSnapshot: flow.triggerCondition || {},
      triggeredByType: actorType,
      triggeredById: actorId,
      businessContext: this.extractBusinessContext(eventPayload),
    }, actorId || SYSTEM_USER_ID);
  }

  async listTemplates(orgId: string): Promise<Array<Record<string, unknown>>> {
    const codes = RESULT_CHAIN_TEMPLATES.map((item) => item.code);
    const installedFlows = await this.flowRepository.find({
      where: {
        orgId,
        code: In(codes),
        deletedAt: null as unknown as undefined,
      },
    });

    const installedMap = new Map(installedFlows.map((item) => [item.code, item]));

    return RESULT_CHAIN_TEMPLATES.map((template) => {
      const installed = installedMap.get(template.code);

      return {
        ...template,
        installed: !!installed,
        flowId: installed?.id || null,
        flowStatus: installed?.status || null,
      };
    });
  }

  async installTemplate(
    orgId: string,
    templateCode: string,
    userId: string,
  ): Promise<AutomationFlow> {
    const template = this.getTemplate(templateCode);
    const definition = template.steps.map((step) => this.toFlowStep(step));

    const existing = await this.flowRepository.findOne({
      where: {
        orgId,
        code: template.code,
        deletedAt: null as unknown as undefined,
      },
    });

    if (!existing) {
      const created = this.flowRepository.create({
        orgId,
        code: template.code,
        name: template.name,
        triggerType: 'event',
        triggerEventType: template.triggerEventType,
        triggerCondition: template.triggerCondition || {},
        status: 'active' as FlowStatus,
        definition,
        executionCount: 0,
        failureCount: 0,
        createdBy: userId,
      });

      return this.flowRepository.save(created);
    }

    await this.flowRepository.update(
      { id: existing.id, orgId, version: existing.version, deletedAt: IsNull() },
      {
        name: template.name,
        triggerType: 'event',
        triggerEventType: template.triggerEventType,
        triggerCondition: template.triggerCondition || {},
        definition,
        status: existing.status === 'archived' ? 'active' : existing.status,
        updatedBy: userId,
        version: () => 'version + 1',
      } as any,
    );

    return this.findFlowById(existing.id, orgId);
  }

  async findRuns(
    orgId: string,
    filters: { flowId?: string; status?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: AutomationRun[]; total: number }> {
    const qb = this.runRepository
      .createQueryBuilder('r')
      .where('r.orgId = :orgId', { orgId })
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (filters.flowId) {
      qb.andWhere('r.flowId = :flowId', { flowId: filters.flowId });
    }

    if (filters.status) {
      qb.andWhere('r.status = :status', { status: filters.status });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findRunById(orgId: string, runId: string): Promise<AutomationRun> {
    const run = await this.runRepository.findOne({ where: { id: runId, orgId } });
    if (!run) throw new NotFoundException('RESOURCE_NOT_FOUND');
    return run;
  }

  async findRunSteps(orgId: string, runId: string): Promise<AutomationStep[]> {
    return this.stepRepository.find({
      where: { orgId, runId } as any,
      order: { createdAt: 'ASC' },
    });
  }

  async takeoverRun(
    runId: string,
    orgId: string,
    userId: string,
    reason?: string,
  ): Promise<AutomationRun> {
    const run = await this.findRunById(orgId, runId);

    const intervention = {
      ...(run.manualIntervention || {}),
      takenOverBy: userId,
      takenOverAt: new Date().toISOString(),
      takeoverReason: reason || null,
    };

    const nextStatus: RunStatus =
      run.status === 'completed' || run.status === 'failed'
        ? run.status
        : 'cancelled';

    await this.runRepository.update(run.id, {
      status: nextStatus,
      finishedAt: run.finishedAt || new Date(),
      manualIntervention: intervention,
      errorCode: nextStatus === 'cancelled' ? 'TAKEN_OVER' : run.errorCode,
      errorMessage:
        nextStatus === 'cancelled'
          ? reason || 'Run was taken over by human'
          : run.errorMessage,
    } as any);

    return this.findRunById(orgId, runId);
  }

  async confirmRun(
    runId: string,
    orgId: string,
    userId: string,
    note?: string,
  ): Promise<AutomationRun> {
    const run = await this.findRunById(orgId, runId);

    const intervention = {
      ...(run.manualIntervention || {}),
      confirmedBy: userId,
      confirmedAt: new Date().toISOString(),
      confirmNote: note || null,
    };

    await this.runRepository.update(run.id, {
      manualIntervention: intervention,
    } as any);

    return this.findRunById(orgId, runId);
  }

  async handleApprovalStatusChanged(
    orgId: string,
    approvalRequestId: string,
    toStatus: string,
    actorId?: string,
    reason?: string,
  ): Promise<AutomationRun | null> {
    const step = await this.stepRepository.findOne({
      where: { orgId, approvalRequestId } as any,
    });

    if (!step) return null;

    const run = await this.findRunById(orgId, step.runId);
    const flow = await this.findFlowById(run.flowId, orgId);

    if (toStatus === 'approved') {
      await this.stepRepository.update(step.id, {
        status: 'completed',
        outputPayload: {
          ...(step.outputPayload || {}),
          approvalStatus: 'approved',
          approvedBy: actorId || null,
          approvedAt: new Date().toISOString(),
        },
      } as any);

      await this.runRepository.update(run.id, {
        status: 'running',
        approvalState: 'approved',
        manualIntervention: {
          ...(run.manualIntervention || {}),
          approvedBy: actorId || null,
          approvedAt: new Date().toISOString(),
        },
      } as any);

      const steps = this.normalizeSteps(flow.definition);
      const index = steps.findIndex((item, idx) => {
        const code = item.code || `step_${idx + 1}`;
        return code === step.stepCode;
      });

      const nextIndex = index >= 0 ? index + 1 : steps.length;
      return this.continueRun(
        flow,
        run.id,
        run.triggerPayload,
        nextIndex,
        actorId || SYSTEM_USER_ID,
      );
    }

    await this.stepRepository.update(step.id, {
      status: 'failed',
      errorMessage: reason || `APPROVAL_${toStatus.toUpperCase()}`,
      outputPayload: {
        ...(step.outputPayload || {}),
        approvalStatus: toStatus,
        decidedBy: actorId || null,
        decidedAt: new Date().toISOString(),
        reason: reason || null,
      },
    } as any);

    await this.markRunFailed(run.id, reason || `APPROVAL_${toStatus.toUpperCase()}`);
    return this.findRunById(orgId, run.id);
  }

  private async startRun(
    flow: AutomationFlow,
    eventPayload: Record<string, unknown>,
    context: RunContext,
    userId: string,
  ): Promise<AutomationRun> {
    const run = this.runRepository.create({
      orgId: flow.orgId,
      flowId: flow.id,
      status: 'running' as RunStatus,
      triggerPayload: eventPayload,
      triggerEventType: context.triggerEventType,
      triggerConditionSnapshot: context.triggerConditionSnapshot,
      triggeredByType: context.triggeredByType,
      triggeredById: context.triggeredById,
      businessContext: context.businessContext,
      approvalState: 'not_required',
      manualIntervention: null,
      currentStepCode: null,
      startedAt: new Date(),
      createdBy: userId,
    });

    const savedRun = await this.runRepository.save(run);

    await this.flowRepository.update(flow.id, {
      executionCount: () => 'execution_count + 1',
    } as any);

    return this.continueRun(flow, savedRun.id, eventPayload, 0, userId);
  }

  private async continueRun(
    flow: AutomationFlow,
    runId: string,
    eventPayload: Record<string, unknown>,
    startIndex: number,
    userId: string,
  ): Promise<AutomationRun> {
    const steps = this.normalizeSteps(flow.definition);

    for (let i = startIndex; i < steps.length; i += 1) {
      const stepDef = steps[i];
      const stepCode = stepDef.code || `step_${i + 1}`;
      const inputPayload = stepDef.payload || {};
      const requiresApproval =
        !!stepDef.requiresApproval ||
        stepDef.riskLevel === 'high' ||
        stepDef.riskLevel === 'critical';

      const step = this.stepRepository.create({
        orgId: flow.orgId,
        runId,
        stepCode,
        stepType: stepDef.type || 'action',
        status: requiresApproval
          ? ('awaiting_approval' as StepStatus)
          : ('running' as StepStatus),
        inputPayload,
        outputPayload: null,
        approvalRequestId: null,
        requiresApproval,
        businessContext: this.extractBusinessContext({
          ...eventPayload,
          ...(inputPayload || {}),
        }),
        errorMessage: null,
        createdBy: userId,
      });

      const savedStep = await this.stepRepository.save(step);

      if (requiresApproval) {
        const approvalRequest = await this.approvalCenterService.createBusinessApprovalRequest(
          flow.orgId,
          {
            resourceType: 'automation_step',
            resourceId: savedStep.id,
            requestedAction: stepDef.actionType || 'log',
            beforeSnapshot: {
              flowId: flow.id,
              runId,
              stepCode,
              triggerPayload: eventPayload,
            },
            proposedAfterSnapshot: {
              actionType: stepDef.actionType || 'log',
              payload: inputPayload,
            },
            explanation:
              stepDef.description ||
              `AUTO flow ${flow.code} step ${stepCode} requires approval before execution`,
            customerId: (eventPayload.customerId as string) || undefined,
          },
        );

        await this.stepRepository.update(savedStep.id, {
          status: 'awaiting_approval',
          approvalRequestId: approvalRequest.id,
          outputPayload: {
            approvalStatus: 'pending',
            approvalRequestId: approvalRequest.id,
          },
        });

        await this.runRepository.update(runId, {
          status: 'awaiting_approval',
          approvalState: 'pending',
          currentStepCode: stepCode,
        });

        return this.runRepository.findOne({ where: { id: runId } }) as Promise<AutomationRun>;
      }

      const executionResult = await this.executeSingleStep(
        flow,
        stepDef,
        eventPayload,
      );

      if (!executionResult.success) {
        await this.stepRepository.update(savedStep.id, {
          status: 'failed',
          errorMessage: executionResult.message,
          outputPayload: {
            message: executionResult.message,
            errorCode: executionResult.errorCode || null,
            details: executionResult.details || {},
            businessRefs: executionResult.businessRefs || [],
          },
        } as any);

        await this.markRunFailed(runId, executionResult.message, executionResult.errorCode);
        return this.runRepository.findOne({ where: { id: runId } }) as Promise<AutomationRun>;
      }

      await this.stepRepository.update(savedStep.id, {
        status: 'completed',
        outputPayload: {
          message: executionResult.message,
          errorCode: null,
          details: executionResult.details || {},
          businessRefs: executionResult.businessRefs || [],
        },
      } as any);

      await this.runRepository.update(runId, {
        currentStepCode: stepCode,
      });
    }

    await this.runRepository.update(runId, {
      status: 'completed',
      finishedAt: new Date(),
      errorCode: null,
      errorMessage: null,
      approvalState: 'not_required',
    } as any);

    return this.runRepository.findOne({ where: { id: runId } }) as Promise<AutomationRun>;
  }

  private async executeSingleStep(
    flow: AutomationFlow,
    stepDef: FlowStepDefinition,
    eventPayload: Record<string, unknown>,
  ): Promise<ActionExecutionResult> {
    const actionType = stepDef.actionType || 'log';
    const payload = stepDef.payload || {};

    const triggerLike = {
      id: flow.id,
      orgId: flow.orgId,
      name: flow.name,
      eventType: flow.triggerEventType || '',
      actionType,
      condition: {},
      actionPayload: payload,
      status: 'active' as const,
      executionCount: 0,
      failureCount: 0,
      lastExecutedAt: null,
    } as any;

    return this.actionExecutor.execute(
      triggerLike,
      { ...eventPayload, ...payload },
      flow.orgId,
    );
  }

  private async markRunFailed(
    runId: string,
    errorMessage: string,
    errorCode: string = 'STEP_EXECUTION_FAILED',
  ): Promise<void> {
    await this.runRepository.update(runId, {
      status: 'failed',
      finishedAt: new Date(),
      errorCode,
      errorMessage,
      approvalState: 'rejected',
    });

    const run = await this.runRepository.findOne({ where: { id: runId } });
    if (run) {
      await this.flowRepository.update(run.flowId, {
        failureCount: () => 'failure_count + 1',
      } as any);
    }
  }

  private normalizeSteps(definition: Record<string, unknown>[]): FlowStepDefinition[] {
    if (!Array.isArray(definition)) return [];
    return definition as FlowStepDefinition[];
  }

  private toFlowStep(
    step: AutomationTemplateDefinition['steps'][number],
  ): Record<string, unknown> {
    return {
      code: step.code,
      type: 'action',
      actionType: step.actionType,
      payload: step.payload || {},
      requiresApproval: !!step.requiresApproval,
      riskLevel: step.riskLevel || 'low',
      description: step.description || null,
    };
  }

  private getTemplate(templateCode: string): AutomationTemplateDefinition {
    const template = RESULT_CHAIN_TEMPLATES.find((item) => item.code === templateCode);
    if (!template) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }
    return template;
  }

  private extractBusinessContext(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const keys = [
      'customerId',
      'contractId',
      'orderId',
      'paymentId',
      'subscriptionId',
      'deliveryId',
      'riskId',
      'ticketId',
      'conversationId',
      'metricKey',
      'metricName',
    ];

    const context: Record<string, unknown> = {};
    for (const key of keys) {
      const value = payload[key];
      if (value !== undefined && value !== null) {
        context[key] = value;
      }
    }

    return context;
  }
}
