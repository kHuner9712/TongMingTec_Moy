import { Test, TestingModule } from "@nestjs/testing";
import { OpenaiCompatibleService } from "./openai-compatible.service";
import { ApiProjectModelsService } from "./api-project-models.service";
import { ApiQuotaService, QuotaNotConfiguredError, QuotaExceededError } from "./api-quota.service";
import { ApiUsageService } from "./api-usage.service";
import { ApiProjectKey } from "./entities/api-project-key.entity";
import { ApiModel } from "./entities/api-model.entity";
import { ApiProjectModel } from "./entities/api-project-model.entity";
import { BadRequestException, ForbiddenException, HttpException } from "@nestjs/common";

function makeKey(overrides: Partial<ApiProjectKey> = {}): ApiProjectKey {
  return {
    id: "uuid-k1", projectId: "uuid-p1", name: "测试密钥",
    keyPrefix: "moy_sk_a1b2", keyHash: "hash123",
    status: "active", lastUsedAt: null, expiresAt: null,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as ApiProjectKey;
}

function makeModel(): ApiModel {
  return {
    id: "uuid-m1", name: "Mock Chat", provider: "moy",
    modelId: "moy-mock-chat", category: "text", pricingUnit: "token",
    unitLabel: null, description: null, status: "public",
    maxInputTokens: null, maxOutputTokens: null,
    supportsStreaming: false, supportsVision: false, supportsFunctionCalling: false,
    createdAt: new Date(), updatedAt: new Date(),
  } as ApiModel;
}

function makeProjectModel(model?: ApiModel): ApiProjectModel & { model?: ApiModel } {
  return {
    id: "uuid-pm1", projectId: "uuid-p1", modelId: model?.id || "uuid-m1",
    enabled: true, createdAt: new Date(), updatedAt: new Date(),
    model,
  } as any;
}

describe("OpenaiCompatibleService", () => {
  let service: OpenaiCompatibleService;
  let projectModelsService: any;
  let quotaService: any;
  let usageService: any;

  beforeEach(async () => {
    projectModelsService = {
      findEnabledModelsForProject: jest.fn(),
      findEnabledModelByModelId: jest.fn(),
    };
    quotaService = {
      assertQuotaAvailable: jest.fn(),
      consumeQuota: jest.fn(),
      getCurrentMonthlyQuota: jest.fn(),
    };
    usageService = {
      record: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenaiCompatibleService,
        { provide: ApiProjectModelsService, useValue: projectModelsService },
        { provide: ApiQuotaService, useValue: quotaService },
        { provide: ApiUsageService, useValue: usageService },
      ],
    }).compile();
    service = module.get(OpenaiCompatibleService);
  });

  describe("listModelsForProject", () => {
    it("1. 返回项目启用模型", async () => {
      const model = makeModel();
      projectModelsService.findEnabledModelsForProject.mockResolvedValue([makeProjectModel(model)]);
      const r = await service.listModelsForProject("uuid-p1");
      expect(r.object).toBe("list");
      expect(r.data).toHaveLength(1);
      expect(r.data[0].id).toBe("moy-mock-chat");
      expect(r.data[0].owned_by).toBe("moy");
    });

    it("2. 无启用模型返回空 data", async () => {
      projectModelsService.findEnabledModelsForProject.mockResolvedValue([]);
      const r = await service.listModelsForProject("uuid-p1");
      expect(r.data).toEqual([]);
    });
  });

  describe("createMockChatCompletion", () => {
    const model = makeModel();

    it("3. 正常 mock completion", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(model));
      quotaService.assertQuotaAvailable.mockResolvedValue(undefined);
      quotaService.consumeQuota.mockResolvedValue(undefined);
      usageService.record.mockResolvedValue({});

      const r = await service.createMockChatCompletion(makeKey(), {
        model: "moy-mock-chat",
        messages: [{ role: "user", content: "Hello world" }],
      });

      expect(r.object).toBe("chat.completion");
      expect(r.choices[0].message.role).toBe("assistant");
      expect(r.choices[0].finish_reason).toBe("stop");
      expect(r.usage).toBeDefined();
      expect(r.usage.completion_tokens).toBe(32);
    });

    it("4. stream=true 返回 400", async () => {
      await expect(
        service.createMockChatCompletion(makeKey(), {
          model: "moy-mock-chat",
          messages: [{ role: "user", content: "Hi" }],
          stream: true,
        }),
      ).rejects.toThrow(BadRequestException);
      try {
        await service.createMockChatCompletion(makeKey(), {
          model: "moy-mock-chat",
          messages: [{ role: "user", content: "Hi" }],
          stream: true,
        });
      } catch (e: any) {
        expect(e.response.error.code).toBe("stream_not_supported");
      }
    });

    it("5. model 未启用返回 403", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(null);
      await expect(
        service.createMockChatCompletion(makeKey(), {
          model: "unknown-model",
          messages: [{ role: "user", content: "Hi" }],
        }),
      ).rejects.toThrow(ForbiddenException);
      try {
        await service.createMockChatCompletion(makeKey(), {
          model: "unknown-model",
          messages: [{ role: "user", content: "Hi" }],
        });
      } catch (e: any) {
        expect(e.response.error.code).toBe("model_not_enabled");
      }
    });

    it("6. quota 未配置返回 402", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(model));
      quotaService.assertQuotaAvailable.mockRejectedValue(new QuotaNotConfiguredError());
      try {
        await service.createMockChatCompletion(makeKey(), {
          model: "moy-mock-chat",
          messages: [{ role: "user", content: "Hi" }],
        });
        fail("expected HttpException");
      } catch (e: any) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.status).toBe(402);
        expect(e.response.error.code).toBe("quota_not_configured");
      }
    });

    it("7. quota 不足返回 402", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(model));
      quotaService.assertQuotaAvailable.mockRejectedValue(new QuotaExceededError());
      try {
        await service.createMockChatCompletion(makeKey(), {
          model: "moy-mock-chat",
          messages: [{ role: "user", content: "Hi" }],
        });
        fail("expected HttpException");
      } catch (e: any) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.status).toBe(402);
        expect(e.response.error.code).toBe("quota_exceeded");
      }
    });

    it("8. messages 为空返回 400", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(model));
      await expect(
        service.createMockChatCompletion(makeKey(), {
          model: "moy-mock-chat",
          messages: [],
        }),
      ).rejects.toThrow(BadRequestException);
      try {
        await service.createMockChatCompletion(makeKey(), {
          model: "moy-mock-chat",
          messages: [],
        });
      } catch (e: any) {
        expect(e.response.error.code).toBe("invalid_messages");
      }
    });

    it("9. 成功调用写 usage record", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(model));
      quotaService.assertQuotaAvailable.mockResolvedValue(undefined);
      quotaService.consumeQuota.mockResolvedValue(undefined);
      usageService.record.mockResolvedValue({});

      await service.createMockChatCompletion(makeKey(), {
        model: "moy-mock-chat",
        messages: [{ role: "user", content: "Hello world" }],
      });

      expect(usageService.record).toHaveBeenCalled();
      const call = usageService.record.mock.calls[0];
      expect(call[0]).toBe("uuid-p1");
      expect(call[1].status).toBe("success");
      expect(call[1].cost).toBe(0);
    });

    it("10. 成功调用扣减 quota", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(model));
      quotaService.assertQuotaAvailable.mockResolvedValue(undefined);
      quotaService.consumeQuota.mockResolvedValue(undefined);
      usageService.record.mockResolvedValue({});

      await service.createMockChatCompletion(makeKey(), {
        model: "moy-mock-chat",
        messages: [{ role: "user", content: "Hello world" }],
      });

      expect(quotaService.consumeQuota).toHaveBeenCalled();
      expect(quotaService.assertQuotaAvailable).toHaveBeenCalled();
    });
  });

  describe("estimateTokens", () => {
    it("估算 token：content 字符数 / 4 向上取整", () => {
      const { promptTokens, completionTokens, totalTokens } = service.estimateTokens([
        { content: "Hello world" },
      ]);
      expect(completionTokens).toBe(32);
      expect(promptTokens).toBeGreaterThanOrEqual(1);
      expect(totalTokens).toBe(promptTokens + 32);
    });
  });
});
