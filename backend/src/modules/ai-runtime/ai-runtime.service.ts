import { Injectable } from '@nestjs/common';
import { Customer360Service } from '../cor/services/customer-360.service';
import { TimelineService } from '../cor/services/timeline.service';
import { SnapshotService } from '../cor/services/snapshot.service';
import { NextActionService } from '../cmem/services/next-action.service';
import { ExecutionEngineService } from '../art/services/execution-engine.service';
import { ApprovalCenterService } from '../approval-center/services/approval-center.service';
import { TakeoverCenterService } from '../takeover-center/services/takeover-center.service';
import { RollbackCenterService } from '../rollback-center/services/rollback-center.service';
import { TimelineQueryDto } from '../cor/dto/timeline-query.dto';
import { NextActionQueryDto } from '../cmem/dto/next-action.dto';

@Injectable()
export class AiRuntimeService {
  constructor(
    private readonly customer360Service: Customer360Service,
    private readonly timelineService: TimelineService,
    private readonly snapshotService: SnapshotService,
    private readonly nextActionService: NextActionService,
    private readonly executionEngine: ExecutionEngineService,
    private readonly approvalCenter: ApprovalCenterService,
    private readonly takeoverCenter: TakeoverCenterService,
    private readonly rollbackCenter: RollbackCenterService,
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
    return this.executionEngine.execute(agentCode, input, orgId, userId, customerId);
  }

  async getPendingApprovals(orgId: string) {
    return this.approvalCenter.listPending(orgId);
  }

  async approveRequest(id: string, orgId: string, userId: string) {
    return this.approvalCenter.approve(id, orgId, userId);
  }

  async rejectRequest(id: string, orgId: string, userId: string, reason?: string) {
    return this.approvalCenter.reject(id, orgId, userId, reason);
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
}
