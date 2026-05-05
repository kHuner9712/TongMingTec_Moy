import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { GeoContentDraft, DraftStatus } from "./entities/geo-content-draft.entity";
import { CreateGeoContentDraftDto } from "./dto/create-geo-content-draft.dto";
import { UpdateGeoContentDraftDto } from "./dto/update-geo-content-draft.dto";
import { QueryGeoContentDraftsDto } from "./dto/query-geo-content-drafts.dto";
import { UpdateGeoContentDraftStatusDto } from "./dto/update-geo-content-draft-status.dto";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["reviewing", "archived"],
  reviewing: ["approved", "archived"],
  approved: ["published", "archived"],
  published: ["archived"],
  archived: [],
};

@Injectable()
export class GeoContentDraftsService {
  constructor(
    @InjectRepository(GeoContentDraft)
    private readonly repo: Repository<GeoContentDraft>,
  ) {}

  async create(dto: CreateGeoContentDraftDto): Promise<GeoContentDraft> {
    const draft = this.repo.create({
      leadId: dto.leadId || null,
      brandAssetId: dto.brandAssetId || null,
      reportId: dto.reportId || null,
      topicId: dto.topicId || null,
      planId: dto.planId || null,
      title: dto.title || "",
      slug: dto.slug || null,
      contentType: dto.contentType || null,
      targetKeyword: dto.targetKeyword || null,
      targetQuestion: dto.targetQuestion || null,
      targetAudience: dto.targetAudience || null,
      platform: dto.platform || null,
      status: (dto.status || "draft") as DraftStatus,
      summary: dto.summary || null,
      outline: dto.outline || null,
      body: dto.body || null,
      markdown: dto.markdown || null,
      seoTitle: dto.seoTitle || null,
      metaDescription: dto.metaDescription || null,
      tags: dto.tags || null,
      complianceChecklist: dto.complianceChecklist || null,
      reviewNotes: dto.reviewNotes || null,
      publishedUrl: dto.publishedUrl || null,
      plannedPublishDate: dto.plannedPublishDate || null,
      actualPublishDate: dto.actualPublishDate || null,
    });
    return this.repo.save(draft);
  }

  async findAll(query: QueryGeoContentDraftsDto) {
    const { leadId, brandAssetId, reportId, topicId, planId, status, contentType, keyword, page = 1, pageSize = 20 } = query;

    if (keyword) {
      return this.searchByKeyword(keyword, { leadId, brandAssetId, reportId, topicId, planId, status, contentType, page, pageSize });
    }

    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (brandAssetId) where.brandAssetId = brandAssetId;
    if (reportId) where.reportId = reportId;
    if (topicId) where.topicId = topicId;
    if (planId) where.planId = planId;
    if (status) where.status = status;
    if (contentType) where.contentType = contentType;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, pagination: { page, pageSize, total } };
  }

  async findById(id: string): Promise<GeoContentDraft> {
    const draft = await this.repo.findOne({ where: { id } });
    if (!draft) throw new NotFoundException(`稿件 ${id} 不存在`);
    return draft;
  }

  async update(id: string, dto: UpdateGeoContentDraftDto): Promise<GeoContentDraft> {
    const draft = await this.findById(id);
    const keys: (keyof UpdateGeoContentDraftDto)[] = [
      "leadId", "brandAssetId", "reportId", "topicId", "planId",
      "title", "slug", "contentType", "targetKeyword", "targetQuestion",
      "targetAudience", "platform", "status", "summary", "outline", "body",
      "markdown", "seoTitle", "metaDescription", "tags", "complianceChecklist",
      "reviewNotes", "publishedUrl", "plannedPublishDate", "actualPublishDate",
    ];
    for (const k of keys) {
      if (dto[k] !== undefined) (draft as any)[k] = dto[k];
    }
    return this.repo.save(draft);
  }

  async updateStatus(id: string, dto: UpdateGeoContentDraftStatusDto): Promise<GeoContentDraft> {
    const draft = await this.findById(id);
    const current = draft.status;
    const target = dto.status;
    const allowed = ALLOWED_TRANSITIONS[current];
    if (!allowed || !allowed.includes(target)) {
      throw new BadRequestException(`不允许从 ${current} 流转到 ${target}`);
    }
    draft.status = target as DraftStatus;
    return this.repo.save(draft);
  }

  async archive(id: string): Promise<GeoContentDraft> {
    const draft = await this.findById(id);
    draft.status = "archived";
    return this.repo.save(draft);
  }

  private async searchByKeyword(
    keyword: string,
    filters: {
      leadId?: string; brandAssetId?: string; reportId?: string;
      topicId?: string; planId?: string; status?: string; contentType?: string;
      page: number; pageSize: number;
    },
  ) {
    const like = `%${keyword}%`;
    const where: any[] = [
      { title: ILike(like) },
      { targetKeyword: ILike(like) },
      { targetQuestion: ILike(like) },
      { body: ILike(like) },
    ];
    for (const w of where) {
      if (filters.leadId) w.leadId = filters.leadId;
      if (filters.brandAssetId) w.brandAssetId = filters.brandAssetId;
      if (filters.reportId) w.reportId = filters.reportId;
      if (filters.topicId) w.topicId = filters.topicId;
      if (filters.planId) w.planId = filters.planId;
      if (filters.status) w.status = filters.status;
      if (filters.contentType) w.contentType = filters.contentType;
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
