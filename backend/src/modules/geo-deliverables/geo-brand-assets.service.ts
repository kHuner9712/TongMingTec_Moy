import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { GeoBrandAsset, GeoBrandAssetStatus } from "./entities/geo-brand-asset.entity";
import { CreateGeoBrandAssetDto } from "./dto/create-geo-brand-asset.dto";
import { UpdateGeoBrandAssetDto } from "./dto/update-geo-brand-asset.dto";
import { QueryGeoBrandAssetsDto } from "./dto/query-geo-brand-assets.dto";
import { UpdateGeoBrandAssetStatusDto } from "./dto/update-geo-brand-asset-status.dto";

const ALLOWED_TRANSITIONS: Record<GeoBrandAssetStatus, GeoBrandAssetStatus[]> = {
  draft: ["ready", "archived"],
  ready: ["reviewed", "delivered", "archived"],
  reviewed: ["delivered", "archived"],
  delivered: ["archived"],
  archived: [],
};

@Injectable()
export class GeoBrandAssetsService {
  constructor(
    @InjectRepository(GeoBrandAsset)
    private readonly repo: Repository<GeoBrandAsset>,
  ) {}

  async create(dto: CreateGeoBrandAssetDto): Promise<GeoBrandAsset> {
    const asset = this.repo.create({
      leadId: dto.leadId || null,
      title: dto.title || "",
      companyName: dto.companyName || "",
      brandName: dto.brandName || "",
      website: dto.website || "",
      industry: dto.industry || "",
      targetCity: dto.targetCity || null,
      status: "draft",
      basicInfo: dto.basicInfo || null,
      companyIntro: dto.companyIntro || null,
      serviceItems: dto.serviceItems || null,
      advantages: dto.advantages || null,
      cases: dto.cases || null,
      faqs: dto.faqs || null,
      competitorDiffs: dto.competitorDiffs || null,
      complianceMaterials: dto.complianceMaterials || null,
      markdown: dto.markdown || null,
    });

    return this.repo.save(asset);
  }

  async findAll(query: QueryGeoBrandAssetsDto) {
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

  async findById(id: string): Promise<GeoBrandAsset> {
    const asset = await this.repo.findOne({ where: { id } });
    if (!asset) {
      throw new NotFoundException(`资产包 ${id} 不存在`);
    }
    return asset;
  }

  async update(id: string, dto: UpdateGeoBrandAssetDto): Promise<GeoBrandAsset> {
    const asset = await this.findById(id);

    const updatable: (keyof UpdateGeoBrandAssetDto)[] = [
      "leadId", "title", "companyName", "brandName", "website", "industry",
      "targetCity", "basicInfo", "companyIntro", "serviceItems", "advantages",
      "cases", "faqs", "competitorDiffs", "complianceMaterials", "markdown",
    ];

    for (const key of updatable) {
      if (dto[key] !== undefined) {
        (asset as any)[key] = dto[key];
      }
    }

    return this.repo.save(asset);
  }

  async updateStatus(id: string, dto: UpdateGeoBrandAssetStatusDto): Promise<GeoBrandAsset> {
    const asset = await this.findById(id);
    this.validateTransition(asset.status, dto.status as GeoBrandAssetStatus);
    asset.status = dto.status as GeoBrandAssetStatus;
    return this.repo.save(asset);
  }

  async archive(id: string): Promise<GeoBrandAsset> {
    const asset = await this.findById(id);
    asset.status = "archived";
    return this.repo.save(asset);
  }

  private validateTransition(from: GeoBrandAssetStatus, to: GeoBrandAssetStatus): void {
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
