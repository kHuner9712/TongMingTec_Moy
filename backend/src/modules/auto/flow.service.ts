import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationFlow, FlowStatus } from './entities/automation-flow.entity';
import { AutomationRun, RunStatus } from './entities/automation-run.entity';
import { AutomationStep, StepStatus } from './entities/automation-step.entity';
import { AutoActionExecutor } from './auto-action-executor.service';
import { AutoService } from './auto.service';
import { CreateAutomationFlowDto, UpdateAutomationFlowDto } from './dto/automation-flow.dto';

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);

  constructor(
    @InjectRepository(AutomationFlow)
    private flowRepository: Repository<AutomationFlow>,
    @InjectRepository(AutomationRun)
    private runRepository: Repository<AutomationRun>,
    @InjectRepository(AutomationStep)
    private stepRepository: Repository<AutomationStep>,
    private readonly actionExecutor: AutoActionExecutor,
    private readonly autoService: AutoService,
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

    const run = this.runRepository.create({
      orgId,
      flowId: flow.id,
      status: 'running' as RunStatus,
      triggerPayload: eventPayload,
      startedAt: new Date(),
      createdBy: userId,
    });

    const savedRun = await this.runRepository.save(run);

    const steps = flow.definition || [];
    let allStepsCompleted = true;

    for (let i = 0; i < steps.length; i++) {
      const stepDef = steps[i] as Record<string, unknown>;
      const step = this.stepRepository.create({
        orgId,
        runId: savedRun.id,
        stepCode: (stepDef.code as string) || `step_${i + 1}`,
        stepType: (stepDef.type as string) || 'action',
        status: 'running' as StepStatus,
        inputPayload: (stepDef.payload as Record<string, unknown>) || {},
        createdBy: userId,
      });

      const savedStep = await this.stepRepository.save(step);

      try {
        const actionType = stepDef.actionType as string || 'log';
        const mockTrigger = {
          id: flow.id,
          orgId,
          name: flow.name,
          eventType: flow.triggerEventType || '',
          actionType,
          condition: {},
          actionPayload: (stepDef.payload as Record<string, unknown>) || {},
          status: 'active' as const,
          executionCount: 0,
          failureCount: 0,
          lastExecutedAt: null,
        } as any;

        const result = await this.actionExecutor.execute(
          mockTrigger,
          { ...eventPayload, ...((stepDef.payload as Record<string, unknown>) || {}) },
          orgId,
        );

        await this.stepRepository.update(savedStep.id, {
          status: result.success ? 'completed' : 'failed',
          outputPayload: { message: result.message },
        });

        if (!result.success) {
          allStepsCompleted = false;
          break;
        }
      } catch (err) {
        await this.stepRepository.update(savedStep.id, {
          status: 'failed',
          outputPayload: { error: (err as Error).message },
        });
        allStepsCompleted = false;
        break;
      }
    }

    await this.runRepository.update(savedRun.id, {
      status: allStepsCompleted ? 'completed' : 'failed',
      finishedAt: new Date(),
      errorCode: allStepsCompleted ? null : 'STEP_EXECUTION_FAILED',
    });

    await this.flowRepository.update(flow.id, {
      executionCount: () => 'execution_count + 1',
      failureCount: allStepsCompleted ? undefined : () => 'failure_count + 1',
    } as any);

    return this.runRepository.findOne({ where: { id: savedRun.id } }) as Promise<AutomationRun>;
  }

  async findRuns(
    orgId: string,
    flowId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: AutomationRun[]; total: number }> {
    const qb = this.runRepository
      .createQueryBuilder('r')
      .where('r.orgId = :orgId', { orgId })
      .andWhere('r.flowId = :flowId', { flowId })
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findRunSteps(
    orgId: string,
    runId: string,
  ): Promise<AutomationStep[]> {
    return this.stepRepository.find({
      where: { orgId, runId } as any,
      order: { createdAt: 'ASC' },
    });
  }
}
