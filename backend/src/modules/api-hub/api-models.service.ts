import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { ApiModel, ApiModelStatus } from "./entities/api-model.entity";
import { CreateApiModelDto, UpdateApiModelDto, QueryApiModelDto } from "./dto/api-model.dto";

@Injectable()
export class ApiModelsService {
  constructor(
    @InjectRepository(ApiModel)
    private readonly repo: Repository<ApiModel>,
  ) {}

  async create(dto: CreateApiModelDto): Promise<ApiModel> {
    const existing = await this.repo.findOne({ where: { modelId: dto.modelId } });
    if (existing) throw new ConflictException("MODEL_ALREADY_EXISTS");

    const model = this.repo.create({
      name: dto.name,
      provider: dto.provider,
      modelId: dto.modelId,
      category: (dto.category as any) || "text",
      pricingUnit: dto.pricingUnit || "token",
      unitLabel: dto.unitLabel ?? null,
      description: dto.description ?? null,
      status: (dto.status as ApiModelStatus) || "internal",
      maxInputTokens: dto.maxInputTokens ?? null,
      maxOutputTokens: dto.maxOutputTokens ?? null,
      supportsStreaming: dto.supportsStreaming ?? false,
      supportsVision: dto.supportsVision ?? false,
      supportsFunctionCalling: dto.supportsFunctionCalling ?? false,
      upstreamModel: dto.upstreamModel ?? null,
    });
    return this.repo.save(model);
  }

  async findAll(query: QueryApiModelDto): Promise<{ data: ApiModel[]; total: number }> {
    const page = Math.max(1, +(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, +(query.pageSize || 20)));

    const where: any = {};
    if (query.provider) where.provider = query.provider;
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;

    if (query.keyword) {
      where.name = ILike(`%${query.keyword}%`);
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total };
  }

  async findById(id: string): Promise<ApiModel> {
    const model = await this.repo.findOne({ where: { id } });
    if (!model) throw new NotFoundException("MODEL_NOT_FOUND");
    return model;
  }

  async update(id: string, dto: UpdateApiModelDto): Promise<ApiModel> {
    const model = await this.findById(id);

    if (dto.name !== undefined) model.name = dto.name;
    if (dto.provider !== undefined) model.provider = dto.provider;
    if (dto.modelId !== undefined) {
      const existing = await this.repo.findOne({ where: { modelId: dto.modelId } });
      if (existing && existing.id !== id) throw new ConflictException("MODEL_ALREADY_EXISTS");
      model.modelId = dto.modelId;
    }
    if (dto.category !== undefined) model.category = dto.category as any;
    if (dto.pricingUnit !== undefined) model.pricingUnit = dto.pricingUnit;
    if (dto.unitLabel !== undefined) model.unitLabel = dto.unitLabel;
    if (dto.description !== undefined) model.description = dto.description;
    if (dto.status !== undefined) model.status = dto.status as ApiModelStatus;
    if (dto.maxInputTokens !== undefined) model.maxInputTokens = dto.maxInputTokens;
    if (dto.maxOutputTokens !== undefined) model.maxOutputTokens = dto.maxOutputTokens;
    if (dto.supportsStreaming !== undefined) model.supportsStreaming = dto.supportsStreaming;
    if (dto.supportsVision !== undefined) model.supportsVision = dto.supportsVision;
    if (dto.supportsFunctionCalling !== undefined) model.supportsFunctionCalling = dto.supportsFunctionCalling;
    if (dto.upstreamModel !== undefined) model.upstreamModel = dto.upstreamModel;

    return this.repo.save(model);
  }

  async archive(id: string): Promise<void> {
    const model = await this.findById(id);
    model.status = "deprecated";
    await this.repo.save(model);
  }
}
