import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Customer360Service } from "../cor/services/customer-360.service";
import { TimelineService } from "../cor/services/timeline.service";
import { SnapshotService } from "../cor/services/snapshot.service";
import { NextActionService } from "../cmem/services/next-action.service";
import { RiskService } from "../cmem/services/risk.service";
import { ExecutionEngineService } from "../art/services/execution-engine.service";
import { ApprovalCenterService } from "../approval-center/services/approval-center.service";
import { TakeoverCenterService } from "../takeover-center/services/takeover-center.service";
import { RollbackCenterService } from "../rollback-center/services/rollback-center.service";
import { TimelineQueryDto } from "../cor/dto/timeline-query.dto";
import { NextActionQueryDto } from "../cmem/dto/next-action.dto";
import { Customer } from "../cm/entities/customer.entity";
import { AiAgentRun } from "../art/entities/ai-agent-run.entity";

@Injectable()
export class AiRuntimeService {
  constructor(
    private readonly customer360Service: Customer360Service,
    private readonly timelineService: TimelineService,
    private readonly snapshotService: SnapshotService,
    private readonly nextActionService: NextActionService,
    private readonly riskService: RiskService,
    private readonly executionEngine: ExecutionEngineService,
    private readonly approvalCenter: ApprovalCenterService,
    private readonly takeoverCenter: TakeoverCenterService,
    private readonly rollbackCenter: RollbackCenterService,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async getCustomer360Runtime(customerId: string, orgId: string) {
    const [view360, agentRuns] = await Promise.all([
      this.customer360Service.getCustomer360(customerId, orgId),
      this.executionEngine.listRuns(orgId, { customerId }),
    ]);

    return {
      ...view360,
      agentRuns,
    };
  }

  async getCustomerTimeline(
    customerId: string,
    orgId: string,
    query: TimelineQueryDto,
  ) {
    return this.timelineService.getTimeline(customerId, orgId, query);
  }

  async getNextActions(
    customerId: string,
    orgId: string,
    query?: NextActionQueryDto,
  ) {
    return this.nextActionService.getNextActions(customerId, orgId, query);
  }

  async getAgentRuns(
    orgId: string,
    filters?: { agentId?: string; status?: string; customerId?: string },
  ) {
    return this.executionEngine.listRuns(orgId, filters);
  }

  async getAgentRun(id: string, orgId: string) {
    return this.executionEngine.getRun(id, orgId);
  }

  async executeAgent(
    agentCode: string,
    input: Record<string, unknown>,
    orgId: string,
    userId: string,
    customerId?: string,
  ) {
    return this.executionEngine.execute(
      agentCode,
      input,
      orgId,
      userId,
      customerId,
    );
  }

  async getPendingApprovals(orgId: string) {
    return this.approvalCenter.listPending(orgId);
  }

  async approveRequest(
    id: string,
    orgId: string,
    userId: string,
    version: number,
  ) {
    return this.approvalCenter.approve(id, orgId, userId, version);
  }

  async rejectRequest(
    id: string,
    orgId: string,
    userId: string,
    reason: string | undefined,
    version: number,
  ) {
    return this.approvalCenter.reject(id, orgId, userId, reason, version);
  }

  async executeTakeover(
    agentRunId: string,
    orgId: string,
    userId: string,
    reason: string,
  ) {
    return this.takeoverCenter.takeover(agentRunId, orgId, userId, reason);
  }

  async executeRollback(agentRunId: string, orgId: string, userId: string) {
    return this.rollbackCenter.rollback(agentRunId, orgId, userId);
  }

  async getCustomerSnapshots(
    customerId: string,
    orgId: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    return this.snapshotService.getSnapshots(customerId, orgId, page, pageSize);
  }

  async getCockpitData(orgId: string) {
    const [customers, recentRuns, pendingApprovals, risks] = await Promise.all([
      this.customerRepo.find({ where: { orgId } as any }),
      this.executionEngine.listRuns(orgId, {}),
      this.approvalCenter.listPending(orgId),
      this.riskService.getRisksByOrg(orgId).catch(() => []),
    ]);

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(
      (c) => c.status === "active",
    ).length;

    const aiInsights = risks
      .filter((r: any) => r.riskLevel === "high" || r.riskLevel === "critical")
      .slice(0, 5)
      .map((r: any) => ({
        id: r.id,
        type: "risk_alert" as const,
        title: r.reason || "高风险客户",
        description: `客户 ${r.customerId?.substring(0, 8) || ""} 存在高风险`,
        severity: "error" as const,
        relatedType: "customer",
        relatedId: r.customerId,
      }));

    const riskSignals = risks.slice(0, 10).map((r: any) => ({
      id: r.id,
      type:
        r.riskLevel === "high" || r.riskLevel === "critical"
          ? ("risk_alert" as const)
          : ("followup_reminder" as const),
      title: r.reason || "风险信号",
      description: `风险等级: ${r.riskLevel}`,
      severity: (r.riskLevel === "high" || r.riskLevel === "critical"
        ? "error"
        : r.riskLevel === "medium"
          ? "warning"
          : "info") as "error" | "warning" | "info",
      relatedType: "customer",
      relatedId: r.customerId,
    }));

    const recommendedTodos = pendingApprovals.slice(0, 5).map((a: any) => ({
      id: a.id,
      title: `审批请求: ${a.requestedAction || "待审批操作"}`,
      description: a.explanation || "",
      actionType: "approval",
      relatedId: a.id,
      relatedType: "approval",
      priority: 1,
    }));

    return {
      aiInsights,
      riskSignals,
      keyMetrics: {
        totalCustomers,
        activeCustomers,
        pendingFollowups: pendingApprovals.length,
      },
      recentAgentRuns: Array.isArray(recentRuns)
        ? recentRuns
        : (recentRuns as any)?.items || [],
      recommendedTodos,
    };
  }
}
