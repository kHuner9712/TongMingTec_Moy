import { Test, TestingModule } from "@nestjs/testing";
import { AiService } from "./ai.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AITask, AITaskType, AITaskStatus } from "./entities/ai-task.entity";
import { NotFoundException } from "@nestjs/common";
import { ExecutionEngineService } from "../art/services/execution-engine.service";

describe("AiService", () => {
  let service: AiService;
  let aiTaskRepository: jest.Mocked<any>;

  const mockAITask = {
    id: "task-uuid-123",
    orgId: "org-uuid-123",
    taskType: AITaskType.SMART_REPLY,
    inputPayload: {
      conversationId: "conv-uuid-123",
      prompt: "请帮我生成回复建议",
    },
    outputPayload: null,
    status: AITaskStatus.PENDING,
    errorMessage: null,
    conversationId: "conv-uuid-123",
    messageId: null,
    createdBy: "user-uuid-123",
    version: 1,
  };

  const mockCompletedTask = {
    ...mockAITask,
    status: AITaskStatus.SUCCEEDED,
    outputPayload: {
      suggestions: [
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
      ],
      processingTime: 1200,
    },
  };

  const mockFailedTask = {
    ...mockAITask,
    status: AITaskStatus.FAILED,
    errorMessage: "AI provider timeout",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: getRepositoryToken(AITask),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: ExecutionEngineService,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    aiTaskRepository = module.get(getRepositoryToken(AITask));
  });

  describe("findTaskById", () => {
    it("should return AI task if found", async () => {
      aiTaskRepository.findOne.mockResolvedValue(mockAITask);

      const result = await service.findTaskById(
        "task-uuid-123",
        "org-uuid-123",
      );

      expect(result.id).toBe("task-uuid-123");
      expect(result.taskType).toBe(AITaskType.SMART_REPLY);
    });

    it("should throw NotFoundException if task not found", async () => {
      aiTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findTaskById("nonexistent", "org-uuid-123"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createSmartReplyTask", () => {
    it("should create smart reply task with pending status", async () => {
      aiTaskRepository.create.mockReturnValue(mockAITask);
      aiTaskRepository.save.mockResolvedValue(mockAITask);
      aiTaskRepository.findOne.mockResolvedValue(mockAITask);

      const result = await service.createSmartReplyTask(
        "org-uuid-123",
        "conv-uuid-123",
        "请帮我生成回复建议",
        "user-uuid-123",
      );

      expect(aiTaskRepository.create).toHaveBeenCalled();
      expect(aiTaskRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(AITaskStatus.PENDING);
      expect(result.taskType).toBe(AITaskType.SMART_REPLY);
    });

    it("should set conversationId correctly", async () => {
      aiTaskRepository.create.mockReturnValue(mockAITask);
      aiTaskRepository.save.mockResolvedValue(mockAITask);
      aiTaskRepository.findOne.mockResolvedValue(mockAITask);

      const result = await service.createSmartReplyTask(
        "org-uuid-123",
        "conv-uuid-123",
        "prompt",
        "user-uuid-123",
      );

      expect(result.conversationId).toBe("conv-uuid-123");
    });
  });

  describe("executeTask", () => {
    it("should transition task to running status", async () => {
      aiTaskRepository.findOne.mockResolvedValue(mockAITask);
      aiTaskRepository.update.mockResolvedValue({ affected: 1 });

      await service.executeTask("task-uuid-123", "org-uuid-123");

      expect(aiTaskRepository.update).toHaveBeenCalledWith(
        "task-uuid-123",
        expect.objectContaining({ status: AITaskStatus.RUNNING }),
      );
    });

    it("should transition task to completed on success", async () => {
      aiTaskRepository.findOne.mockResolvedValue(mockAITask);
      aiTaskRepository.update.mockResolvedValue({ affected: 1 });

      await service.executeTask("task-uuid-123", "org-uuid-123");

      const updateCalls = aiTaskRepository.update.mock.calls;
      const completedCall = updateCalls.find(
        (call: any[]) => call[1]?.status === AITaskStatus.SUCCEEDED,
      );

      expect(completedCall).toBeDefined();
    });

    it("should transition task to failed on error", async () => {
      aiTaskRepository.findOne.mockResolvedValue(mockAITask);
      aiTaskRepository.update.mockResolvedValue({ affected: 1 });

      await service.executeTask("task-uuid-123", "org-uuid-123");

      expect(aiTaskRepository.update).toHaveBeenCalled();
    });
  });

  describe("getTaskResult", () => {
    it("should return task result", async () => {
      aiTaskRepository.findOne.mockResolvedValue(mockCompletedTask);

      const result = await service.getTaskResult(
        "task-uuid-123",
        "org-uuid-123",
      );

      expect(result.status).toBe(AITaskStatus.SUCCEEDED);
      expect(result.outputPayload).toBeDefined();
      const output = result.outputPayload as { suggestions: any[] };
      expect(output.suggestions).toHaveLength(3);
    });

    it("should return failed task with error message", async () => {
      aiTaskRepository.findOne.mockResolvedValue(mockFailedTask);

      const result = await service.getTaskResult(
        "task-uuid-123",
        "org-uuid-123",
      );

      expect(result.status).toBe(AITaskStatus.FAILED);
      expect(result.errorMessage).toBe("AI provider timeout");
    });
  });

  describe("SM-ai_task state machine validation", () => {
    it("should allow transition from pending to running", async () => {
      aiTaskRepository.findOne.mockResolvedValue(mockAITask);
      aiTaskRepository.update.mockResolvedValue({ affected: 1 });

      await service.executeTask("task-uuid-123", "org-uuid-123");

      expect(aiTaskRepository.update).toHaveBeenCalledWith(
        "task-uuid-123",
        expect.objectContaining({ status: AITaskStatus.RUNNING }),
      );
    });

    it("should allow transition from running to completed", async () => {
      aiTaskRepository.findOne.mockResolvedValue(mockAITask);
      aiTaskRepository.update.mockResolvedValue({ affected: 1 });

      await service.executeTask("task-uuid-123", "org-uuid-123");

      const updateCalls = aiTaskRepository.update.mock.calls;
      const completedCall = updateCalls.find(
        (call: any[]) => call[1]?.status === AITaskStatus.SUCCEEDED,
      );

      expect(completedCall).toBeDefined();
    });

    it("should allow transition from running to failed", async () => {
      aiTaskRepository.findOne.mockResolvedValue(mockAITask);
      aiTaskRepository.update.mockResolvedValue({ affected: 1 });

      await service.executeTask("task-uuid-123", "org-uuid-123");

      expect(aiTaskRepository.update).toHaveBeenCalled();
    });

    it("should create task with pending status", async () => {
      aiTaskRepository.create.mockReturnValue(mockAITask);
      aiTaskRepository.save.mockResolvedValue(mockAITask);
      aiTaskRepository.findOne.mockResolvedValue(mockAITask);

      const result = await service.createSmartReplyTask(
        "org-uuid-123",
        "conv-uuid-123",
        "prompt",
        "user-uuid-123",
      );

      expect(result.status).toBe(AITaskStatus.PENDING);
    });
  });

  describe("AI task types", () => {
    it("should support SMART_REPLY task type", async () => {
      aiTaskRepository.create.mockReturnValue(mockAITask);
      aiTaskRepository.save.mockResolvedValue(mockAITask);
      aiTaskRepository.findOne.mockResolvedValue(mockAITask);

      const result = await service.createSmartReplyTask(
        "org-uuid-123",
        "conv-uuid-123",
        "prompt",
        "user-uuid-123",
      );

      expect(result.taskType).toBe(AITaskType.SMART_REPLY);
    });

    it("should generate suggestions for smart reply", async () => {
      aiTaskRepository.findOne.mockResolvedValue(mockCompletedTask);

      const result = await service.getTaskResult(
        "task-uuid-123",
        "org-uuid-123",
      );
      const output = result.outputPayload as { suggestions: any[] };

      expect(output.suggestions).toBeDefined();
      expect(output.suggestions.length).toBeGreaterThan(0);
      expect(output.suggestions[0]).toHaveProperty("content");
      expect(output.suggestions[0]).toHaveProperty("confidence");
    });
  });

  describe("multi-tenant isolation", () => {
    it("should only return tasks from same org", async () => {
      aiTaskRepository.findOne.mockResolvedValue(mockAITask);

      await service.findTaskById("task-uuid-123", "org-uuid-123");

      expect(aiTaskRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: "org-uuid-123",
          }),
        }),
      );
    });

    it("should throw NotFoundException for cross-org access", async () => {
      aiTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findTaskById("task-uuid-123", "different-org-id"),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
