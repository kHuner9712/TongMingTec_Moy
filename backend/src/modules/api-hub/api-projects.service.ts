import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { ApiProject, ApiProjectStatus } from "./entities/api-project.entity";
import { CreateApiProjectDto, UpdateApiProjectDto, QueryApiProjectDto } from "./dto/api-project.dto";

const ALLOWED_TRANSITIONS: Record<ApiProjectStatus, ApiProjectStatus[]> = {
  active: ["suspended", "archived"],
  suspended: ["active", "archived"],
  archived: [],
};

@Injectable()
export class ApiProjectsService {
  constructor(
    @InjectRepository(ApiProject)
    private readonly repo: Repository<ApiProject>,
  ) {}

  async create(dto: CreateApiProjectDto): Promise<ApiProject> {
    const project = this.repo.create({
      name: dto.name,
      description: dto.description ?? null,
      orgId: dto.orgId ?? null,
      userId: dto.userId ?? null,
      defaultModelId: dto.defaultModelId ?? null,
      status: "active",
    });
    return this.repo.save(project);
  }

  async findAll(query: QueryApiProjectDto): Promise<{ data: ApiProject[]; total: number }> {
    const page = Math.max(1, +(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, +(query.pageSize || 20)));

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.orgId) where.orgId = query.orgId;

    if (query.keyword) {
      where.name = ILike(`%${query.keyword}%`);
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total };
  }

  async findById(id: string): Promise<ApiProject> {
    const project = await this.repo.findOne({ where: { id } });
    if (!project) throw new NotFoundException("PROJECT_NOT_FOUND");
    return project;
  }

  async update(id: string, dto: UpdateApiProjectDto): Promise<ApiProject> {
    const project = await this.findById(id);

    if (dto.name !== undefined) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description;
    if (dto.defaultModelId !== undefined) project.defaultModelId = dto.defaultModelId;

    if (dto.status !== undefined) {
      this.validateTransition(project.status, dto.status as ApiProjectStatus);
      project.status = dto.status as ApiProjectStatus;
    }

    return this.repo.save(project);
  }

  async archive(id: string): Promise<void> {
    const project = await this.findById(id);
    project.status = "archived";
    await this.repo.save(project);
  }

  private validateTransition(from: ApiProjectStatus, to: ApiProjectStatus): void {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw new BadRequestException(`INVALID_STATUS_TRANSITION: ${from} -> ${to}`);
    }
  }
}
