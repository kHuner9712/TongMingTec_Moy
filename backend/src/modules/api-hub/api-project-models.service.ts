import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiProjectModel } from "./entities/api-project-model.entity";
import { ApiProject } from "./entities/api-project.entity";
import { ApiModel } from "./entities/api-model.entity";
import { AddProjectModelDto, UpdateProjectModelDto } from "./dto/api-project-model.dto";

@Injectable()
export class ApiProjectModelsService {
  constructor(
    @InjectRepository(ApiProjectModel)
    private readonly repo: Repository<ApiProjectModel>,
    @InjectRepository(ApiProject)
    private readonly projectRepo: Repository<ApiProject>,
    @InjectRepository(ApiModel)
    private readonly modelRepo: Repository<ApiModel>,
  ) {}

  async addModel(projectId: string, dto: AddProjectModelDto): Promise<ApiProjectModel> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException("PROJECT_NOT_FOUND");

    const model = await this.modelRepo.findOne({ where: { id: dto.modelId } });
    if (!model) throw new NotFoundException("MODEL_NOT_FOUND");

    const pm = this.repo.create({
      projectId,
      modelId: dto.modelId,
      enabled: dto.enabled ?? true,
    });
    return this.repo.save(pm);
  }

  async findAll(projectId: string): Promise<(ApiProjectModel & { model?: ApiModel })[]> {
    const entries = await this.repo.find({ where: { projectId } });
    const modelIds = entries.map((e) => e.modelId);
    const models = await this.modelRepo.findByIds(modelIds);
    const modelMap = new Map(models.map((m) => [m.id, m]));
    return entries.map((e) => ({ ...e, model: modelMap.get(e.modelId) }));
  }

  async update(id: string, projectId: string, dto: UpdateProjectModelDto): Promise<ApiProjectModel> {
    const pm = await this.repo.findOne({ where: { id, projectId } });
    if (!pm) throw new NotFoundException("PROJECT_MODEL_NOT_FOUND");

    if (dto.enabled !== undefined) pm.enabled = dto.enabled;
    return this.repo.save(pm);
  }

  async remove(id: string, projectId: string): Promise<void> {
    const pm = await this.repo.findOne({ where: { id, projectId } });
    if (!pm) throw new NotFoundException("PROJECT_MODEL_NOT_FOUND");
    await this.repo.remove(pm);
  }

  async findEnabledModelsForProject(projectId: string): Promise<(ApiProjectModel & { model?: ApiModel })[]> {
    const entries = await this.repo.find({ where: { projectId, enabled: true } });
    if (entries.length === 0) return [];

    const modelIds = entries.map((e) => e.modelId);
    const models = await this.modelRepo.findByIds(modelIds);
    const modelMap = new Map(models.map((m) => [m.id, m]));
    return entries.map((e) => ({ ...e, model: modelMap.get(e.modelId) }));
  }

  async findEnabledModelByModelId(projectId: string, modelIdString: string): Promise<(ApiProjectModel & { model?: ApiModel }) | null> {
    const model = await this.modelRepo.findOne({ where: { modelId: modelIdString } });
    if (!model) return null;

    const pm = await this.repo.findOne({ where: { projectId, modelId: model.id, enabled: true } });
    if (!pm) return null;

    return { ...pm, model };
  }
}
