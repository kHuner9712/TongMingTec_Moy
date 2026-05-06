import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan, ILike, FindOptionsWhere } from "typeorm";
import { Request } from "express";
import { REQUEST } from "@nestjs/core";
import { GeoLead, GeoLeadStatus } from "./entities/geo-lead.entity";
import { CreateGeoLeadDto } from "./dto/create-geo-lead.dto";
import { QueryGeoLeadsDto } from "./dto/query-geo-leads.dto";
import { UpdateGeoLeadStatusDto } from "./dto/update-geo-lead-status.dto";

const HONEYPOT_FAKE_ID = "geo_lead_ignored";
const CONTACT_METHOD_MAX_PER_24H = 3;
const FORBIDDEN_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"];

const ALLOWED_TRANSITIONS: Record<GeoLeadStatus, GeoLeadStatus[]> = {
  received: ["contacted", "lost", "archived"],
  contacted: ["qualified", "lost", "archived"],
  qualified: ["proposal_sent", "lost", "archived"],
  proposal_sent: ["won", "lost", "archived"],
  won: [],
  lost: ["archived"],
  archived: [],
};

@Injectable()
export class GeoLeadsService {
  private readonly logger = new Logger(GeoLeadsService.name);

  constructor(
    @InjectRepository(GeoLead)
    private readonly repo: Repository<GeoLead>,
    @Inject(REQUEST) private readonly req: Request,
  ) {}

  async create(dto: CreateGeoLeadDto): Promise<GeoLead> {
    if (dto._hint && dto._hint.trim().length > 0) {
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

  async findAll(query: QueryGeoLeadsDto) {
    const { status, keyword, page = 1, pageSize = 20 } = query;

    const where: FindOptionsWhere<GeoLead> = {};

    if (status) {
      where.status = status as GeoLeadStatus;
    }

    if (keyword) {
      return this.searchByKeyword(keyword, page, pageSize);
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data,
      pagination: { page, pageSize, total },
    };
  }

  async findById(id: string): Promise<GeoLead> {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) {
      throw new NotFoundException(`线索 ${id} 不存在`);
    }
    return lead;
  }

  async updateStatus(
    id: string,
    dto: UpdateGeoLeadStatusDto,
  ): Promise<GeoLead> {
    const lead = await this.findById(id);

    this.validateTransition(lead.status, dto.status);

    lead.status = dto.status;

    if (dto.notes) {
      const separator = lead.notes ? "\n\n---\n" : "";
      lead.notes =
        (lead.notes || "") +
        separator +
        `[状态变更为 ${dto.status}] ${dto.notes}`;
    }

    if (dto.status === "contacted" && !lead.firstContactedAt) {
      lead.firstContactedAt = new Date();
    }

    return this.repo.save(lead);
  }

  validateTransition(from: GeoLeadStatus, to: GeoLeadStatus): void {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw new BadRequestException({
        code: "INVALID_TRANSITION",
        message: `不允许从 ${from} 流转到 ${to}。允许的目标状态: ${allowed?.join(", ") || "无"}`,
      });
    }
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

  private async searchByKeyword(
    keyword: string,
    page: number,
    pageSize: number,
  ) {
    const like = `%${keyword}%`;

    const [data, total] = await this.repo.findAndCount({
      where: [
        { companyName: ILike(like) },
        { brandName: ILike(like) },
        { website: ILike(like) },
        { contactMethod: ILike(like) },
      ],
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data,
      pagination: { page, pageSize, total },
    };
  }

  private notifyNewLead(lead: GeoLead | null): void {
    if (!lead || lead.id === HONEYPOT_FAKE_ID) {
      return;
    }

    const webhookType = (
      process.env.GEO_LEAD_NOTIFY_WEBHOOK_TYPE || "none"
    ).trim();
    const webhookUrl = (process.env.GEO_LEAD_NOTIFY_WEBHOOK_URL || "").trim();

    if (webhookType === "none" || !webhookUrl) {
      return;
    }

    const time = lead.createdAt
      ? new Date(lead.createdAt).toLocaleString("zh-CN", {
          timeZone: "Asia/Shanghai",
        })
      : "";

    const content = [
      "**【MOY GEO】新诊断申请**",
      "",
      `公司：${lead.companyName}`,
      `品牌：${lead.brandName}`,
      `官网：${lead.website}`,
      `行业：${lead.industry}`,
      `城市：${lead.targetCity || "未填写"}`,
      `联系人：${lead.contactName} / ${lead.contactMethod}`,
      `来源：${lead.source}`,
      `时间：${time}`,
      "",
      `[查看详情](https://geo.moy.com/admin/leads/${lead.id})`,
    ].join("\n");

    const payload =
      webhookType === "feishu"
        ? {
            msg_type: "interactive",
            card: {
              header: {
                title: { content: "【MOY GEO】新诊断申请", tag: "plain_text" },
                template: "blue",
              },
              elements: [{ tag: "markdown", content }],
            },
          }
        : { msgtype: "markdown", markdown: { content } };

    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((err) => {
      this.logger.warn(`[GEO] webhook 通知发送失败: ${err.message}`);
    });
  }
}
