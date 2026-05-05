import { Controller, Post, Body, HttpCode } from "@nestjs/common";
import { GeoLeadsService } from "./geo-leads.service";
import { CreateGeoLeadDto } from "./dto/create-geo-lead.dto";
import { Public } from "../../common/decorators/public.decorator";

@Public()
@Controller("api/geo/leads")
export class GeoLeadsController {
  constructor(private readonly service: GeoLeadsService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateGeoLeadDto) {
    const lead = await this.service.create(dto);

    return {
      id: lead.id,
      status: lead.status,
      message:
        lead.id === "geo_lead_ignored"
          ? "诊断申请已收到"
          : "诊断申请已收到，我们将在 1 个工作日内联系你。",
    };
  }
}
