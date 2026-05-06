import { Injectable, BadRequestException, ForbiddenException, HttpException, HttpStatus } from "@nestjs/common";
import * as crypto from "crypto";
import { ApiProjectKey } from "./entities/api-project-key.entity";
import { ApiProjectModelsService } from "./api-project-models.service";
import { ApiQuotaService, QuotaNotConfiguredError, QuotaExceededError } from "./api-quota.service";
import { ApiUsageService } from "./api-usage.service";
import { ApiProviderConfigService } from "./api-provider-config.service";
import { ChatCompletionRequestDto } from "./dto/openai-compatible.dto";
import { ApiModel } from "./entities/api-model.entity";
import {
  ProviderNotConfiguredError,
  ProviderApiKeyMissingError,
  ProviderTimeoutError,
  ProviderRateLimitedError,
  ProviderInvalidRequestError,
  ProviderUpstreamError,
} from "./providers/provider-errors";

const MOCK_PROVIDERS = new Set(["__mock__", "mock", "moy"]);
const MOCK_RESPONSE_CONTENT = "This is a mock response from MOY API Hub. Real provider forwarding is not enabled in this MVP.";

@Injectable()
export class OpenaiCompatibleService {
  constructor(
    private readonly projectModelsService: ApiProjectModelsService,
    private readonly quotaService: ApiQuotaService,
    private readonly usageService: ApiUsageService,
    private readonly providerConfigService: ApiProviderConfigService,
  ) {}

  async listModelsForProject(projectId: string) {
    const entries = await this.projectModelsService.findEnabledModelsForProject(projectId);
    const data = entries
      .filter((e) => e.model)
      .map((e) => ({
        id: e.model!.modelId,
        object: "model" as const,
        created: Math.floor(e.model!.createdAt.getTime() / 1000),
        owned_by: e.model!.provider || "moy",
      }));

    return { object: "list", data };
  }

  async createMockChatCompletion(apiKey: ApiProjectKey, dto: ChatCompletionRequestDto) {
    if (dto.stream === true) {
      throw new BadRequestException({
        error: {
          message: "stream is not supported in this MVP",
          type: "invalid_request_error",
          code: "stream_not_supported",
        },
      });
    }

    this.validateMessages(dto.messages);

    const projectId = apiKey.projectId;
    const enabledModel = await this.validateModelEnabled(projectId, dto.model);

    const { promptTokens, completionTokens, totalTokens } = this.estimateTokens(dto.messages);

    try {
      await this.quotaService.assertQuotaAvailable(projectId, enabledModel.model!.id, totalTokens);
    } catch (error) {
      if (error instanceof QuotaNotConfiguredError) {
        throw new HttpException({
          error: {
            message: "Monthly quota is not configured for this model",
            type: "invalid_request_error",
            code: "quota_not_configured",
          },
        }, HttpStatus.PAYMENT_REQUIRED);
      }
      if (error instanceof QuotaExceededError) {
        throw new HttpException({
          error: {
            message: "Monthly quota exceeded for this model",
            type: "invalid_request_error",
            code: "quota_exceeded",
          },
        }, HttpStatus.PAYMENT_REQUIRED);
      }
      throw error;
    }

    const provider = enabledModel.model!.provider || "";

    if (MOCK_PROVIDERS.has(provider)) {
      return this.respondMock(apiKey, enabledModel.model!, dto, promptTokens, completionTokens, totalTokens);
    }

    return this.respondViaProvider(apiKey, enabledModel.model!, dto, promptTokens, completionTokens, totalTokens);
  }

  private async respondMock(
    apiKey: ApiProjectKey,
    model: ApiModel,
    dto: ChatCompletionRequestDto,
    promptTokens: number,
    completionTokens: number,
    totalTokens: number,
  ) {
    await this.quotaService.consumeQuota(apiKey.projectId, model.id, totalTokens);
    const requestId = "chatcmpl_mock_" + crypto.randomBytes(16).toString("hex");
    await this.writeUsageAndQuota(apiKey, model, requestId, promptTokens, completionTokens, totalTokens, "success");

    const created = Math.floor(Date.now() / 1000);
    return {
      id: requestId,
      object: "chat.completion",
      created,
      model: dto.model,
      choices: [{ index: 0, message: { role: "assistant", content: MOCK_RESPONSE_CONTENT }, finish_reason: "stop" }],
      usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: totalTokens },
    };
  }

  private async respondViaProvider(
    apiKey: ApiProjectKey,
    model: ApiModel,
    dto: ChatCompletionRequestDto,
    promptTokens: number,
    completionTokens: number,
    totalTokens: number,
  ) {
    const requestId = "chatcmpl_" + crypto.randomBytes(16).toString("hex");

    try {
      const client = await this.providerConfigService.resolveClient(model.provider);
      const upstreamModel = model.upstreamModel || model.modelId;

      const providerResp = await client.chatCompletions({
        model: upstreamModel,
        messages: dto.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: dto.temperature,
        max_tokens: dto.max_tokens !== undefined ? dto.max_tokens : undefined,
        top_p: undefined,
      });

      const realUsage = providerResp.usage || { prompt_tokens: promptTokens, completion_tokens: 32, total_tokens: promptTokens + 32 };
      const realTotalTokens = realUsage.total_tokens;

      await this.quotaService.consumeQuota(apiKey.projectId, model.id, realTotalTokens);
      await this.writeUsageAndQuota(apiKey, model, requestId, realUsage.prompt_tokens, realUsage.completion_tokens, realTotalTokens, "success");

      const created = Math.floor(Date.now() / 1000);
      return {
        id: requestId,
        object: "chat.completion",
        created,
        model: dto.model,
        choices: providerResp.choices,
        usage: realUsage,
      };
    } catch (error: any) {
      const code = this.mapProviderErrorCode(error);
      const status = this.mapProviderErrorStatus(error);
      const message = this.mapProviderErrorMessage(error);

      await this.writeUsageAndQuota(apiKey, model, requestId, promptTokens, 0, 0, "failed");

      throw new HttpException({
        error: { message, type: "provider_error", code },
      }, status);
    }
  }

  private mapProviderErrorCode(error: any): string {
    if (error instanceof ProviderNotConfiguredError) return "provider_not_configured";
    if (error instanceof ProviderApiKeyMissingError) return "provider_api_key_missing";
    if (error instanceof ProviderTimeoutError) return "provider_timeout";
    if (error instanceof ProviderRateLimitedError) return "provider_rate_limited";
    if (error instanceof ProviderInvalidRequestError) return "provider_invalid_request";
    if (error instanceof ProviderUpstreamError) return "provider_error";
    return "provider_error";
  }

  private mapProviderErrorStatus(error: any): number {
    if (error instanceof ProviderNotConfiguredError || error instanceof ProviderApiKeyMissingError) return HttpStatus.BAD_GATEWAY;
    if (error instanceof ProviderTimeoutError) return HttpStatus.GATEWAY_TIMEOUT;
    if (error instanceof ProviderRateLimitedError) return HttpStatus.BAD_GATEWAY;
    if (error instanceof ProviderInvalidRequestError) return HttpStatus.BAD_GATEWAY;
    if (error instanceof ProviderUpstreamError) return HttpStatus.BAD_GATEWAY;
    return HttpStatus.BAD_GATEWAY;
  }

  private mapProviderErrorMessage(error: any): string {
    if (error instanceof ProviderNotConfiguredError) return "Provider is not configured";
    if (error instanceof ProviderApiKeyMissingError) return "Provider API key is not set";
    if (error instanceof ProviderTimeoutError) return "Provider request timed out";
    if (error instanceof ProviderRateLimitedError) return "Provider rate limited";
    if (error instanceof ProviderInvalidRequestError) return "Provider rejected the request";
    if (error instanceof ProviderUpstreamError) return "Provider returned an error";
    return "Provider error";
  }

  async validateModelEnabled(projectId: string, modelIdString: string) {
    const entry = await this.projectModelsService.findEnabledModelByModelId(projectId, modelIdString);
    if (!entry) {
      throw new ForbiddenException({
        error: {
          message: `Model "${modelIdString}" is not enabled for this project`,
          type: "invalid_request_error",
          code: "model_not_enabled",
        },
      });
    }
    return entry;
  }

  estimateTokens(messages: { content: string }[]) {
    const totalChars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    const promptTokens = Math.max(1, Math.ceil(totalChars / 4));
    const completionTokens = 32;
    const totalTokens = promptTokens + completionTokens;
    return { promptTokens, completionTokens, totalTokens };
  }

  async writeUsageAndQuota(
    apiKey: ApiProjectKey,
    model: ApiModel,
    requestId: string,
    inputTokens: number,
    outputTokens: number,
    totalTokens: number,
    status: "success" | "failed",
  ) {
    await this.usageService.record(apiKey.projectId, {
      keyId: apiKey.id,
      modelId: model.id,
      requestId,
      inputTokens,
      outputTokens,
      totalTokens,
      cost: 0,
      status,
    });
  }

  private validateMessages(messages: { role: string; content: string }[]) {
    if (!messages || messages.length === 0) {
      throw new BadRequestException({
        error: {
          message: "messages is required and must not be empty",
          type: "invalid_request_error",
          code: "invalid_messages",
        },
      });
    }

    for (let i = 0; i < messages.length; i++) {
      if (!messages[i].role || !messages[i].content) {
        throw new BadRequestException({
          error: {
            message: `message at index ${i} is missing role or content`,
            type: "invalid_request_error",
            code: "invalid_messages",
          },
        });
      }
    }
  }
}
