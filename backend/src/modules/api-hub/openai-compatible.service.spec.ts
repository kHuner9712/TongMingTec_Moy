import { Test, TestingModule } from "@nestjs/testing";
import { OpenaiCompatibleService } from "./openai-compatible.service";
import { ApiProjectModelsService } from "./api-project-models.service";
import { ApiQuotaService, QuotaNotConfiguredError, QuotaExceededError } from "./api-quota.service";
import { ApiUsageService } from "./api-usage.service";
import { ApiProviderConfigService } from "./api-provider-config.service";
import { ApiProjectKey } from "./entities/api-project-key.entity";
import { ApiModel } from "./entities/api-model.entity";
import { ApiProjectModel } from "./entities/api-project-model.entity";
import { BadRequestException, ForbiddenException, HttpException } from "@nestjs/common";
import { ProviderTimeoutError } from "./providers/provider-errors";

function makeKey(overrides: Partial<ApiProjectKey> = {}): ApiProjectKey {
  return {
    id: "uuid-k1", projectId: "uuid-p1", name: "测试密钥",
    keyPrefix: "moy_sk_a1b2", keyHash: "hash123",
    status: "active", lastUsedAt: null, expiresAt: null,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as ApiProjectKey;
}

function makeMockModel(provider?: string): ApiModel {
  return {
    id: "uuid-m1", name: "Mock Chat", provider: provider || "__mock__",
    modelId: "moy-mock-chat", upstreamModel: null,
    category: "text", pricingUnit: "token",
    unitLabel: null, description: null, status: "public",
    maxInputTokens: null, maxOutputTokens: null,
    supportsStreaming: false, supportsVision: false, supportsFunctionCalling: false,
    createdAt: new Date(), updatedAt: new Date(),
  } as ApiModel;
}

function makeDeepseekModel(): ApiModel {
  return {
    id: "uuid-m2", name: "DeepSeek V3", provider: "deepseek",
    modelId: "moy-deepseek-v3", upstreamModel: "deepseek-chat",
    category: "text", pricingUnit: "token",
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
  let providerConfigService: any;

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
    usageService = { record: jest.fn() };
    providerConfigService = { resolveClient: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenaiCompatibleService,
        { provide: ApiProjectModelsService, useValue: projectModelsService },
        { provide: ApiQuotaService, useValue: quotaService },
        { provide: ApiUsageService, useValue: usageService },
        { provide: ApiProviderConfigService, useValue: providerConfigService },
      ],
    }).compile();
    service = module.get(OpenaiCompatibleService);
  });

  describe("listModelsForProject", () => {
    it("返回项目启用模型", async () => {
      const model = makeMockModel();
      projectModelsService.findEnabledModelsForProject.mockResolvedValue([makeProjectModel(model)]);
      const r = await service.listModelsForProject("uuid-p1");
      expect(r.object).toBe("list");
      expect(r.data).toHaveLength(1);
      expect(r.data[0].id).toBe("moy-mock-chat");
    });

    it("无启用模型返回空 data", async () => {
      projectModelsService.findEnabledModelsForProject.mockResolvedValue([]);
      const r = await service.listModelsForProject("uuid-p1");
      expect(r.data).toEqual([]);
    });
  });

  describe("createMockChatCompletion — mock path", () => {
    const model = makeMockModel();

    it("正常 mock completion", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(model));
      quotaService.assertQuotaAvailable.mockResolvedValue(undefined);
      quotaService.consumeQuota.mockResolvedValue(undefined);
      usageService.record.mockResolvedValue({});

      const r = await service.createMockChatCompletion(makeKey(), {
        model: "moy-mock-chat",
        messages: [{ role: "user", content: "Hello world" }],
      });

      expect(r.object).toBe("chat.completion");
      expect(r.choices[0].message.content).toContain("mock response");
      expect(r.usage.completion_tokens).toBe(32);
    });

    it("stream=true 返回 400", async () => {
      try {
        await service.createMockChatCompletion(makeKey(), {
          model: "moy-mock-chat",
          messages: [{ role: "user", content: "Hi" }],
          stream: true,
        });
        fail("expected error");
      } catch (e: any) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.response.error.code).toBe("stream_not_supported");
      }
    });

    it("model 未启用返回 403", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(null);
      try {
        await service.createMockChatCompletion(makeKey(), {
          model: "unknown-model",
          messages: [{ role: "user", content: "Hi" }],
        });
        fail("expected error");
      } catch (e: any) {
        expect(e).toBeInstanceOf(ForbiddenException);
        expect(e.response.error.code).toBe("model_not_enabled");
      }
    });

    it("quota 未配置返回 402", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(model));
      quotaService.assertQuotaAvailable.mockRejectedValue(new QuotaNotConfiguredError());
      try {
        await service.createMockChatCompletion(makeKey(), {
          model: "moy-mock-chat",
          messages: [{ role: "user", content: "Hi" }],
        });
        fail("expected error");
      } catch (e: any) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.status).toBe(402);
        expect(e.response.error.code).toBe("quota_not_configured");
      }
    });

    it("quota 不足返回 402", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(model));
      quotaService.assertQuotaAvailable.mockRejectedValue(new QuotaExceededError());
      try {
        await service.createMockChatCompletion(makeKey(), {
          model: "moy-mock-chat",
          messages: [{ role: "user", content: "Hi" }],
        });
        fail("expected error");
      } catch (e: any) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.status).toBe(402);
        expect(e.response.error.code).toBe("quota_exceeded");
      }
    });

    it("messages 为空返回 400", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(model));
      try {
        await service.createMockChatCompletion(makeKey(), {
          model: "moy-mock-chat",
          messages: [],
        });
        fail("expected error");
      } catch (e: any) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.response.error.code).toBe("invalid_messages");
      }
    });

    it("成功调用写 usage record", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(model));
      quotaService.assertQuotaAvailable.mockResolvedValue(undefined);
      quotaService.consumeQuota.mockResolvedValue(undefined);
      usageService.record.mockResolvedValue({});

      await service.createMockChatCompletion(makeKey(), {
        model: "moy-mock-chat",
        messages: [{ role: "user", content: "Hello world" }],
      });

      expect(usageService.record).toHaveBeenCalled();
      expect(usageService.record.mock.calls[0][1].status).toBe("success");
    });

    it("provider=mock 走 mock 路径", async () => {
      const mockAliasModel = makeMockModel("mock");
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(mockAliasModel));
      quotaService.assertQuotaAvailable.mockResolvedValue(undefined);
      quotaService.consumeQuota.mockResolvedValue(undefined);
      usageService.record.mockResolvedValue({});

      const r = await service.createMockChatCompletion(makeKey(), {
        model: "moy-mock-chat",
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(r.choices[0].message.content).toContain("mock response");
    });

    it("provider=moy 走 mock 路径", async () => {
      const moyAliasModel = makeMockModel("moy");
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(moyAliasModel));
      quotaService.assertQuotaAvailable.mockResolvedValue(undefined);
      quotaService.consumeQuota.mockResolvedValue(undefined);
      usageService.record.mockResolvedValue({});

      const r = await service.createMockChatCompletion(makeKey(), {
        model: "moy-mock-chat",
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(r.choices[0].message.content).toContain("mock response");
    });
  });

  describe("createMockChatCompletion — deepseek provider path", () => {
    const model = makeDeepseekModel();
    const mockClient = {
      providerName: "deepseek",
      chatCompletions: jest.fn(),
    };

    it("正常 deepseek completion", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(model));
      quotaService.assertQuotaAvailable.mockResolvedValue(undefined);
      quotaService.consumeQuota.mockResolvedValue(undefined);
      usageService.record.mockResolvedValue({});
      providerConfigService.resolveClient.mockResolvedValue(mockClient);

      mockClient.chatCompletions.mockResolvedValue({
        id: "ds-resp-1",
        object: "chat.completion",
        created: 1714500000,
        model: "deepseek-chat",
        choices: [{ index: 0, message: { role: "assistant", content: "你好！" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const r = await service.createMockChatCompletion(makeKey(), {
        model: "moy-deepseek-v3",
        messages: [{ role: "user", content: "你好" }],
      });

      expect(r.object).toBe("chat.completion");
      expect(r.model).toBe("moy-deepseek-v3");
      expect(r.choices[0].message.content).toBe("你好！");
      expect(r.usage.total_tokens).toBe(15);
      expect(quotaService.consumeQuota).toHaveBeenCalledWith("uuid-p1", "uuid-m2", 15);
      expect(usageService.record).toHaveBeenCalled();
      expect(usageService.record.mock.calls[usageService.record.mock.calls.length - 1][1].status).toBe("success");
    });

    it("provider timeout → failed usage record", async () => {
      projectModelsService.findEnabledModelByModelId.mockResolvedValue(makeProjectModel(model));
      quotaService.assertQuotaAvailable.mockResolvedValue(undefined);
      quotaService.consumeQuota.mockResolvedValue(undefined);
      usageService.record.mockResolvedValue({});
      providerConfigService.resolveClient.mockResolvedValue(mockClient);
      mockClient.chatCompletions.mockRejectedValue(new ProviderTimeoutError("deepseek"));

      try {
        await service.createMockChatCompletion(makeKey(), {
          model: "moy-deepseek-v3",
          messages: [{ role: "user", content: "Hi" }],
        });
        fail("expected error");
      } catch (e: any) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.status).toBe(504);
        expect(e.response.error.code).toBe("provider_timeout");
      }

      const failCall = usageService.record.mock.calls[usageService.record.mock.calls.length - 1];
      expect(failCall[1].status).toBe("failed");
      expect(quotaService.consumeQuota).toHaveBeenCalledTimes(0);
    });
  });

  describe("estimateTokens", () => {
    it("估算 token", () => {
      const { promptTokens, completionTokens, totalTokens } = service.estimateTokens([
        { content: "Hello world" },
      ]);
      expect(completionTokens).toBe(32);
      expect(promptTokens).toBeGreaterThanOrEqual(1);
      expect(totalTokens).toBe(promptTokens + 32);
    });
  });
});
