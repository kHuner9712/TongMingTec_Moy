import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AiTakeover } from '../../art/entities/ai-takeover.entity';
import { AiAgentRun, AgentRunStatus } from '../../art/entities/ai-agent-run.entity';

@Injectable()
export class TakeoverCenterService {
  constructor(
    @InjectRepository(AiTakeover)
    private readonly takeoverRepo: Repository<AiTakeover>,
    @InjectRepository(AiAgentRun)
    private readonly runRepo: Repository<AiAgentRun>,
  ) {}

  async getActiveTakeovers(orgId: string): Promise<AiTakeover[]> {
    const activeRuns = await this.runRepo.find({
      where: { orgId, status: AgentRunStatus.TAKEN_OVER },
      select: ['id'],
    });

    if (activeRuns.length === 0) return [];

    const activeRunIds = activeRuns.map((r) => r.id);
    return this.takeoverRepo.find({
      where: { orgId, agentRunId: In(activeRunIds) },
      order: { takeoverAt: 'DESC' },
    });
  }

  async getTakeoverStats(orgId: string): Promise<{
    total: number;
    active: number;
    resolved: number;
  }> {
    const total = await this.takeoverRepo.count({ where: { orgId } });

    const activeRuns = await this.runRepo.count({
      where: { orgId, status: AgentRunStatus.TAKEN_OVER },
    });

    return {
      total,
      active: activeRuns,
      resolved: total - activeRuns,
    };
  }

  async takeover(
    agentRunId: string,
    orgId: string,
    userId: string,
    reason: string,
  ): Promise<AiTakeover> {
    const run = await this.runRepo.findOne({ where: { id: agentRunId, orgId } });
    if (!run) throw new NotFoundException('RESOURCE_NOT_FOUND');

    const takeover = this.takeoverRepo.create({
      orgId,
      agentRunId,
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

  async resolve(
    id: string,
    orgId: string,
    userId: string,
    resolution: string,
  ): Promise<AiTakeover> {
    const takeover = await this.takeoverRepo.findOne({ where: { id, orgId } });
    if (!takeover) throw new NotFoundException('RESOURCE_NOT_FOUND');

    const run = await this.runRepo.findOne({
      where: { id: takeover.agentRunId, orgId },
    });
    if (run && run.status === AgentRunStatus.TAKEN_OVER) {
      await this.runRepo.update(takeover.agentRunId, {
        status: AgentRunStatus.SUCCEEDED,
        errorMessage: resolution,
      });
    }

    return takeover;
  }

  async getTakeoverRecords(
    orgId: string,
    filters?: { agentRunId?: string },
  ): Promise<AiTakeover[]> {
    const qb = this.takeoverRepo
      .createQueryBuilder('to')
      .where('to.org_id = :orgId', { orgId });

    if (filters?.agentRunId) {
      qb.andWhere('to.agent_run_id = :agentRunId', {
        agentRunId: filters.agentRunId,
      });
    }

    qb.orderBy('to.takeover_at', 'DESC');
    return qb.getMany();
  }
}
