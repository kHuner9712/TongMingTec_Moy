import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { GeoContentTopic, TopicStatus } from "./entities/geo-content-topic.entity";
import { CreateGeoContentTopicDto } from "./dto/create-geo-content-topic.dto";
import { UpdateGeoContentTopicDto } from "./dto/update-geo-content-topic.dto";
import { QueryGeoContentTopicsDto } from "./dto/query-geo-content-topics.dto";
import { UpdateGeoContentTopicStatusDto } from "./dto/update-geo-content-topic-status.dto";

@Injectable()
export class GeoContentTopicsService {
  constructor(
    @InjectRepository(GeoContentTopic)
    private readonly repo: Repository<GeoContentTopic>,
  ) {}

  async create(dto: CreateGeoContentTopicDto): Promise<GeoContentTopic> {
    const topic = this.repo.create({
      leadId: dto.leadId || null,
      brandAssetId: dto.brandAssetId || null,
      reportId: dto.reportId || null,
      title: dto.title || "",
      contentType: (dto.contentType || "industry_question") as any,
      targetKeyword: dto.targetKeyword || null,
      targetQuestion: dto.targetQuestion || null,
      targetAudience: dto.targetAudience || null,
      searchIntent: (dto.searchIntent || null) as any,
      platformSuggestion: dto.platformSuggestion || null,
      priority: (dto.priority || "medium") as any,
      status: (dto.status || "idea") as any,
      outline: dto.outline || null,
      keyPoints: dto.keyPoints || null,
      referenceMaterials: dto.referenceMaterials || null,
      complianceNotes: dto.complianceNotes || null,
      plannedPublishDate: dto.plannedPublishDate || null,
      actualPublishDate: dto.actualPublishDate || null,
      publishedUrl: dto.publishedUrl || null,
    });
    return this.repo.save(topic);
  }

  async findAll(query: QueryGeoContentTopicsDto) {
    const { leadId, brandAssetId, reportId, status, priority, contentType, keyword, page = 1, pageSize = 20 } = query;

    if (keyword) {
      return this.searchByKeyword(keyword, { leadId, brandAssetId, reportId, status, priority, contentType, page, pageSize });
    }

    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (brandAssetId) where.brandAssetId = brandAssetId;
    if (reportId) where.reportId = reportId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (contentType) where.contentType = contentType;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, pagination: { page, pageSize, total } };
  }

  async findById(id: string): Promise<GeoContentTopic> {
    const topic = await this.repo.findOne({ where: { id } });
    if (!topic) throw new NotFoundException(`选题 ${id} 不存在`);
    return topic;
  }

  async update(id: string, dto: UpdateGeoContentTopicDto): Promise<GeoContentTopic> {
    const topic = await this.findById(id);
    const keys: (keyof UpdateGeoContentTopicDto)[] = [
      "leadId", "brandAssetId", "reportId", "title", "contentType",
      "targetKeyword", "targetQuestion", "targetAudience", "searchIntent",
      "platformSuggestion", "priority", "status", "outline", "keyPoints",
      "referenceMaterials", "complianceNotes", "plannedPublishDate",
      "actualPublishDate", "publishedUrl",
    ];
    for (const k of keys) {
      if (dto[k] !== undefined) (topic as any)[k] = dto[k];
    }
    return this.repo.save(topic);
  }

  async updateStatus(id: string, dto: UpdateGeoContentTopicStatusDto): Promise<GeoContentTopic> {
    const topic = await this.findById(id);
    topic.status = dto.status as TopicStatus;
    return this.repo.save(topic);
  }

  async archive(id: string): Promise<GeoContentTopic> {
    const topic = await this.findById(id);
    topic.status = "archived";
    return this.repo.save(topic);
  }

  private async searchByKeyword(
    keyword: string,
    filters: {
      leadId?: string; brandAssetId?: string; reportId?: string;
      status?: string; priority?: string; contentType?: string;
      page: number; pageSize: number;
    },
  ) {
    const like = `%${keyword}%`;
    const where: any[] = [
      { title: ILike(like) },
      { targetKeyword: ILike(like) },
      { targetQuestion: ILike(like) },
    ];
    for (const w of where) {
      if (filters.leadId) w.leadId = filters.leadId;
      if (filters.brandAssetId) w.brandAssetId = filters.brandAssetId;
      if (filters.reportId) w.reportId = filters.reportId;
      if (filters.status) w.status = filters.status;
      if (filters.priority) w.priority = filters.priority;
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
