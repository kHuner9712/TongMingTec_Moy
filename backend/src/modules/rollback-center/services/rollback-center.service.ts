import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiRollback } from '../../art/entities/ai-rollback.entity';
import { AiAgentRun, AgentRunStatus } from '../../art/entities/ai-agent-run.entity';

@Injectable()
export class RollbackCenterService {
  constructor(
    @InjectRepository(AiRollback)
    private readonly rollbackRepo: Repository<AiRollback>,
    @InjectRepository(AiAgentRun)
    private readonly runRepo: Repository<AiAgentRun>,
  ) {}

  async getRollbackStats(orgId: string): Promise<{
    total: number;
    succeeded: number;
    failed: number;
  }> {
    const total = await this.rollbackRepo.count({ where: { orgId } });
    const succeeded = await this.rollbackRepo.count({
      where: { orgId, result: 'succeeded' },
    });
    const failed = await this.rollbackRepo.count({
      where: { orgId, result: 'failed' },
    });

    return { total, succeeded, failed };
  }

  async rollback(
    agentRunId: string,
    orgId: string,
    userId: string,
  ): Promise<AiRollback> {
    const run = await this.runRepo.findOne({ where: { id: agentRunId, orgId } });
    if (!run) throw new NotFoundException('RESOURCE_NOT_FOUND');

    const rollback = this.rollbackRepo.create({
      orgId,
      agentRunId,
      resourceType: (run.outputPayload?.resourceType as string) || 'unknown',
      resourceId: (run.outputPayload?.resourceId as string) || null,
      rollbackScope: { agentRunId, executionMode: run.executionMode },
      beforeSnapshot: run.inputPayload,
      result: 'succeeded',
      rolledBackBy: userId,
      rolledBackAt: new Date(),
      createdBy: userId,
    });
    const savedRollback = await this.rollbackRepo.save(rollback);

    await this.runRepo.update(agentRunId, {
      status: AgentRunStatus.ROLLED_BACK,
    });

    return savedRollback;
  }

  async getRollbackRecords(
    orgId: string,
    filters?: { agentRunId?: string },
  ): Promise<AiRollback[]> {
    const qb = this.rollbackRepo
      .createQueryBuilder('rb')
      .where('rb.org_id = :orgId', { orgId });

    if (filters?.agentRunId) {
      qb.andWhere('rb.agent_run_id = :agentRunId', {
        agentRunId: filters.agentRunId,
      });
    }

    qb.orderBy('rb.rolled_back_at', 'DESC');
    return qb.getMany();
  }
}
