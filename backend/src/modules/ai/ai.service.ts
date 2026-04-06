import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AITask, AITaskType, AITaskStatus } from './entities/ai-task.entity';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AITask)
    private aiTaskRepository: Repository<AITask>,
  ) {}

  async findTaskById(id: string, orgId: string): Promise<AITask> {
    const task = await this.aiTaskRepository.findOne({
      where: { id, orgId },
    });

    if (!task) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
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
      createdBy: userId,
    });

    const saved = await this.aiTaskRepository.save(task);

    this.executeTask(saved.id, orgId);

    return saved;
  }

  async executeTask(taskId: string, orgId: string): Promise<void> {
    const task = await this.findTaskById(taskId, orgId);

    await this.aiTaskRepository.update(taskId, {
      status: AITaskStatus.RUNNING,
    });

    try {
      await this.simulateAIProcessing(task);

      const outputPayload = this.generateMockOutput(task);

      await this.aiTaskRepository.update(taskId, {
        status: AITaskStatus.COMPLETED,
        outputPayload,
      });
    } catch (error: any) {
      await this.aiTaskRepository.update(taskId, {
        status: AITaskStatus.FAILED,
        errorMessage: error.message || 'Unknown error',
      });
    }
  }

  private async simulateAIProcessing(task: AITask): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private generateMockOutput(task: AITask): Record<string, unknown> {
    switch (task.taskType) {
      case AITaskType.SMART_REPLY:
        return {
          suggestions: [
            {
              id: '1',
              content: '感谢您的咨询，我来为您详细解答。',
              confidence: 0.92,
            },
            {
              id: '2',
              content: '您好，请问有什么可以帮助您的？',
              confidence: 0.88,
            },
            {
              id: '3',
              content: '好的，我马上为您处理这个问题。',
              confidence: 0.85,
            },
          ],
          processingTime: 1200,
        };
      case AITaskType.SUMMARY:
        return {
          summary: '客户咨询产品功能问题，已解答。',
          keyPoints: ['产品功能', '使用方法', '注意事项'],
        };
      case AITaskType.SENTIMENT:
        return {
          sentiment: 'neutral',
          score: 0.15,
          confidence: 0.89,
        };
      default:
        return {};
    }
  }

  async getTaskResult(id: string, orgId: string): Promise<AITask> {
    return this.findTaskById(id, orgId);
  }
}
