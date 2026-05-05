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
import { GeoBrandAssetsService } from "./geo-brand-assets.service";
import { CreateGeoBrandAssetDto } from "./dto/create-geo-brand-asset.dto";
import { UpdateGeoBrandAssetDto } from "./dto/update-geo-brand-asset.dto";
import { QueryGeoBrandAssetsDto } from "./dto/query-geo-brand-assets.dto";
import { UpdateGeoBrandAssetStatusDto } from "./dto/update-geo-brand-asset-status.dto";

@Controller("api/v1/geo-brand-assets")
export class GeoBrandAssetsController {
  constructor(private readonly service: GeoBrandAssetsService) {}

  @Get()
  async findAll(@Query() query: QueryGeoBrandAssetsDto) {
    return this.service.findAll(query);
  }

  @Post()
  async create(@Body() dto: CreateGeoBrandAssetDto) {
    return this.service.create(dto);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateGeoBrandAssetDto) {
    return this.service.update(id, dto);
  }

  @Patch(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateGeoBrandAssetStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(":id")
  async archive(@Param("id") id: string) {
    return this.service.archive(id);
  }
}
