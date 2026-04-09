import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  AiAgent,
  AgentStatus,
  AgentExecutionMode,
} from "../entities/ai-agent.entity";
import { RegisterAgentDto } from "../dto/register-agent.dto";
import { aiAgentStateMachine } from "../../../common/statemachine/definitions/ai-agent.sm";
import { EventBusService } from "../../../common/events/event-bus.service";
import { agentStatusChanged } from "../../../common/events/agent-events";

@Injectable()
export class AgentRegistryService {
  constructor(
    @InjectRepository(AiAgent)
    private readonly agentRepo: Repository<AiAgent>,
    private readonly eventBus: EventBusService,
  ) {}

  async register(
    orgId: string,
    dto: RegisterAgentDto,
    userId?: string,
  ): Promise<AiAgent> {
    const existing = await this.agentRepo.findOne({
      where: { code: dto.code, orgId },
    });
    if (existing) {
      throw new ConflictException("AGENT_CODE_ALREADY_EXISTS");
    }

    const agent = this.agentRepo.create({
      orgId,
      code: dto.code,
      name: dto.name,
      agentType: dto.agentType,
      executionMode: dto.executionMode as AgentExecutionMode,
      resourceScope: dto.resourceScope,
      toolScope: dto.toolScope,
      riskLevel: dto.riskLevel,
      inputSchema: dto.inputSchema,
      outputSchema: dto.outputSchema,
      requiresApproval: dto.requiresApproval || false,
      rollbackStrategy: dto.rollbackStrategy || null,
      takeoverStrategy: dto.takeoverStrategy || null,
      status: AgentStatus.DRAFT,
      createdBy: userId || undefined,
    });
    return this.agentRepo.save(agent);
  }

  async activate(
    id: string,
    orgId: string,
    userId: string,
    version: number,
  ): Promise<AiAgent> {
    const agent = await this.getAgent(id, orgId);

    if (agent.version !== version) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const fromStatus = agent.status;
    aiAgentStateMachine.validateTransition(fromStatus, AgentStatus.ACTIVE);

    const result = await this.agentRepo
      .createQueryBuilder()
      .update(AiAgent)
      .set({
        status: AgentStatus.ACTIVE,
        version: () => "version + 1",
      })
      .where("id = :id AND version = :version", { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    this.eventBus.publish(
      agentStatusChanged({
        orgId,
        agentId: id,
        fromStatus,
        toStatus: AgentStatus.ACTIVE,
        actorType: "user",
        actorId: userId,
      }),
    );

    return this.getAgent(id, orgId);
  }

  async pause(
    id: string,
    orgId: string,
    userId: string,
    version: number,
  ): Promise<AiAgent> {
    const agent = await this.getAgent(id, orgId);

    if (agent.version !== version) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const fromStatus = agent.status;
    aiAgentStateMachine.validateTransition(fromStatus, AgentStatus.PAUSED);

    const result = await this.agentRepo
      .createQueryBuilder()
      .update(AiAgent)
      .set({
        status: AgentStatus.PAUSED,
        version: () => "version + 1",
      })
      .where("id = :id AND version = :version", { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    this.eventBus.publish(
      agentStatusChanged({
        orgId,
        agentId: id,
        fromStatus,
        toStatus: AgentStatus.PAUSED,
        actorType: "user",
        actorId: userId,
      }),
    );

    return this.getAgent(id, orgId);
  }

  async archive(
    id: string,
    orgId: string,
    userId: string,
    version: number,
  ): Promise<AiAgent> {
    const agent = await this.getAgent(id, orgId);

    if (agent.version !== version) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const fromStatus = agent.status;
    aiAgentStateMachine.validateTransition(fromStatus, AgentStatus.ARCHIVED);

    const result = await this.agentRepo
      .createQueryBuilder()
      .update(AiAgent)
      .set({
        status: AgentStatus.ARCHIVED,
        version: () => "version + 1",
      })
      .where("id = :id AND version = :version", { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    this.eventBus.publish(
      agentStatusChanged({
        orgId,
        agentId: id,
        fromStatus,
        toStatus: AgentStatus.ARCHIVED,
        actorType: "user",
        actorId: userId,
      }),
    );

    return this.getAgent(id, orgId);
  }

  async getAgent(id: string, orgId: string): Promise<AiAgent> {
    const agent = await this.agentRepo.findOne({ where: { id, orgId } });
    if (!agent) throw new NotFoundException("RESOURCE_NOT_FOUND");
    return agent;
  }

  async getAgentByCode(code: string, orgId: string): Promise<AiAgent | null> {
    return this.agentRepo.findOne({ where: { code, orgId } });
  }

  async listAgents(
    orgId: string,
    filters?: { status?: string; agentType?: string },
  ): Promise<AiAgent[]> {
    const qb = this.agentRepo
      .createQueryBuilder("agent")
      .where("agent.orgId = :orgId", { orgId });
    if (filters?.status)
      qb.andWhere("agent.status = :status", { status: filters.status });
    if (filters?.agentType)
      qb.andWhere("agent.agentType = :agentType", {
        agentType: filters.agentType,
      });
    qb.orderBy("agent.createdAt", "DESC");
    return qb.getMany();
  }
}
