import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { GeoContentPlan, PlanStatus } from "./entities/geo-content-plan.entity";
import { CreateGeoContentPlanDto } from "./dto/create-geo-content-plan.dto";
import { UpdateGeoContentPlanDto } from "./dto/update-geo-content-plan.dto";
import { QueryGeoContentPlansDto } from "./dto/query-geo-content-plans.dto";
import { UpdateGeoContentPlanStatusDto } from "./dto/update-geo-content-plan-status.dto";

@Injectable()
export class GeoContentPlansService {
  constructor(
    @InjectRepository(GeoContentPlan)
    private readonly repo: Repository<GeoContentPlan>,
  ) {}

  async create(dto: CreateGeoContentPlanDto): Promise<GeoContentPlan> {
    const plan = this.repo.create({
      leadId: dto.leadId || null,
      brandAssetId: dto.brandAssetId || null,
      title: dto.title || "",
      month: dto.month || null,
      goal: dto.goal || null,
      targetPlatforms: dto.targetPlatforms || null,
      topics: dto.topics || null,
      status: (dto.status || "draft") as any,
      summary: dto.summary || null,
    });
    return this.repo.save(plan);
  }

  async findAll(query: QueryGeoContentPlansDto) {
    const { leadId, brandAssetId, status, month, keyword, page = 1, pageSize = 20 } = query;

    if (keyword) {
      return this.searchByKeyword(keyword, { leadId, brandAssetId, status, month, page, pageSize });
    }

    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (brandAssetId) where.brandAssetId = brandAssetId;
    if (status) where.status = status;
    if (month) where.month = month;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, pagination: { page, pageSize, total } };
  }

  async findById(id: string): Promise<GeoContentPlan> {
    const plan = await this.repo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`计划 ${id} 不存在`);
    return plan;
  }

  async update(id: string, dto: UpdateGeoContentPlanDto): Promise<GeoContentPlan> {
    const plan = await this.findById(id);
    const keys: (keyof UpdateGeoContentPlanDto)[] = [
      "leadId", "brandAssetId", "title", "month", "goal",
      "targetPlatforms", "topics", "status", "summary",
    ];
    for (const k of keys) {
      if (dto[k] !== undefined) (plan as any)[k] = dto[k];
    }
    return this.repo.save(plan);
  }

  async updateStatus(id: string, dto: UpdateGeoContentPlanStatusDto): Promise<GeoContentPlan> {
    const plan = await this.findById(id);
    plan.status = dto.status as PlanStatus;
    return this.repo.save(plan);
  }

  async archive(id: string): Promise<GeoContentPlan> {
    const plan = await this.findById(id);
    plan.status = "archived";
    return this.repo.save(plan);
  }

  private async searchByKeyword(
    keyword: string,
    filters: {
      leadId?: string; brandAssetId?: string; status?: string; month?: string;
      page: number; pageSize: number;
    },
  ) {
    const like = `%${keyword}%`;
    const where: any[] = [
      { title: ILike(like) },
      { goal: ILike(like) },
      { summary: ILike(like) },
    ];
    for (const w of where) {
      if (filters.leadId) w.leadId = filters.leadId;
      if (filters.brandAssetId) w.brandAssetId = filters.brandAssetId;
      if (filters.status) w.status = filters.status;
      if (filters.month) w.month = filters.month;
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    });

    return { data, pagination: { page: filters.page, pageSize: filters.pageSize, total } };
  }
}
