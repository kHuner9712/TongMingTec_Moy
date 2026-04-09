import { Injectable } from "@nestjs/common";
import { ApprovalCenterService } from "../../approval-center/services/approval-center.service";
import { AiApprovalRequest } from "../entities/ai-approval-request.entity";

@Injectable()
export class ApprovalEngineService {
  constructor(private readonly approvalCenterService: ApprovalCenterService) {}

  async createApprovalRequest(
    agentRunId: string,
    orgId: string,
    data: {
      resourceType: string;
      resourceId: string | null;
      requestedAction: string;
      riskLevel: string;
      beforeSnapshot: Record<string, unknown> | null;
      proposedAfterSnapshot: Record<string, unknown> | null;
      explanation: string;
      customerId?: string;
    },
  ): Promise<AiApprovalRequest> {
    return this.approvalCenterService.createApprovalRequest(
      agentRunId,
      orgId,
      data,
    );
  }

  async approve(
    id: string,
    orgId: string,
    userId: string,
    version: number,
  ): Promise<AiApprovalRequest> {
    return this.approvalCenterService.approve(id, orgId, userId, version);
  }

  async reject(
    id: string,
    orgId: string,
    userId: string,
    reason: string | undefined,
    version: number,
  ): Promise<AiApprovalRequest> {
    return this.approvalCenterService.reject(id, orgId, userId, reason, version);
  }

  async checkExpired(): Promise<number> {
    return this.approvalCenterService.checkExpired();
  }

  async listPending(orgId: string): Promise<AiApprovalRequest[]> {
    return this.approvalCenterService.listPending(orgId);
  }

  async listAll(
    orgId: string,
    filters?: { status?: string },
  ): Promise<AiApprovalRequest[]> {
    return this.approvalCenterService.listAll(orgId, filters);
  }
}
