import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiTakeover } from '../entities/ai-takeover.entity';
import { AiAgentRun, AgentRunStatus } from '../entities/ai-agent-run.entity';

@Injectable()
export class TakeoverEngineService {
  constructor(
    @InjectRepository(AiTakeover)
    private readonly takeoverRepo: Repository<AiTakeover>,
    @InjectRepository(AiAgentRun)
    private readonly runRepo: Repository<AiAgentRun>,
  ) {}

  async takeover(agentRunId: string, orgId: string, userId: string, reason: string): Promise<AiTakeover> {
    const run = await this.runRepo.findOne({ where: { id: agentRunId, orgId } });
    if (!run) throw new NotFoundException('RESOURCE_NOT_FOUND');

    const takeover = this.takeoverRepo.create({
      orgId,
      agentRunId,
      customerId: run.customerId,
      resourceType: (run.outputPayload?.resourceType as string) || 'unknown',
      resourceId: (run.outputPayload?.resourceId as string) || null,
      takeoverUserId: userId,
      reason,
      takeoverAt: new Date(),
      createdBy: userId,
    });
    const savedTakeover = await this.takeoverRepo.save(takeover);

    await this.runRepo.update(agentRunId, {
      status: AgentRunStatus.TAKEN_OVER,
    });

    return savedTakeover;
  }

  async getTakeoverRecords(orgId: string, filters?: { agentRunId?: string }): Promise<AiTakeover[]> {
    const qb = this.takeoverRepo.createQueryBuilder('to').where('to.orgId = :orgId', { orgId });
    if (filters?.agentRunId) qb.andWhere('to.agentRunId = :agentRunId', { agentRunId: filters.agentRunId });
    qb.orderBy('to.takeoverAt', 'DESC');
    return qb.getMany();
  }
}
