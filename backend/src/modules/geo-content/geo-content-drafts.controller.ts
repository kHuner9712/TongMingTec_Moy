import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from "@nestjs/common";
import { GeoContentDraftsService } from "./geo-content-drafts.service";
import { CreateGeoContentDraftDto } from "./dto/create-geo-content-draft.dto";
import { UpdateGeoContentDraftDto } from "./dto/update-geo-content-draft.dto";
import { QueryGeoContentDraftsDto } from "./dto/query-geo-content-drafts.dto";
import { UpdateGeoContentDraftStatusDto } from "./dto/update-geo-content-draft-status.dto";

@Controller("api/v1/geo-content-drafts")
export class GeoContentDraftsController {
  constructor(private readonly service: GeoContentDraftsService) {}

  @Get() findAll(@Query() query: QueryGeoContentDraftsDto) { return this.service.findAll(query); }
  @Post() create(@Body() dto: CreateGeoContentDraftDto) { return this.service.create(dto); }
  @Get(":id") findById(@Param("id") id: string) { return this.service.findById(id); }
  @Patch(":id") update(@Param("id") id: string, @Body() dto: UpdateGeoContentDraftDto) { return this.service.update(id, dto); }
  @Patch(":id/status") updateStatus(@Param("id") id: string, @Body() dto: UpdateGeoContentDraftStatusDto) { return this.service.updateStatus(id, dto); }
  @Delete(":id") archive(@Param("id") id: string) { return this.service.archive(id); }
}
