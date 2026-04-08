import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Lead, LeadStatus } from './entities/lead.entity';
import { LeadFollowUp, FollowType } from './entities/lead-follow-up.entity';
import { leadStateMachine } from '../../common/statemachine/definitions/lead.sm';
import { EventBusService } from '../../common/events/event-bus.service';
import { leadStatusChanged } from '../../common/events/lead-events';

@Injectable()
export class LmService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(LeadFollowUp)
    private followUpRepository: Repository<LeadFollowUp>,
    private dataSource: DataSource,
    private readonly eventBus: EventBusService,
  ) {}

  async findLeads(
    orgId: string,
    userId: string,
    dataScope: string,
    filters: { status?: string; source?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: Lead[]; total: number }> {
    const qb = this.leadRepository.createQueryBuilder('lead').where('lead.orgId = :orgId', { orgId });

    if (dataScope === 'self') {
      qb.andWhere('lead.ownerUserId = :userId', { userId });
    }

    if (filters.status) {
      qb.andWhere('lead.status = :status', { status: filters.status });
    }

    if (filters.source) {
      qb.andWhere('lead.source = :source', { source: filters.source });
    }

    qb.orderBy('lead.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findLeadById(id: string, orgId: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id, orgId },
    });

    if (!lead) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }

    return lead;
  }

  async createLead(
    orgId: string,
    data: Partial<Lead>,
    _userId: string,
  ): Promise<Lead> {
    const lead = this.leadRepository.create({
      ...data,
      orgId,
      status: LeadStatus.NEW,
    });

    return this.leadRepository.save(lead);
  }

  async assignLead(
    id: string,
    orgId: string,
    ownerUserId: string,
    userId: string,
    version: number,
  ): Promise<Lead> {
    const lead = await this.findLeadById(id, orgId);

    if (lead.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const fromStatus = lead.status;
    leadStateMachine.validateTransition(lead.status, LeadStatus.ASSIGNED);

    await this.leadRepository.update(id, {
      ownerUserId,
      status: LeadStatus.ASSIGNED,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      leadStatusChanged({
        orgId,
        leadId: id,
        fromStatus,
        toStatus: LeadStatus.ASSIGNED,
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findLeadById(id, orgId);
  }

  async addFollowUp(
    id: string,
    orgId: string,
    content: string,
    followType: FollowType,
    nextActionAt: Date | null,
    userId: string,
    version: number,
  ): Promise<LeadFollowUp> {
    const lead = await this.findLeadById(id, orgId);

    if (lead.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const fromStatus = lead.status;
    leadStateMachine.validateTransition(lead.status, LeadStatus.FOLLOWING);

    const followUp = this.followUpRepository.create({
      leadId: lead.id,
      orgId,
      followType,
      content,
      nextActionAt,
      createdBy: userId,
    });

    await this.followUpRepository.save(followUp);

    await this.leadRepository.update(id, {
      status: LeadStatus.FOLLOWING,
      lastFollowUpAt: new Date(),
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      leadStatusChanged({
        orgId,
        leadId: id,
        fromStatus,
        toStatus: LeadStatus.FOLLOWING,
        actorType: 'user',
        actorId: userId,
      }),
    );

    return followUp;
  }

  async convert(
    id: string,
    orgId: string,
    userId: string,
    version: number,
  ): Promise<{ leadId: string; customerId: string; opportunityId: string }> {
    const lead = await this.findLeadById(id, orgId);

    if (lead.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const fromStatus = lead.status;
    leadStateMachine.validateTransition(lead.status, LeadStatus.CONVERTED);

    await this.leadRepository.update(id, {
      status: LeadStatus.CONVERTED,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      leadStatusChanged({
        orgId,
        leadId: id,
        fromStatus,
        toStatus: LeadStatus.CONVERTED,
        actorType: 'user',
        actorId: userId,
      }),
    );

    return {
      leadId: id,
      customerId: 'placeholder-customer-id',
      opportunityId: 'placeholder-opportunity-id',
    };
  }

  async markInvalid(
    id: string,
    orgId: string,
    reason: string,
    userId: string,
    version: number,
  ): Promise<Lead> {
    const lead = await this.findLeadById(id, orgId);

    if (lead.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const fromStatus = lead.status;
    leadStateMachine.validateTransition(lead.status, LeadStatus.INVALID);

    await this.leadRepository.update(id, {
      status: LeadStatus.INVALID,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      leadStatusChanged({
        orgId,
        leadId: id,
        fromStatus,
        toStatus: LeadStatus.INVALID,
        reason,
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findLeadById(id, orgId);
  }

  async findFollowUps(leadId: string, orgId: string): Promise<LeadFollowUp[]> {
    return this.followUpRepository.find({
      where: { leadId, orgId },
      order: { createdAt: 'DESC' },
    });
  }
}
