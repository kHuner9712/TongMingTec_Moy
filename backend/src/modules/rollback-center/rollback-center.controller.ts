import { Controller, Get, Post, Param, Query } from "@nestjs/common";
import { RollbackCenterService } from "./services/rollback-center.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { RollbackQueryDto } from "./dto/rollback-query.dto";

@Controller("rollback-center")
export class RollbackCenterController {
  constructor(private readonly rollbackCenterService: RollbackCenterService) {}

  @Get("stats")
  @Permissions("rollback:read")
  async getStats(@CurrentUser("orgId") orgId: string) {
    const data = await this.rollbackCenterService.getRollbackStats(orgId);
    return { code: "OK", data };
  }

  @Get("history")
  @Permissions("rollback:read")
  async getHistory(
    @CurrentUser("orgId") orgId: string,
    @Query() query: RollbackQueryDto,
  ) {
    const data = await this.rollbackCenterService.getRollbackRecords(orgId, {
      agentRunId: query.agentRunId,
    });
    return { code: "OK", data };
  }

  @Post(":id/execute")
  @Permissions("rollback:execute")
  async execute(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
  ) {
    const data = await this.rollbackCenterService.rollback(id, orgId, userId);
    return { code: "OK", data };
  }
}
