import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
} from "@nestjs/common";
import { GeoLeadsService } from "./geo-leads.service";
import { QueryGeoLeadsDto } from "./dto/query-geo-leads.dto";
import { UpdateGeoLeadStatusDto } from "./dto/update-geo-lead-status.dto";

@Controller("api/v1/geo-leads")
export class GeoLeadsAdminController {
  constructor(private readonly service: GeoLeadsService) {}

  @Get()
  async findAll(@Query() query: QueryGeoLeadsDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Patch(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateGeoLeadStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
