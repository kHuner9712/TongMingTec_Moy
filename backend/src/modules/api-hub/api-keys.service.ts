import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as crypto from "crypto";
import { ApiProjectKey, ApiProjectKeyStatus } from "./entities/api-project-key.entity";
import { ApiProject } from "./entities/api-project.entity";
import { CreateApiKeyDto, UpdateApiKeyDto, QueryApiKeyDto, ApiKeyResponseDto } from "./dto/api-project-key.dto";

const ALLOWED_TRANSITIONS: Record<ApiProjectKeyStatus, ApiProjectKeyStatus[]> = {
  active: ["revoked", "expired"],
  revoked: [],
  expired: [],
};

function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = "moy_" + crypto.randomBytes(24).toString("hex");
  const prefix = raw.substring(0, 12);
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, prefix, hash };
}

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiProjectKey)
    private readonly repo: Repository<ApiProjectKey>,
    @InjectRepository(ApiProject)
    private readonly projectRepo: Repository<ApiProject>,
  ) {}

  async create(projectId: string, dto: CreateApiKeyDto): Promise<ApiKeyResponseDto> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException("PROJECT_NOT_FOUND");

    const { raw, prefix, hash } = generateApiKey();

    const key = this.repo.create({
      projectId,
      name: dto.name,
      keyPrefix: prefix,
      keyHash: hash,
      status: "active",
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    const saved = await this.repo.save(key);

    return this.toResponse(saved, raw);
  }

  async findAll(projectId: string, query: QueryApiKeyDto): Promise<{ data: ApiKeyResponseDto[]; total: number }> {
    const page = Math.max(1, +(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, +(query.pageSize || 20)));

    const where: any = { projectId };
    if (query.status) where.status = query.status;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data: data.map((k) => this.toResponse(k)), total };
  }

  async findById(id: string, projectId: string): Promise<ApiProjectKey> {
    const key = await this.repo.findOne({ where: { id, projectId } });
    if (!key) throw new NotFoundException("KEY_NOT_FOUND");
    return key;
  }

  async update(id: string, projectId: string, dto: UpdateApiKeyDto): Promise<ApiKeyResponseDto> {
    const key = await this.findById(id, projectId);

    if (dto.name !== undefined) key.name = dto.name;

    if (dto.status !== undefined) {
      this.validateTransition(key.status, dto.status as ApiProjectKeyStatus);
      key.status = dto.status as ApiProjectKeyStatus;
    }

    const saved = await this.repo.save(key);
    return this.toResponse(saved);
  }

  async revoke(id: string, projectId: string): Promise<void> {
    const key = await this.findById(id, projectId);
    key.status = "revoked";
    await this.repo.save(key);
  }

  async validateAndFind(rawKey: string): Promise<ApiProjectKey> {
    const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const key = await this.repo.findOne({ where: { keyHash: hash } });

    if (!key) throw new UnauthorizedException("INVALID_API_KEY");
    if (key.status !== "active") throw new UnauthorizedException("API_KEY_INACTIVE");
    if (key.expiresAt && new Date() > key.expiresAt) throw new UnauthorizedException("API_KEY_EXPIRED");

    key.lastUsedAt = new Date();
    await this.repo.save(key);

    return key;
  }

  private validateTransition(from: ApiProjectKeyStatus, to: ApiProjectKeyStatus): void {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw new BadRequestException(`INVALID_KEY_STATUS_TRANSITION: ${from} -> ${to}`);
    }
  }

  private toResponse(key: ApiProjectKey, rawKey?: string): ApiKeyResponseDto {
    return {
      id: key.id,
      projectId: key.projectId,
      name: key.name,
      keyPrefix: key.keyPrefix,
      rawKey: rawKey || "",
      status: key.status,
      lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
      expiresAt: key.expiresAt?.toISOString() ?? null,
      createdAt: key.createdAt.toISOString(),
      updatedAt: key.updatedAt.toISOString(),
    };
  }
}
