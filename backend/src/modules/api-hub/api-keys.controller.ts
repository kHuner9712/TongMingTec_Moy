import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { SkipTenantCheck } from "../../common/decorators/skip-tenant.decorator";
import { ApiKeysService } from "./api-keys.service";
import { CreateApiKeyDto, UpdateApiKeyDto, QueryApiKeyDto } from "./dto/api-project-key.dto";

@Controller("api/v1/api-hub/projects/:projectId/keys")
@UseGuards(JwtAuthGuard)
@SkipTenantCheck()
export class ApiKeysController {
  constructor(private readonly keysService: ApiKeysService) {}

  @Post()
  create(@Param("projectId") projectId: string, @Body() dto: CreateApiKeyDto) {
    return this.keysService.create(projectId, dto);
  }

  @Get()
  findAll(@Param("projectId") projectId: string, @Query() query: QueryApiKeyDto) {
    return this.keysService.findAll(projectId, query);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Param("projectId") projectId: string) {
    return this.keysService.findById(id, projectId);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Param("projectId") projectId: string, @Body() dto: UpdateApiKeyDto) {
    return this.keysService.update(id, projectId, dto);
  }

  @Delete(":id")
  revoke(@Param("id") id: string, @Param("projectId") projectId: string) {
    return this.keysService.revoke(id, projectId);
  }
}
