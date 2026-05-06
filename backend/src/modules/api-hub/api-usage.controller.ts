import { Controller, Get, Post, Param, Query, Body, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { SkipTenantCheck } from "../../common/decorators/skip-tenant.decorator";
import { ApiUsageService } from "./api-usage.service";
import { CreateUsageRecordDto, QueryUsageRecordDto } from "./dto/api-usage-record.dto";

@Controller("api/v1/api-hub/usage")
@UseGuards(JwtAuthGuard)
@SkipTenantCheck()
export class ApiUsageController {
  constructor(private readonly usageService: ApiUsageService) {}

  @Post()
  record(@Query("projectId") projectId: string, @Body() dto: CreateUsageRecordDto) {
    return this.usageService.record(projectId, dto);
  }

  @Get()
  findAll(@Query() query: QueryUsageRecordDto & { projectId: string }) {
    return this.usageService.findAll(query.projectId, query);
  }

  @Get("stats")
  getStats(@Query("projectId") projectId: string, @Query("startDate") startDate?: string, @Query("endDate") endDate?: string) {
    return this.usageService.getStats(projectId, startDate, endDate);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Query("projectId") projectId: string) {
    return this.usageService.findById(id, projectId);
  }
}
