import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { SkipTenantCheck } from "../../common/decorators/skip-tenant.decorator";
import { ApiProjectsService } from "./api-projects.service";
import { ApiProjectModelsService } from "./api-project-models.service";
import { ApiQuotaService } from "./api-quota.service";
import { CreateApiProjectDto, UpdateApiProjectDto, QueryApiProjectDto } from "./dto/api-project.dto";
import { AddProjectModelDto, UpdateProjectModelDto } from "./dto/api-project-model.dto";
import { SetMonthlyQuotaDto, UpdateMonthlyQuotaDto, QueryMonthlyQuotaDto } from "./dto/api-monthly-quota.dto";

@Controller("api/v1/api-hub/projects")
@UseGuards(JwtAuthGuard)
@SkipTenantCheck()
export class ApiProjectsController {
  constructor(
    private readonly projectsService: ApiProjectsService,
    private readonly projectModelsService: ApiProjectModelsService,
    private readonly quotaService: ApiQuotaService,
  ) {}

  @Post()
  create(@Body() dto: CreateApiProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryApiProjectDto) {
    return this.projectsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.projectsService.findById(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateApiProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(":id")
  archive(@Param("id") id: string) {
    return this.projectsService.archive(id);
  }

  @Post(":id/models")
  addModel(@Param("id") id: string, @Body() dto: AddProjectModelDto) {
    return this.projectModelsService.addModel(id, dto);
  }

  @Get(":id/models")
  listModels(@Param("id") id: string) {
    return this.projectModelsService.findAll(id);
  }

  @Patch(":id/models/:modelId")
  updateModel(@Param("id") id: string, @Param("modelId") modelId: string, @Body() dto: UpdateProjectModelDto) {
    return this.projectModelsService.update(modelId, id, dto);
  }

  @Delete(":id/models/:modelId")
  removeModel(@Param("id") id: string, @Param("modelId") modelId: string) {
    return this.projectModelsService.remove(modelId, id);
  }

  @Post(":id/quota")
  setQuota(@Param("id") id: string, @Body() dto: SetMonthlyQuotaDto) {
    return this.quotaService.setQuota(id, dto);
  }

  @Get(":id/quota")
  listQuota(@Param("id") id: string, @Query() query: QueryMonthlyQuotaDto) {
    return this.quotaService.findAll(id, query);
  }

  @Patch(":id/quota/:quotaId")
  updateQuota(@Param("id") id: string, @Param("quotaId") quotaId: string, @Body() dto: UpdateMonthlyQuotaDto) {
    return this.quotaService.updateQuota(quotaId, id, dto);
  }

  @Delete(":id/quota/:quotaId")
  deleteQuota(@Param("id") id: string, @Param("quotaId") quotaId: string) {
    return this.quotaService.deleteQuota(quotaId, id);
  }

  @Get(":id/remaining")
  getRemaining(@Param("id") id: string, @Query("modelId") modelId: string) {
    return this.quotaService.getRemaining(id, modelId);
  }
}
