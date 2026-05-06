import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { SkipTenantCheck } from "../../common/decorators/skip-tenant.decorator";
import { ApiModelsService } from "./api-models.service";
import { CreateApiModelDto, UpdateApiModelDto, QueryApiModelDto } from "./dto/api-model.dto";

@Controller("api/v1/api-hub/models")
@UseGuards(JwtAuthGuard)
@SkipTenantCheck()
export class ApiModelsController {
  constructor(private readonly modelsService: ApiModelsService) {}

  @Post()
  create(@Body() dto: CreateApiModelDto) {
    return this.modelsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryApiModelDto) {
    return this.modelsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.modelsService.findById(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateApiModelDto) {
    return this.modelsService.update(id, dto);
  }

  @Delete(":id")
  archive(@Param("id") id: string) {
    return this.modelsService.archive(id);
  }
}
