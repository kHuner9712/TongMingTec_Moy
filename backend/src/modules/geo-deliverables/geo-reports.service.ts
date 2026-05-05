import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { GeoReport, GeoReportStatus } from "./entities/geo-report.entity";
import { CreateGeoReportDto } from "./dto/create-geo-report.dto";
import { UpdateGeoReportDto } from "./dto/update-geo-report.dto";
import { QueryGeoReportsDto } from "./dto/query-geo-reports.dto";
import { UpdateGeoReportStatusDto } from "./dto/update-geo-report-status.dto";

const ALLOWED_TRANSITIONS: Record<GeoReportStatus, GeoReportStatus[]> = {
  draft: ["ready", "archived"],
  ready: ["delivered", "archived"],
  delivered: ["archived"],
  archived: [],
};

@Injectable()
export class GeoReportsService {
  constructor(
    @InjectRepository(GeoReport)
    private readonly repo: Repository<GeoReport>,
  ) {}

  async create(dto: CreateGeoReportDto): Promise<GeoReport> {
    const report = this.repo.create({
      leadId: dto.leadId || null,
      title: dto.title || "",
      companyName: dto.companyName || "",
      brandName: dto.brandName || "",
      website: dto.website || "",
      industry: dto.industry || "",
      targetCity: dto.targetCity || null,
      contactName: dto.contactName || null,
      status: "draft",
      diagnosisDate: dto.diagnosisDate || null,
      platforms: dto.platforms || null,
      competitors: dto.competitors || null,
      targetQuestions: dto.targetQuestions || null,
      testResults: dto.testResults || null,
      visibilitySummary: dto.visibilitySummary || null,
      mainProblems: dto.mainProblems || null,
      opportunities: dto.opportunities || null,
      recommendedActions: dto.recommendedActions || null,
      markdown: dto.markdown || null,
    });

    return this.repo.save(report);
  }

  async findAll(query: QueryGeoReportsDto) {
    const { leadId, status, keyword, page = 1, pageSize = 20 } = query;

    if (keyword) {
      return this.searchByKeyword(keyword, leadId, status, page, pageSize);
    }

    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (status) where.status = status;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, pagination: { page, pageSize, total } };
  }

  async findById(id: string): Promise<GeoReport> {
    const report = await this.repo.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException(`报告 ${id} 不存在`);
    }
    return report;
  }

  async update(id: string, dto: UpdateGeoReportDto): Promise<GeoReport> {
    const report = await this.findById(id);

    const updatable: (keyof UpdateGeoReportDto)[] = [
      "leadId", "title", "companyName", "brandName", "website", "industry",
      "targetCity", "contactName", "diagnosisDate", "platforms", "competitors",
      "targetQuestions", "testResults", "visibilitySummary", "mainProblems",
      "opportunities", "recommendedActions", "markdown",
    ];

    for (const key of updatable) {
      if (dto[key] !== undefined) {
        (report as any)[key] = dto[key];
      }
    }

    return this.repo.save(report);
  }

  async updateStatus(id: string, dto: UpdateGeoReportStatusDto): Promise<GeoReport> {
    const report = await this.findById(id);
    this.validateTransition(report.status, dto.status as GeoReportStatus);
    report.status = dto.status as GeoReportStatus;
    return this.repo.save(report);
  }

  async archive(id: string): Promise<GeoReport> {
    const report = await this.findById(id);
    report.status = "archived";
    return this.repo.save(report);
  }

  private validateTransition(from: GeoReportStatus, to: GeoReportStatus): void {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw new BadRequestException({
        code: "INVALID_TRANSITION",
        message: `不允许从 ${from} 流转到 ${to}`,
      });
    }
  }

  private async searchByKeyword(
    keyword: string,
    leadId?: string,
    status?: string,
    page = 1,
    pageSize = 20,
  ) {
    const like = `%${keyword}%`;
    const where: any[] = [
      { companyName: ILike(like) },
      { brandName: ILike(like) },
      { website: ILike(like) },
      { title: ILike(like) },
    ];

    if (leadId) {
      for (const w of where) w.leadId = leadId;
    }
    if (status) {
      for (const w of where) w.status = status;
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, pagination: { page, pageSize, total } };
  }
}
