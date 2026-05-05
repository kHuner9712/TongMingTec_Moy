import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from "@nestjs/common";
import { GeoContentPlansService } from "./geo-content-plans.service";
import { CreateGeoContentPlanDto } from "./dto/create-geo-content-plan.dto";
import { UpdateGeoContentPlanDto } from "./dto/update-geo-content-plan.dto";
import { QueryGeoContentPlansDto } from "./dto/query-geo-content-plans.dto";
import { UpdateGeoContentPlanStatusDto } from "./dto/update-geo-content-plan-status.dto";

@Controller("api/v1/geo-content-plans")
export class GeoContentPlansController {
  constructor(private readonly service: GeoContentPlansService) {}

  @Get() findAll(@Query() query: QueryGeoContentPlansDto) { return this.service.findAll(query); }
  @Post() create(@Body() dto: CreateGeoContentPlanDto) { return this.service.create(dto); }
  @Get(":id") findById(@Param("id") id: string) { return this.service.findById(id); }
  @Patch(":id") update(@Param("id") id: string, @Body() dto: UpdateGeoContentPlanDto) { return this.service.update(id, dto); }
  @Patch(":id/status") updateStatus(@Param("id") id: string, @Body() dto: UpdateGeoContentPlanStatusDto) { return this.service.updateStatus(id, dto); }
  @Delete(":id") archive(@Param("id") id: string) { return this.service.archive(id); }
}
