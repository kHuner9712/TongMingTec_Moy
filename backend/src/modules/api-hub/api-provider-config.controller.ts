import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ApiProviderConfigService } from "./api-provider-config.service";
import { CreateProviderConfigDto, UpdateProviderConfigDto } from "./dto/api-provider-config.dto";

@Controller("api-hub/provider-configs")
@UseGuards(JwtAuthGuard)
export class ApiProviderConfigController {
  constructor(private readonly service: ApiProviderConfigService) {}

  @Post()
  async create(@Body() dto: CreateProviderConfigDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(":provider")
  async findByProvider(@Param("provider") provider: string) {
    return this.service.findByProvider(provider);
  }

  @Patch(":provider")
  async update(@Param("provider") provider: string, @Body() dto: UpdateProviderConfigDto) {
    return this.service.update(provider, dto);
  }

  @Delete(":provider")
  async remove(@Param("provider") provider: string) {
    return this.service.remove(provider);
  }
}
