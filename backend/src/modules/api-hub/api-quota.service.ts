import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiMonthlyQuota } from "./entities/api-monthly-quota.entity";
import { ApiProject } from "./entities/api-project.entity";
import { ApiModel } from "./entities/api-model.entity";
import { SetMonthlyQuotaDto, UpdateMonthlyQuotaDto, QueryMonthlyQuotaDto, MonthlyQuotaResponseDto } from "./dto/api-monthly-quota.dto";

@Injectable()
export class ApiQuotaService {
  constructor(
    @InjectRepository(ApiMonthlyQuota)
    private readonly repo: Repository<ApiMonthlyQuota>,
    @InjectRepository(ApiProject)
    private readonly projectRepo: Repository<ApiProject>,
    @InjectRepository(ApiModel)
    private readonly modelRepo: Repository<ApiModel>,
  ) {}

  async setQuota(projectId: string, dto: SetMonthlyQuotaDto): Promise<MonthlyQuotaResponseDto> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException("PROJECT_NOT_FOUND");

    const model = await this.modelRepo.findOne({ where: { id: dto.modelId } });
    if (!model) throw new NotFoundException("MODEL_NOT_FOUND");

    let quota = await this.repo.findOne({
      where: { projectId, modelId: dto.modelId, period: dto.period },
    });

    if (quota) {
      quota.quotaLimit = dto.quotaLimit;
      quota.quotaUnit = dto.quotaUnit || "token";
    } else {
      const [year, month] = dto.period.split("-");
      const resetAt = new Date(+year, +month, 1);
      quota = this.repo.create({
        projectId,
        modelId: dto.modelId,
        period: dto.period,
        quotaUnit: dto.quotaUnit || "token",
        quotaLimit: dto.quotaLimit,
        quotaUsed: 0,
        resetAt,
      });
    }

    const saved = await this.repo.save(quota);
    return this.toResponse(saved, model.name);
  }

  async updateQuota(id: string, projectId: string, dto: UpdateMonthlyQuotaDto): Promise<MonthlyQuotaResponseDto> {
    const quota = await this.repo.findOne({ where: { id, projectId } });
    if (!quota) throw new NotFoundException("QUOTA_NOT_FOUND");

    quota.quotaLimit = dto.quotaLimit;
    const saved = await this.repo.save(quota);

    const model = await this.modelRepo.findOne({ where: { id: quota.modelId } });
    return this.toResponse(saved, model?.name);
  }

  async findAll(projectId: string, query: QueryMonthlyQuotaDto): Promise<MonthlyQuotaResponseDto[]> {
    const where: any = { projectId };
    if (query.period) where.period = query.period;
    if (query.modelId) where.modelId = query.modelId;

    const quotas = await this.repo.find({ where, order: { period: "DESC" } });

    const models = await this.modelRepo.find();
    const modelMap = new Map(models.map((m) => [m.id, m.name]));

    return quotas.map((q) => this.toResponse(q, modelMap.get(q.modelId)));
  }

  async trackUsage(projectId: string, modelId: string, tokens: number): Promise<{ allowed: boolean; remaining: number }> {
    const period = new Date().toISOString().substring(0, 7);
    let quota = await this.repo.findOne({ where: { projectId, modelId, period } });

    if (!quota) {
      quota = this.repo.create({
        projectId, modelId, period, quotaUnit: "token",
        quotaLimit: 0, quotaUsed: 0, resetAt: new Date(),
      });
    }

    const newUsed = +quota.quotaUsed + tokens;
    const allowed = quota.quotaLimit === 0 || newUsed <= quota.quotaLimit;

    if (allowed) {
      quota.quotaUsed = newUsed;
      await this.repo.save(quota);
    }

    return { allowed, remaining: Math.max(0, quota.quotaLimit - newUsed) };
  }

  async getRemaining(projectId: string, modelId: string): Promise<{ remaining: number; used: number; limit: number }> {
    const period = new Date().toISOString().substring(0, 7);
    const quota = await this.repo.findOne({ where: { projectId, modelId, period } });

    if (!quota) return { remaining: 0, used: 0, limit: 0 };

    return {
      remaining: Math.max(0, quota.quotaLimit - +quota.quotaUsed),
      used: +quota.quotaUsed,
      limit: +quota.quotaLimit,
    };
  }

  async deleteQuota(id: string, projectId: string): Promise<void> {
    const quota = await this.repo.findOne({ where: { id, projectId } });
    if (!quota) throw new NotFoundException("QUOTA_NOT_FOUND");
    await this.repo.remove(quota);
  }

  private toResponse(q: ApiMonthlyQuota, modelName?: string): MonthlyQuotaResponseDto {
    const pct = q.quotaLimit > 0 ? Math.round((+q.quotaUsed / +q.quotaLimit) * 100) : 0;
    return {
      id: q.id,
      projectId: q.projectId,
      modelId: q.modelId,
      modelName,
      period: q.period,
      quotaUnit: q.quotaUnit,
      quotaLimit: +q.quotaLimit,
      quotaUsed: +q.quotaUsed,
      usagePercent: pct,
      resetAt: q.resetAt?.toISOString() ?? null,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    };
  }
}
