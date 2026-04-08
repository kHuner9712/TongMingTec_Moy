import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiAgent, AgentStatus } from '../entities/ai-agent.entity';
import { RegisterAgentDto } from '../dto/register-agent.dto';

@Injectable()
export class AgentRegistryService {
  constructor(
    @InjectRepository(AiAgent)
    private readonly agentRepo: Repository<AiAgent>,
  ) {}

  async register(orgId: string, dto: RegisterAgentDto): Promise<AiAgent> {
    const existing = await this.agentRepo.findOne({
      where: { code: dto.code, orgId },
    });
    if (existing) {
      throw new ConflictException('AGENT_CODE_ALREADY_EXISTS');
    }

    const agent = this.agentRepo.create({
      orgId,
      code: dto.code,
      name: dto.name,
      agentType: dto.agentType,
      executionMode: dto.executionMode as any,
      resourceScope: dto.resourceScope,
      toolScope: dto.toolScope,
      riskLevel: dto.riskLevel,
      inputSchema: dto.inputSchema,
      outputSchema: dto.outputSchema,
      requiresApproval: dto.requiresApproval || false,
      rollbackStrategy: dto.rollbackStrategy || null,
      takeoverStrategy: dto.takeoverStrategy || null,
      status: AgentStatus.DRAFT,
    });
    return this.agentRepo.save(agent);
  }

  async activate(id: string, orgId: string): Promise<AiAgent> {
    const agent = await this.getAgent(id, orgId);
    if (agent.status !== AgentStatus.DRAFT && agent.status !== AgentStatus.PAUSED) {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }
    agent.status = AgentStatus.ACTIVE;
    return this.agentRepo.save(agent);
  }

  async pause(id: string, orgId: string): Promise<AiAgent> {
    const agent = await this.getAgent(id, orgId);
    if (agent.status !== AgentStatus.ACTIVE) {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }
    agent.status = AgentStatus.PAUSED;
    return this.agentRepo.save(agent);
  }

  async archive(id: string, orgId: string): Promise<AiAgent> {
    const agent = await this.getAgent(id, orgId);
    if (agent.status !== AgentStatus.PAUSED && agent.status !== AgentStatus.DRAFT) {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }
    agent.status = AgentStatus.ARCHIVED;
    return this.agentRepo.save(agent);
  }

  async getAgent(id: string, orgId: string): Promise<AiAgent> {
    const agent = await this.agentRepo.findOne({ where: { id, orgId } });
    if (!agent) throw new NotFoundException('RESOURCE_NOT_FOUND');
    return agent;
  }

  async getAgentByCode(code: string, orgId: string): Promise<AiAgent | null> {
    return this.agentRepo.findOne({ where: { code, orgId } });
  }

  async listAgents(orgId: string, filters?: { status?: string; agentType?: string }): Promise<AiAgent[]> {
    const qb = this.agentRepo.createQueryBuilder('agent').where('agent.orgId = :orgId', { orgId });
    if (filters?.status) qb.andWhere('agent.status = :status', { status: filters.status });
    if (filters?.agentType) qb.andWhere('agent.agentType = :agentType', { agentType: filters.agentType });
    qb.orderBy('agent.createdAt', 'DESC');
    return qb.getMany();
  }
}
