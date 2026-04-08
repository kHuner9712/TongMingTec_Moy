import { Controller, Get, Post, Param, Query, Body } from "@nestjs/common";
import { TakeoverCenterService } from "./services/takeover-center.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { TakeoverQueryDto, ResolveTakeoverDto } from "./dto/takeover-query.dto";

@Controller("takeover-center")
export class TakeoverCenterController {
  constructor(private readonly takeoverCenterService: TakeoverCenterService) {}

  @Get("active")
  @Permissions("takeover:read")
  async getActiveTakeovers(@CurrentUser("orgId") orgId: string) {
    const data = await this.takeoverCenterService.getActiveTakeovers(orgId);
    return { code: "OK", data };
  }

  @Get("stats")
  @Permissions("takeover:read")
  async getStats(@CurrentUser("orgId") orgId: string) {
    const data = await this.takeoverCenterService.getTakeoverStats(orgId);
    return { code: "OK", data };
  }

  @Get()
  @Permissions("takeover:read")
  async getTakeoverRecords(
    @CurrentUser("orgId") orgId: string,
    @Query() query: TakeoverQueryDto,
  ) {
    const data = await this.takeoverCenterService.getTakeoverRecords(orgId, {
      agentRunId: query.agentRunId,
    });
    return { code: "OK", data };
  }

  @Post(":id/resolve")
  @Permissions("takeover:resolve")
  async resolve(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: ResolveTakeoverDto,
  ) {
    const data = await this.takeoverCenterService.resolve(
      id,
      orgId,
      userId,
      dto.resolution,
    );
    return { code: "OK", data };
  }
}
