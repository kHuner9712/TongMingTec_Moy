import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AITask, AITaskType, AITaskStatus } from "./entities/ai-task.entity";
import { ExecutionEngineService } from "../art/services/execution-engine.service";

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AITask)
    private aiTaskRepository: Repository<AITask>,
    private readonly executionEngine: ExecutionEngineService,
  ) {}

  async findTaskById(id: string, orgId: string): Promise<AITask> {
    const task = await this.aiTaskRepository.findOne({
      where: { id, orgId },
    });

    if (!task) {
      throw new NotFoundException("RESOURCE_NOT_FOUND");
    }

    return task;
  }

  async createSmartReplyTask(
    orgId: string,
    conversationId: string,
    prompt: string,
    userId: string,
  ): Promise<AITask> {
    const task = this.aiTaskRepository.create({
      orgId,
      taskType: AITaskType.SMART_REPLY,
      inputPayload: {
        conversationId,
        prompt,
      },
      status: AITaskStatus.PENDING,
      conversationId,
    });

    const saved = await this.aiTaskRepository.save(task);

    this.executeTask(saved.id, orgId, userId);

    return saved;
  }

  async executeTask(
    taskId: string,
    orgId: string,
    userId?: string,
  ): Promise<void> {
    const task = await this.findTaskById(taskId, orgId);

    await this.aiTaskRepository.update(taskId, {
      status: AITaskStatus.RUNNING,
    });

    try {
      const run = await this.executionEngine.execute(
        "AGENT-AI-003",
        {
          ...task.inputPayload,
          requestId: taskId,
        },
        orgId,
        userId || "system",
      );

      const outputPayload = run.outputPayload || {};

      await this.aiTaskRepository.update(taskId, {
        status: AITaskStatus.SUCCEEDED,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        outputPayload: outputPayload as any,
        agentRunId: run.id,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await this.aiTaskRepository.update(taskId, {
        status: AITaskStatus.FAILED,
        errorMessage,
      });
    }
  }

  async getTaskResult(id: string, orgId: string): Promise<AITask> {
    return this.findTaskById(id, orgId);
  }
}
