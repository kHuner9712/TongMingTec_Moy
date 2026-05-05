import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from "@nestjs/common";
import { GeoContentTopicsService } from "./geo-content-topics.service";
import { CreateGeoContentTopicDto } from "./dto/create-geo-content-topic.dto";
import { UpdateGeoContentTopicDto } from "./dto/update-geo-content-topic.dto";
import { QueryGeoContentTopicsDto } from "./dto/query-geo-content-topics.dto";
import { UpdateGeoContentTopicStatusDto } from "./dto/update-geo-content-topic-status.dto";

@Controller("api/v1/geo-content-topics")
export class GeoContentTopicsController {
  constructor(private readonly service: GeoContentTopicsService) {}

  @Get() findAll(@Query() query: QueryGeoContentTopicsDto) { return this.service.findAll(query); }
  @Post() create(@Body() dto: CreateGeoContentTopicDto) { return this.service.create(dto); }
  @Get(":id") findById(@Param("id") id: string) { return this.service.findById(id); }
  @Patch(":id") update(@Param("id") id: string, @Body() dto: UpdateGeoContentTopicDto) { return this.service.update(id, dto); }
  @Patch(":id/status") updateStatus(@Param("id") id: string, @Body() dto: UpdateGeoContentTopicStatusDto) { return this.service.updateStatus(id, dto); }
  @Delete(":id") archive(@Param("id") id: string) { return this.service.archive(id); }
}
