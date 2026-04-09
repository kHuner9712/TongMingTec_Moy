import { Injectable, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AiAgentRun, AgentRunStatus } from "../entities/ai-agent-run.entity";
import { AiAgent, AgentStatus } from "../entities/ai-agent.entity";
import { AgentRegistryService } from "./agent-registry.service";
import { ApprovalEngineService } from "./approval-engine.service";
import { EventBusService } from "../../../common/events/event-bus.service";

@Injectable()
export class ExecutionEngineService {
  constructor(
    @InjectRepository(AiAgentRun)
    private readonly runRepo: Repository<AiAgentRun>,
    private readonly agentRegistry: AgentRegistryService,
    private readonly approvalEngine: ApprovalEngineService,
    private readonly eventBus: EventBusService,
  ) {}

  async execute(
    agentCode: string,
    input: Record<string, unknown>,
    orgId: string,
    userId: string,
    customerId?: string,
  ): Promise<AiAgentRun> {
    const agent = await this.agentRegistry.getAgentByCode(agentCode, orgId);
    if (!agent) {
      throw new ConflictException("AGENT_NOT_FOUND");
    }
    if (agent.status !== AgentStatus.ACTIVE) {
      throw new ConflictException("AGENT_NOT_ACTIVE");
    }

    const run = this.runRepo.create({
      orgId,
      agentId: agent.id,
      customerId: customerId || null,
      requestId: (input.requestId as string) || null,
      status: AgentRunStatus.PENDING,
      inputPayload: input,
      executionMode: agent.executionMode,
      createdBy: userId,
    });
    const savedRun = await this.runRepo.save(run);

    await this.runRepo.update(savedRun.id, { status: AgentRunStatus.RUNNING });

    const startTime = Date.now();
    try {
      const output = await this.executeByMode(
        agent,
        input,
        savedRun.id,
        orgId,
        userId,
        customerId,
      );
      const latencyMs = Date.now() - startTime;

      await this.runRepo.update(savedRun.id, {
        status: output.status,
        outputPayload: output.outputPayload as any,
        latencyMs,
      });

      const updatedRun = await this.runRepo.findOne({
        where: { id: savedRun.id },
      });

      this.eventBus.publish({
        eventType: "ai.agent_run_completed",
        aggregateType: "ai_agent_run",
        aggregateId: savedRun.id,
        payload: {
          agentCode: agent.code,
          executionMode: agent.executionMode,
          status: output.status,
          latencyMs,
        },
        occurredAt: new Date(),
        orgId,
      });

      return updatedRun!;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await this.runRepo.update(savedRun.id, {
        status: AgentRunStatus.FAILED,
        errorMessage,
        latencyMs: Date.now() - startTime,
      });

      const failedRun = await this.runRepo.findOne({
        where: { id: savedRun.id },
      });

      this.eventBus.publish({
        eventType: "ai.agent_run_failed",
        aggregateType: "ai_agent_run",
        aggregateId: savedRun.id,
        payload: { agentCode: agent.code, errorMessage },
        occurredAt: new Date(),
        orgId,
      });

      return failedRun!;
    }
  }

  private async executeByMode(
    agent: AiAgent,
    input: Record<string, unknown>,
    runId: string,
    orgId: string,
    userId: string,
    customerId?: string,
  ): Promise<{
    status: AgentRunStatus;
    outputPayload: Record<string, unknown>;
  }> {
    switch (agent.executionMode) {
      case "suggest":
        return this.executeSuggest(agent, input);
      case "assist":
        return this.executeAssist(agent, input);
      case "auto":
        return this.executeAuto(agent, input);
      case "approval":
        return this.executeApproval(
          agent,
          input,
          runId,
          orgId,
          userId,
          customerId,
        );
      default:
        return this.executeSuggest(agent, input);
    }
  }

  private async executeSuggest(
    agent: AiAgent,
    input: Record<string, unknown>,
  ): Promise<{
    status: AgentRunStatus;
    outputPayload: Record<string, unknown>;
  }> {
    const suggestions = this.generateSuggestions(agent, input);
    return {
      status: AgentRunStatus.SUCCEEDED,
      outputPayload: { suggestions, mode: "suggest" },
    };
  }

  private async executeAssist(
    agent: AiAgent,
    input: Record<string, unknown>,
  ): Promise<{
    status: AgentRunStatus;
    outputPayload: Record<string, unknown>;
  }> {
    const draft = this.generateDraft(agent, input);
    return {
      status: AgentRunStatus.SUCCEEDED,
      outputPayload: { draft, mode: "assist", requiresConfirmation: true },
    };
  }

  private async executeAuto(
    agent: AiAgent,
    input: Record<string, unknown>,
  ): Promise<{
    status: AgentRunStatus;
    outputPayload: Record<string, unknown>;
  }> {
    if (agent.riskLevel !== "low") {
      return {
        status: AgentRunStatus.FAILED,
        outputPayload: {
          error: "AUTO_MODE_ONLY_ALLOWED_FOR_LOW_RISK",
          mode: "auto",
        },
      };
    }
    const result = this.generateAutoResult(agent, input);
    return {
      status: AgentRunStatus.SUCCEEDED,
      outputPayload: { result, mode: "auto" },
    };
  }

  private async executeApproval(
    agent: AiAgent,
    input: Record<string, unknown>,
    runId: string,
    orgId: string,
    userId: string,
    customerId?: string,
  ): Promise<{
    status: AgentRunStatus;
    outputPayload: Record<string, unknown>;
  }> {
    await this.approvalEngine.createApprovalRequest(runId, orgId, {
      resourceType: (input.resourceType as string) || "unknown",
      resourceId: (input.resourceId as string) || null,
      requestedAction: (input.requestedAction as string) || agent.agentType,
      riskLevel: agent.riskLevel,
      beforeSnapshot: (input.beforeSnapshot as Record<string, unknown>) || null,
      proposedAfterSnapshot:
        (input.proposedAfterSnapshot as Record<string, unknown>) || null,
      explanation: `Agent ${agent.code} requests approval for ${agent.agentType}`,
      customerId: customerId,
    });

    return {
      status: AgentRunStatus.AWAITING_APPROVAL,
      outputPayload: { mode: "approval", message: "Awaiting approval" },
    };
  }

  private generateSuggestions(
    agent: AiAgent,
    _input: Record<string, unknown>,
  ): Array<{ id: string; content: string; confidence: number }> {
    if (agent.code === "AGENT-AI-003") {
      return [
        {
          id: "1",
          content: "感谢您的咨询，我来为您详细解答。",
          confidence: 0.92,
        },
        {
          id: "2",
          content: "您好，请问有什么可以帮助您的？",
          confidence: 0.88,
        },
        {
          id: "3",
          content: "好的，我马上为您处理这个问题。",
          confidence: 0.85,
        },
      ];
    }
    return [
      {
        id: "1",
        content: `Agent ${agent.name} 建议执行 ${agent.agentType} 操作`,
        confidence: 0.8,
      },
    ];
  }

  private generateDraft(
    agent: AiAgent,
    input: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      agentCode: agent.code,
      draftContent: `Agent ${agent.name} 生成的草稿内容`,
      input,
    };
  }

  private generateAutoResult(
    agent: AiAgent,
    input: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      agentCode: agent.code,
      action: agent.agentType,
      result: "executed",
      input,
    };
  }

  async getRun(id: string, orgId: string): Promise<AiAgentRun> {
    const run = await this.runRepo.findOne({ where: { id, orgId } });
    if (!run) throw new ConflictException("RESOURCE_NOT_FOUND");
    return run;
  }

  async listRuns(
    orgId: string,
    filters?: { agentId?: string; status?: string; customerId?: string },
  ): Promise<AiAgentRun[]> {
    const qb = this.runRepo
      .createQueryBuilder("run")
      .where("run.orgId = :orgId", { orgId });
    if (filters?.agentId)
      qb.andWhere("run.agentId = :agentId", { agentId: filters.agentId });
    if (filters?.status)
      qb.andWhere("run.status = :status", { status: filters.status });
    if (filters?.customerId)
      qb.andWhere("run.customerId = :customerId", {
        customerId: filters.customerId,
      });
    qb.orderBy("run.createdAt", "DESC");
    return qb.getMany();
  }
}
