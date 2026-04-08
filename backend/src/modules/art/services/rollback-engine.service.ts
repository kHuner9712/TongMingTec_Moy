import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiRollback } from '../entities/ai-rollback.entity';
import { AiAgentRun, AgentRunStatus } from '../entities/ai-agent-run.entity';

@Injectable()
export class RollbackEngineService {
  constructor(
    @InjectRepository(AiRollback)
    private readonly rollbackRepo: Repository<AiRollback>,
    @InjectRepository(AiAgentRun)
    private readonly runRepo: Repository<AiAgentRun>,
  ) {}

  async rollback(agentRunId: string, orgId: string, userId: string): Promise<AiRollback> {
    const run = await this.runRepo.findOne({ where: { id: agentRunId, orgId } });
    if (!run) throw new NotFoundException('RESOURCE_NOT_FOUND');

    const rollback = this.rollbackRepo.create({
      orgId,
      agentRunId,
      customerId: run.customerId,
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

  async getRollbackRecords(orgId: string, filters?: { agentRunId?: string }): Promise<AiRollback[]> {
    const qb = this.rollbackRepo.createQueryBuilder('rb').where('rb.orgId = :orgId', { orgId });
    if (filters?.agentRunId) qb.andWhere('rb.agentRunId = :agentRunId', { agentRunId: filters.agentRunId });
    qb.orderBy('rb.rolledBackAt', 'DESC');
    return qb.getMany();
  }
}
