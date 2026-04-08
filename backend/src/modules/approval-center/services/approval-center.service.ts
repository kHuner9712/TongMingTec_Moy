import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiApprovalRequest, ApprovalStatus } from '../../art/entities/ai-approval-request.entity';
import { AiAgentRun, AgentRunStatus } from '../../art/entities/ai-agent-run.entity';

@Injectable()
export class ApprovalCenterService {
  constructor(
    @InjectRepository(AiApprovalRequest)
    private readonly approvalRepo: Repository<AiApprovalRequest>,
    @InjectRepository(AiAgentRun)
    private readonly runRepo: Repository<AiAgentRun>,
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
      this.approvalRepo.count({ where: { orgId, status: ApprovalStatus.PENDING } }),
      this.approvalRepo.count({ where: { orgId, status: ApprovalStatus.APPROVED } }),
      this.approvalRepo.count({ where: { orgId, status: ApprovalStatus.REJECTED } }),
      this.approvalRepo.count({ where: { orgId, status: ApprovalStatus.EXPIRED } }),
    ]);

    return { pending, approved, rejected, expired };
  }

  async listPending(orgId: string): Promise<AiApprovalRequest[]> {
    return this.approvalRepo.find({
      where: { orgId, status: ApprovalStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async listAll(orgId: string, filters?: { status?: string }): Promise<AiApprovalRequest[]> {
    const qb = this.approvalRepo
      .createQueryBuilder('req')
      .where('req.org_id = :orgId', { orgId });

    if (filters?.status) {
      qb.andWhere('req.status = :status', { status: filters.status });
    }

    qb.orderBy('req.created_at', 'DESC');
    return qb.getMany();
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
}
