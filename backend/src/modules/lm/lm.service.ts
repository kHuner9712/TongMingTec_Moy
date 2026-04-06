import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Lead, LeadStatus } from './entities/lead.entity';
import { LeadFollowUp, FollowType } from './entities/lead-follow-up.entity';

const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  [LeadStatus.NEW]: [LeadStatus.ASSIGNED, LeadStatus.INVALID],
  [LeadStatus.ASSIGNED]: [LeadStatus.FOLLOWING, LeadStatus.INVALID],
  [LeadStatus.FOLLOWING]: [LeadStatus.CONVERTED, LeadStatus.INVALID],
  [LeadStatus.CONVERTED]: [],
  [LeadStatus.INVALID]: [],
};

@Injectable()
export class LmService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(LeadFollowUp)
    private followUpRepository: Repository<LeadFollowUp>,
    private dataSource: DataSource,
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
    userId: string,
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
    version: number,
  ): Promise<Lead> {
    const lead = await this.findLeadById(id, orgId);

    if (lead.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    if (!VALID_TRANSITIONS[lead.status].includes(LeadStatus.ASSIGNED)) {
      throw new BadRequestException('STATUS_TRANSITION_INVALID');
    }

    await this.leadRepository.update(id, {
      ownerUserId,
      status: LeadStatus.ASSIGNED,
      version: () => 'version + 1',
    });

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

    if (!VALID_TRANSITIONS[lead.status].includes(LeadStatus.FOLLOWING)) {
      throw new BadRequestException('STATUS_TRANSITION_INVALID');
    }

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

    if (!VALID_TRANSITIONS[lead.status].includes(LeadStatus.CONVERTED)) {
      throw new BadRequestException('STATUS_TRANSITION_INVALID');
    }

    await this.leadRepository.update(id, {
      status: LeadStatus.CONVERTED,
      version: () => 'version + 1',
    });

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

    if (!VALID_TRANSITIONS[lead.status].includes(LeadStatus.INVALID)) {
      throw new BadRequestException('STATUS_TRANSITION_INVALID');
    }

    await this.leadRepository.update(id, {
      status: LeadStatus.INVALID,
      version: () => 'version + 1',
    });

    return this.findLeadById(id, orgId);
  }

  async findFollowUps(leadId: string, orgId: string): Promise<LeadFollowUp[]> {
    return this.followUpRepository.find({
      where: { leadId, orgId },
      order: { createdAt: 'DESC' },
    });
  }
}
