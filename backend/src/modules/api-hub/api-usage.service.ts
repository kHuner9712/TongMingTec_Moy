import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { ApiUsageRecord } from "./entities/api-usage-record.entity";
import { ApiModel } from "./entities/api-model.entity";
import { CreateUsageRecordDto, QueryUsageRecordDto, UsageStatsDto } from "./dto/api-usage-record.dto";

@Injectable()
export class ApiUsageService {
  constructor(
    @InjectRepository(ApiUsageRecord)
    private readonly repo: Repository<ApiUsageRecord>,
    @InjectRepository(ApiModel)
    private readonly modelRepo: Repository<ApiModel>,
  ) {}

  async record(projectId: string, dto: CreateUsageRecordDto): Promise<ApiUsageRecord> {
    const record = this.repo.create({
      projectId,
      keyId: dto.keyId,
      modelId: dto.modelId,
      requestId: dto.requestId ?? null,
      inputTokens: dto.inputTokens,
      outputTokens: dto.outputTokens,
      totalTokens: dto.totalTokens,
      cost: dto.cost,
      status: dto.status || "success",
      errorMessage: dto.errorMessage ?? null,
    });
    return this.repo.save(record);
  }

  async findAll(projectId: string, query: QueryUsageRecordDto): Promise<{ data: ApiUsageRecord[]; total: number }> {
    const page = Math.max(1, +(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, +(query.pageSize || 20)));

    const where: any = { projectId };
    if (query.keyId) where.keyId = query.keyId;
    if (query.modelId) where.modelId = query.modelId;
    if (query.status) where.status = query.status;

    if (query.startDate && query.endDate) {
      where.createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    } else if (query.startDate) {
      where.createdAt = MoreThanOrEqual(new Date(query.startDate));
    } else if (query.endDate) {
      where.createdAt = LessThanOrEqual(new Date(query.endDate));
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total };
  }

  async findById(id: string, projectId: string): Promise<ApiUsageRecord> {
    const record = await this.repo.findOne({ where: { id, projectId } });
    if (!record) throw new NotFoundException("USAGE_RECORD_NOT_FOUND");
    return record;
  }

  async getStats(projectId: string, startDate?: string, endDate?: string): Promise<UsageStatsDto> {
    const where: any = { projectId };

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const records = await this.repo.find({ where });

    const totalTokens = records.reduce((s, r) => s + r.totalTokens, 0);
    const totalCost = records.reduce((s, r) => s + (+r.cost), 0);
    const totalRequests = records.length;

    const byModelMap = new Map<string, { tokens: number; cost: number; requests: number }>();
    const byDayMap = new Map<string, { tokens: number; cost: number; requests: number }>();

    records.forEach((r) => {
      const m = byModelMap.get(r.modelId) || { tokens: 0, cost: 0, requests: 0 };
      m.tokens += r.totalTokens;
      m.cost += +r.cost;
      m.requests++;
      byModelMap.set(r.modelId, m);

      const day = r.createdAt.toISOString().substring(0, 10);
      const d = byDayMap.get(day) || { tokens: 0, cost: 0, requests: 0, date: day };
      d.tokens += r.totalTokens;
      d.cost += +r.cost;
      d.requests++;
      byDayMap.set(day, d);
    });

    const modelIds = [...byModelMap.keys()];
    const models = await this.modelRepo.findByIds(modelIds);
    const modelNameMap = new Map(models.map((m) => [m.id, m.name]));

    const byModel = [...byModelMap.entries()].map(([modelId, val]) => ({
      modelId, modelName: modelNameMap.get(modelId) || modelId, ...val,
    }));

    const byDay = [...byDayMap.entries()]
      .map(([date, val]) => ({ date, ...val }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { totalTokens, totalCost: Math.round(totalCost * 1000000) / 1000000, totalRequests, byModel, byDay };
  }
}
