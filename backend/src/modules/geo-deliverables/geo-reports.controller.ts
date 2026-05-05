import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from "@nestjs/common";
import { GeoReportsService } from "./geo-reports.service";
import { CreateGeoReportDto } from "./dto/create-geo-report.dto";
import { UpdateGeoReportDto } from "./dto/update-geo-report.dto";
import { QueryGeoReportsDto } from "./dto/query-geo-reports.dto";
import { UpdateGeoReportStatusDto } from "./dto/update-geo-report-status.dto";

@Controller("api/v1/geo-reports")
export class GeoReportsController {
  constructor(private readonly service: GeoReportsService) {}

  @Get()
  async findAll(@Query() query: QueryGeoReportsDto) {
    return this.service.findAll(query);
  }

  @Post()
  async create(@Body() dto: CreateGeoReportDto) {
    return this.service.create(dto);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateGeoReportDto) {
    return this.service.update(id, dto);
  }

  @Patch(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateGeoReportStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(":id")
  async archive(@Param("id") id: string) {
    return this.service.archive(id);
  }
}
