import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AiApprovalRequest, ApprovalStatus } from '../entities/ai-approval-request.entity';
import { AiAgentRun, AgentRunStatus } from '../entities/ai-agent-run.entity';

@Injectable()
export class ApprovalEngineService {
  constructor(
    @InjectRepository(AiApprovalRequest)
    private readonly approvalRepo: Repository<AiApprovalRequest>,
    @InjectRepository(AiAgentRun)
    private readonly runRepo: Repository<AiAgentRun>,
  ) {}

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

  async approve(id: string, orgId: string, userId: string): Promise<AiApprovalRequest> {
    const request = await this.approvalRepo.findOne({ where: { id, orgId } });
    if (!request) throw new NotFoundException('RESOURCE_NOT_FOUND');
    if (request.status !== ApprovalStatus.PENDING) {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    request.status = ApprovalStatus.APPROVED;
    request.approverUserId = userId;
    request.approvedAt = new Date();
    await this.approvalRepo.save(request);

    await this.runRepo.update(request.agentRunId, {
      status: AgentRunStatus.SUCCEEDED,
    });

    return request;
  }

  async reject(id: string, orgId: string, userId: string, reason?: string): Promise<AiApprovalRequest> {
    const request = await this.approvalRepo.findOne({ where: { id, orgId } });
    if (!request) throw new NotFoundException('RESOURCE_NOT_FOUND');
    if (request.status !== ApprovalStatus.PENDING) {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    request.status = ApprovalStatus.REJECTED;
    request.approverUserId = userId;
    request.approvedAt = new Date();
    await this.approvalRepo.save(request);

    await this.runRepo.update(request.agentRunId, {
      status: AgentRunStatus.FAILED,
      errorMessage: reason || 'Approval rejected',
    });

    return request;
  }

  async checkExpired(): Promise<number> {
    const result = await this.approvalRepo.update(
      {
        status: ApprovalStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
      { status: ApprovalStatus.EXPIRED },
    );
    return result.affected || 0;
  }

  async listPending(orgId: string): Promise<AiApprovalRequest[]> {
    return this.approvalRepo.find({
      where: { orgId, status: ApprovalStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async listAll(orgId: string, filters?: { status?: string }): Promise<AiApprovalRequest[]> {
    const qb = this.approvalRepo.createQueryBuilder('req').where('req.orgId = :orgId', { orgId });
    if (filters?.status) qb.andWhere('req.status = :status', { status: filters.status });
    qb.orderBy('req.createdAt', 'DESC');
    return qb.getMany();
  }
}
