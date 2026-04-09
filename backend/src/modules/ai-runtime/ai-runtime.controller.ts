import { Controller, Get, Post, Param, Body, Query } from "@nestjs/common";
import { AiRuntimeService } from "./ai-runtime.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ExecuteAgentRuntimeDto } from "./dto/execute-agent-runtime.dto";
import {
  CustomerRuntimeQueryDto,
  AgentRunQueryDto,
} from "./dto/customer-runtime-query.dto";
import { TakeoverRuntimeDto } from "./dto/takeover-runtime.dto";
import { RollbackRuntimeDto } from "./dto/rollback-runtime.dto";
import { TimelineQueryDto } from "../cor/dto/timeline-query.dto";
import { NextActionQueryDto } from "../cmem/dto/next-action.dto";

@Controller("ai-runtime")
export class AiRuntimeController {
  constructor(private readonly aiRuntimeService: AiRuntimeService) {}

  @Get("cockpit")
  @Permissions("PERM-CM-VIEW")
  async getCockpitData(@CurrentUser("orgId") orgId: string) {
    const data = await this.aiRuntimeService.getCockpitData(orgId);
    return { code: "OK", data };
  }

  @Get("customers/:id/360")
  @Permissions("PERM-CM-VIEW")
  async getCustomer360Runtime(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    const data = await this.aiRuntimeService.getCustomer360Runtime(id, orgId);
    return { code: "OK", data };
  }

  @Get("customers/:id/timeline")
  @Permissions("PERM-CM-VIEW")
  async getCustomerTimeline(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @Query() query: TimelineQueryDto,
  ) {
    const data = await this.aiRuntimeService.getCustomerTimeline(
      id,
      orgId,
      query,
    );
    return { code: "OK", data };
  }

  @Get("customers/:id/next-actions")
  @Permissions("PERM-CM-VIEW")
  async getNextActions(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @Query() query: NextActionQueryDto,
  ) {
    const data = await this.aiRuntimeService.getNextActions(id, orgId, query);
    return { code: "OK", data };
  }

  @Get("customers/:id/snapshots")
  @Permissions("PERM-CM-VIEW")
  async getCustomerSnapshots(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @Query() query: CustomerRuntimeQueryDto,
  ) {
    const data = await this.aiRuntimeService.getCustomerSnapshots(
      id,
      orgId,
      query.page,
      query.pageSize,
    );
    return { code: "OK", data };
  }

  @Get("agent-runs")
  @Permissions("PERM-AI-EXECUTE")
  async getAgentRuns(
    @CurrentUser("orgId") orgId: string,
    @Query() query: AgentRunQueryDto,
  ) {
    const data = await this.aiRuntimeService.getAgentRuns(orgId, {
      agentId: query.agentId,
      status: query.status,
      customerId: query.customerId,
    });
    return { code: "OK", data };
  }

  @Get("agent-runs/:id")
  @Permissions("PERM-AI-EXECUTE")
  async getAgentRun(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    const data = await this.aiRuntimeService.getAgentRun(id, orgId);
    return { code: "OK", data };
  }

  @Post("agent-runs")
  @Permissions("PERM-AI-EXECUTE")
  async executeAgent(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: ExecuteAgentRuntimeDto,
  ) {
    const data = await this.aiRuntimeService.executeAgent(
      dto.agentCode,
      dto.input,
      orgId,
      userId,
      dto.customerId,
    );
    return { code: "OK", data };
  }

  @Get("approvals/pending")
  @Permissions("PERM-AI-APPROVE")
  async getPendingApprovals(@CurrentUser("orgId") orgId: string) {
    const data = await this.aiRuntimeService.getPendingApprovals(orgId);
    return { code: "OK", data };
  }

  @Post("approvals/:id/approve")
  @Permissions("PERM-AI-APPROVE")
  async approveRequest(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() body: { version: number },
  ) {
    const data = await this.aiRuntimeService.approveRequest(
      id,
      orgId,
      userId,
      body.version,
    );
    return { code: "OK", data };
  }

  @Post("approvals/:id/reject")
  @Permissions("PERM-AI-APPROVE")
  async rejectRequest(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: { reason?: string; version: number },
  ) {
    const data = await this.aiRuntimeService.rejectRequest(
      id,
      orgId,
      userId,
      dto.reason,
      dto.version,
    );
    return { code: "OK", data };
  }

  @Post("takeovers")
  @Permissions("PERM-AI-TAKEOVER")
  async executeTakeover(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: TakeoverRuntimeDto,
  ) {
    const data = await this.aiRuntimeService.executeTakeover(
      dto.agentRunId,
      orgId,
      userId,
      dto.reason,
    );
    return { code: "OK", data };
  }

  @Post("rollbacks")
  @Permissions("PERM-AI-ROLLBACK")
  async executeRollback(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: RollbackRuntimeDto,
  ) {
    const data = await this.aiRuntimeService.executeRollback(
      dto.agentRunId,
      orgId,
      userId,
    );
    return { code: "OK", data };
  }
}
