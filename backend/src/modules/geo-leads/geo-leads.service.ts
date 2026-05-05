import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { Request } from "express";
import { REQUEST } from "@nestjs/core";
import { GeoLead } from "./entities/geo-lead.entity";
import { CreateGeoLeadDto } from "./dto/create-geo-lead.dto";

const HONEYPOT_FAKE_ID = "geo_lead_ignored";
const CONTACT_METHOD_MAX_PER_24H = 3;
const FORBIDDEN_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"];

@Injectable()
export class GeoLeadsService {
  constructor(
    @InjectRepository(GeoLead)
    private readonly repo: Repository<GeoLead>,
    @Inject(REQUEST) private readonly req: Request,
  ) {}

  async create(dto: CreateGeoLeadDto): Promise<GeoLead> {
    if (dto._hint && dto._hint.trim().length > 0) {
      this.notifyNewLead(null);
      const fake = new GeoLead();
      fake.id = HONEYPOT_FAKE_ID;
      fake.status = "received";
      return fake;
    }

    this.validateWebsite(dto.website);

    await this.checkContactMethodFrequency(dto.contactMethod);

    const lead = this.repo.create({
      companyName: dto.companyName,
      brandName: dto.brandName,
      website: dto.website,
      industry: dto.industry,
      targetCity: dto.targetCity || null,
      competitors: dto.competitors || null,
      contactName: dto.contactName,
      contactMethod: dto.contactMethod,
      notes: dto.notes || null,
      source: dto.source || "geo_website_form",
      status: "received",
      ipAddress: this.req.ip || null,
      userAgent: (this.req.headers["user-agent"] as string) || null,
    });

    const saved = await this.repo.save(lead);

    this.notifyNewLead(saved);

    return saved;
  }

  private validateWebsite(website: string): void {
    let url: URL;
    try {
      url = new URL(website);
    } catch {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message:
          "网站地址格式不正确，请输入完整的 URL（以 http:// 或 https:// 开头）。",
      });
    }

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "网站地址必须以 http:// 或 https:// 开头。",
      });
    }

    const host = url.hostname.toLowerCase();
    if (FORBIDDEN_HOSTS.includes(host) || host.startsWith("127.")) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "网站地址不合法，请提供公开可访问的域名。",
      });
    }
  }

  private async checkContactMethodFrequency(
    contactMethod: string,
  ): Promise<void> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const count = await this.repo.count({
      where: {
        contactMethod,
        createdAt: MoreThan(since),
      },
    });

    if (count >= CONTACT_METHOD_MAX_PER_24H) {
      throw new HttpException(
        {
          error: "rate_limited",
          message: "提交过于频繁，请稍后再试。",
          retryAfter: 3600,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private notifyNewLead(_lead: GeoLead | null): void {
    // TODO: 后续接入企业微信或飞书 Webhook 通知
  }
}
