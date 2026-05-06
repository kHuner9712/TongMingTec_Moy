import { Injectable, BadRequestException, ForbiddenException } from "@nestjs/common";
import * as crypto from "crypto";
import { ApiProjectKey } from "./entities/api-project-key.entity";
import { ApiProjectModelsService } from "./api-project-models.service";
import { ApiQuotaService, QuotaNotConfiguredError, QuotaExceededError } from "./api-quota.service";
import { ApiUsageService } from "./api-usage.service";
import { ChatCompletionRequestDto } from "./dto/openai-compatible.dto";
import { ApiModel } from "./entities/api-model.entity";

const MOCK_RESPONSE_CONTENT = "This is a mock response from MOY API Hub. Real provider forwarding is not enabled in this MVP.";

@Injectable()
export class OpenaiCompatibleService {
  constructor(
    private readonly projectModelsService: ApiProjectModelsService,
    private readonly quotaService: ApiQuotaService,
    private readonly usageService: ApiUsageService,
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
        throw new ForbiddenException({
          error: {
            message: "Monthly quota is not configured for this model",
            type: "invalid_request_error",
            code: "quota_not_configured",
          },
        });
      }
      if (error instanceof QuotaExceededError) {
        throw new ForbiddenException({
          error: {
            message: "Monthly quota exceeded for this model",
            type: "invalid_request_error",
            code: "quota_exceeded",
          },
        });
      }
      throw error;
    }

    await this.quotaService.consumeQuota(projectId, enabledModel.model!.id, totalTokens);

    const requestId = "chatcmpl_mock_" + crypto.randomBytes(16).toString("hex");

    await this.writeUsageAndQuota(apiKey, enabledModel.model!, promptTokens, completionTokens, totalTokens, requestId);

    const created = Math.floor(Date.now() / 1000);

    return {
      id: requestId,
      object: "chat.completion",
      created,
      model: dto.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: MOCK_RESPONSE_CONTENT,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
      },
    };
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
    inputTokens: number,
    outputTokens: number,
    totalTokens: number,
    requestId: string,
  ) {
    await this.usageService.record(apiKey.projectId, {
      keyId: apiKey.id,
      modelId: model.id,
      requestId,
      inputTokens,
      outputTokens,
      totalTokens,
      cost: 0,
      status: "success",
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
