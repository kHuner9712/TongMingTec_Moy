import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiProviderConfig } from "./entities/api-provider-config.entity";
import { CreateProviderConfigDto, UpdateProviderConfigDto } from "./dto/api-provider-config.dto";
import {
  ProviderNotConfiguredError,
  ProviderApiKeyMissingError,
} from "./providers/provider-errors";
import { OpenAICompatibleProviderClient } from "./providers/openai-compatible-client";
import { DeepSeekProviderClient } from "./providers/deepseek-client";

class GenericProviderClient extends OpenAICompatibleProviderClient {
  private readonly name: string;
  constructor(name: string, baseUrl: string, apiKey: string, timeoutMs: number) {
    super(baseUrl, apiKey, timeoutMs);
    this.name = name;
  }
  get providerName(): string { return this.name; }
}

@Injectable()
export class ApiProviderConfigService {
  constructor(
    @InjectRepository(ApiProviderConfig)
    private readonly repo: Repository<ApiProviderConfig>,
  ) {}

  async create(dto: CreateProviderConfigDto): Promise<ApiProviderConfig> {
    const config = this.repo.create({
      provider: dto.provider,
      displayName: dto.displayName,
      baseUrl: dto.baseUrl,
      apiKeyEnvName: dto.apiKeyEnvName,
      timeoutMs: dto.timeoutMs ?? 60000,
      status: "active",
    });
    return this.repo.save(config);
  }

  async findAll(): Promise<ApiProviderConfig[]> {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  async findByProvider(provider: string): Promise<ApiProviderConfig | null> {
    return this.repo.findOne({ where: { provider } });
  }

  async update(provider: string, dto: UpdateProviderConfigDto): Promise<ApiProviderConfig> {
    const config = await this.repo.findOne({ where: { provider } });
    if (!config) throw new ProviderNotConfiguredError(provider);
    if (dto.displayName !== undefined) config.displayName = dto.displayName;
    if (dto.baseUrl !== undefined) config.baseUrl = dto.baseUrl;
    if (dto.apiKeyEnvName !== undefined) config.apiKeyEnvName = dto.apiKeyEnvName;
    if (dto.status !== undefined) config.status = dto.status as any;
    if (dto.timeoutMs !== undefined) config.timeoutMs = dto.timeoutMs;
    return this.repo.save(config);
  }

  async remove(provider: string): Promise<void> {
    await this.repo.delete({ provider });
  }

  async resolveClient(provider: string): Promise<OpenAICompatibleProviderClient> {
    const config = await this.findByProvider(provider);
    if (!config || config.status !== "active") throw new ProviderNotConfiguredError(provider);

    const apiKey = process.env[config.apiKeyEnvName];
    if (!apiKey) throw new ProviderApiKeyMissingError(provider);

    switch (provider) {
      case "deepseek":
        return new DeepSeekProviderClient(config.baseUrl, apiKey, config.timeoutMs);
      default:
        return new GenericProviderClient(provider, config.baseUrl, apiKey, config.timeoutMs);
    }
  }
}
