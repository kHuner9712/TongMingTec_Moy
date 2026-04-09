import { Controller, Get, Post, Param, Query, Body } from "@nestjs/common";
import { ApprovalCenterService } from "./services/approval-center.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApprovalQueryDto, ApprovalRejectDto } from "./dto/approval-query.dto";

@Controller("approval-center")
export class ApprovalCenterController {
  constructor(private readonly approvalCenterService: ApprovalCenterService) {}

  @Get("pending")
  @Permissions("approval:read")
  async listPending(@CurrentUser("orgId") orgId: string) {
    const data = await this.approvalCenterService.listPending(orgId);
    return { code: "OK", data };
  }

  @Get("stats")
  @Permissions("approval:read")
  async getStats(@CurrentUser("orgId") orgId: string) {
    const data = await this.approvalCenterService.getApprovalStats(orgId);
    return { code: "OK", data };
  }

  @Get("count")
  @Permissions("approval:read")
  async getPendingCount(@CurrentUser("orgId") orgId: string) {
    const count = await this.approvalCenterService.getPendingCount(orgId);
    return { code: "OK", data: { count } };
  }

  @Get()
  @Permissions("approval:read")
  async listAll(
    @CurrentUser("orgId") orgId: string,
    @Query() query: ApprovalQueryDto,
  ) {
    const data = await this.approvalCenterService.listAll(orgId, {
      status: query.status,
    });
    return { code: "OK", data };
  }

  @Post(":id/approve")
  @Permissions("approval:approve")
  async approve(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() body: { version: number },
  ) {
    const data = await this.approvalCenterService.approve(
      id,
      orgId,
      userId,
      body.version,
    );
    return { code: "OK", data };
  }

  @Post(":id/reject")
  @Permissions("approval:reject")
  async reject(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: ApprovalRejectDto,
  ) {
    const data = await this.approvalCenterService.reject(
      id,
      orgId,
      userId,
      dto.reason,
      dto.version,
    );
    return { code: "OK", data };
  }
}
