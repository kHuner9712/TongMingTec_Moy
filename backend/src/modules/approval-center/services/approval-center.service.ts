import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import {
  AiApprovalRequest,
  ApprovalStatus,
} from "../../art/entities/ai-approval-request.entity";
import {
  AiAgentRun,
  AgentRunStatus,
} from "../../art/entities/ai-agent-run.entity";
import { approvalRequestStateMachine } from "../../../common/statemachine/definitions/approval-request.sm";
import { EventBusService } from "../../../common/events/event-bus.service";
import { approvalStatusChanged } from "../../../common/events/approval-events";

@Injectable()
export class ApprovalCenterService {
  constructor(
    @InjectRepository(AiApprovalRequest)
    private readonly approvalRepo: Repository<AiApprovalRequest>,
    @InjectRepository(AiAgentRun)
    private readonly runRepo: Repository<AiAgentRun>,
    private readonly eventBus: EventBusService,
  ) {}

  async getPendingCount(orgId: string): Promise<number> {
    return this.approvalRepo.count({
      where: { orgId, status: ApprovalStatus.PENDING },
    });
  }

  async getApprovalStats(orgId: string): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
  }> {
    const [pending, approved, rejected, expired] = await Promise.all([
      this.approvalRepo.count({
        where: { orgId, status: ApprovalStatus.PENDING },
      }),
      this.approvalRepo.count({
        where: { orgId, status: ApprovalStatus.APPROVED },
      }),
      this.approvalRepo.count({
        where: { orgId, status: ApprovalStatus.REJECTED },
      }),
      this.approvalRepo.count({
        where: { orgId, status: ApprovalStatus.EXPIRED },
      }),
    ]);

    return { pending, approved, rejected, expired };
  }

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
    const request = this.approvalRepo.create({
      orgId,
      agentRunId,
      customerId: data.customerId || null,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      requestedAction: data.requestedAction,
      riskLevel: data.riskLevel,
      beforeSnapshot: data.beforeSnapshot,
      proposedAfterSnapshot: data.proposedAfterSnapshot,
      explanation: data.explanation,
      status: ApprovalStatus.PENDING,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    return this.approvalRepo.save(request);
  }

  async createBusinessApprovalRequest(
    orgId: string,
    data: {
      resourceType: string;
      resourceId: string;
      requestedAction: string;
      beforeSnapshot: Record<string, unknown> | null;
      proposedAfterSnapshot: Record<string, unknown> | null;
      explanation: string;
      customerId?: string;
    },
  ): Promise<AiApprovalRequest> {
    const request = this.approvalRepo.create({
      orgId,
      agentRunId: null,
      customerId: data.customerId || null,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      requestedAction: data.requestedAction,
      riskLevel: "high",
      beforeSnapshot: data.beforeSnapshot,
      proposedAfterSnapshot: data.proposedAfterSnapshot,
      explanation: data.explanation,
      status: ApprovalStatus.PENDING,
      source: "business",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    return this.approvalRepo.save(request);
  }

  async listPending(orgId: string): Promise<AiApprovalRequest[]> {
    return this.approvalRepo.find({
      where: { orgId, status: ApprovalStatus.PENDING },
      order: { createdAt: "DESC" },
    });
  }

  async listAll(
    orgId: string,
    filters?: { status?: string },
  ): Promise<AiApprovalRequest[]> {
    const qb = this.approvalRepo
      .createQueryBuilder("req")
      .where("req.orgId = :orgId", { orgId });
    if (filters?.status)
      qb.andWhere("req.status = :status", { status: filters.status });
    qb.orderBy("req.createdAt", "DESC");
    return qb.getMany();
  }

  async approve(
    id: string,
    orgId: string,
    userId: string,
    version: number,
  ): Promise<AiApprovalRequest> {
    const request = await this.findById(id, orgId);

    if (request.version !== version) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const fromStatus = request.status;
    approvalRequestStateMachine.validateTransition(
      fromStatus,
      ApprovalStatus.APPROVED,
    );

    const result = await this.approvalRepo
      .createQueryBuilder()
      .update(AiApprovalRequest)
      .set({
        status: ApprovalStatus.APPROVED,
        approverUserId: userId,
        approvedAt: new Date(),
        version: () => "version + 1",
      })
      .where("id = :id AND version = :version", { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    if (request.agentRunId) {
      await this.runRepo.update(request.agentRunId, {
        status: AgentRunStatus.SUCCEEDED,
      });
    }

    this.eventBus.publish(
      approvalStatusChanged({
        orgId,
        approvalId: id,
        fromStatus,
        toStatus: ApprovalStatus.APPROVED,
        actorType: "user",
        actorId: userId,
        resourceType: request.resourceType,
        resourceId: request.resourceId || undefined,
        requestedAction: request.requestedAction,
      }),
    );

    return this.findById(id, orgId);
  }

  async reject(
    id: string,
    orgId: string,
    userId: string,
    reason: string | undefined,
    version: number,
  ): Promise<AiApprovalRequest> {
    const request = await this.findById(id, orgId);

    if (request.version !== version) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const fromStatus = request.status;
    approvalRequestStateMachine.validateTransition(
      fromStatus,
      ApprovalStatus.REJECTED,
    );

    const result = await this.approvalRepo
      .createQueryBuilder()
      .update(AiApprovalRequest)
      .set({
        status: ApprovalStatus.REJECTED,
        approverUserId: userId,
        approvedAt: new Date(),
        version: () => "version + 1",
      })
      .where("id = :id AND version = :version", { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    if (request.agentRunId) {
      await this.runRepo.update(request.agentRunId, {
        status: AgentRunStatus.FAILED,
        errorMessage: reason || "Approval rejected",
      });
    }

    this.eventBus.publish(
      approvalStatusChanged({
        orgId,
        approvalId: id,
        fromStatus,
        toStatus: ApprovalStatus.REJECTED,
        actorType: "user",
        actorId: userId,
        reason,
        resourceType: request.resourceType,
        resourceId: request.resourceId || undefined,
        requestedAction: request.requestedAction,
      }),
    );

    return this.findById(id, orgId);
  }

  async cancel(
    id: string,
    orgId: string,
    userId: string,
    version: number,
  ): Promise<AiApprovalRequest> {
    const request = await this.findById(id, orgId);

    if (request.version !== version) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    const fromStatus = request.status;
    approvalRequestStateMachine.validateTransition(
      fromStatus,
      ApprovalStatus.CANCELLED,
    );

    const result = await this.approvalRepo
      .createQueryBuilder()
      .update(AiApprovalRequest)
      .set({
        status: ApprovalStatus.CANCELLED,
        version: () => "version + 1",
      })
      .where("id = :id AND version = :version", { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    this.eventBus.publish(
      approvalStatusChanged({
        orgId,
        approvalId: id,
        fromStatus,
        toStatus: ApprovalStatus.CANCELLED,
        actorType: "user",
        actorId: userId,
      }),
    );

    return this.findById(id, orgId);
  }

  async checkExpired(): Promise<number> {
    const pendingRequests = await this.approvalRepo.find({
      where: {
        status: ApprovalStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
    });

    let count = 0;
    for (const req of pendingRequests) {
      try {
        approvalRequestStateMachine.validateTransition(
          req.status,
          ApprovalStatus.EXPIRED,
        );

        await this.approvalRepo
          .createQueryBuilder()
          .update(AiApprovalRequest)
          .set({
            status: ApprovalStatus.EXPIRED,
            version: () => "version + 1",
          })
          .where("id = :id AND version = :version", {
            id: req.id,
            version: req.version,
          })
          .execute();

        this.eventBus.publish(
          approvalStatusChanged({
            orgId: req.orgId,
            approvalId: req.id,
            fromStatus: req.status,
            toStatus: ApprovalStatus.EXPIRED,
            actorType: "system",
            actorId: "system",
          }),
        );

        count++;
      } catch {
        // 跳过已不是 pending 的记录
      }
    }

    return count;
  }

  private async findById(
    id: string,
    orgId: string,
  ): Promise<AiApprovalRequest> {
    const request = await this.approvalRepo.findOne({ where: { id, orgId } });
    if (!request) throw new NotFoundException("RESOURCE_NOT_FOUND");
    return request;
  }
}
