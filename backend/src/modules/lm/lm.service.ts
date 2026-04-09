import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Lead, LeadStatus } from './entities/lead.entity';
import { LeadFollowUp, FollowType } from './entities/lead-follow-up.entity';
import { Customer, CustomerStatus } from '../cm/entities/customer.entity';
import { Opportunity, OpportunityStage } from '../om/entities/opportunity.entity';
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
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
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
    userId: string,
  ): Promise<Lead> {
    const lead = this.leadRepository.create({
      ...data,
      orgId,
      ownerUserId: userId,
      status: LeadStatus.NEW,
      createdBy: userId,
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

    const result = await this.leadRepository
      .createQueryBuilder()
      .update(Lead)
      .set({
        ownerUserId,
        status: LeadStatus.ASSIGNED,
        version: () => 'version + 1',
      })
      .where('id = :id AND version = :version', { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException('CONFLICT_VERSION');
    }

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

    await this.leadRepository
      .createQueryBuilder()
      .update(Lead)
      .set({
        status: LeadStatus.FOLLOWING,
        lastFollowUpAt: new Date(),
        version: () => 'version + 1',
      })
      .where('id = :id AND version = :version', { id, version })
      .execute();

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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const customer = queryRunner.manager.create(Customer, {
        orgId,
        name: lead.companyName || lead.name,
        phone: lead.mobile,
        email: lead.email,
        ownerUserId: lead.ownerUserId || userId,
        status: CustomerStatus.ACTIVE,
        createdBy: userId,
      });
      await queryRunner.manager.save(customer);

      const opportunity = queryRunner.manager.create(Opportunity, {
        orgId,
        customerId: customer.id,
        leadId: lead.id,
        name: `${lead.name} - 商机`,
        ownerUserId: lead.ownerUserId || userId,
        stage: OpportunityStage.DISCOVERY,
        createdBy: userId,
      });
      await queryRunner.manager.save(opportunity);

      await queryRunner.manager.update(Lead, id, {
        status: LeadStatus.CONVERTED,
        customerId: customer.id,
        version: () => 'version + 1',
      });

      await queryRunner.commitTransaction();

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
        customerId: customer.id,
        opportunityId: opportunity.id,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
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

    const result = await this.leadRepository
      .createQueryBuilder()
      .update(Lead)
      .set({
        status: LeadStatus.INVALID,
        version: () => 'version + 1',
      })
      .where('id = :id AND version = :version', { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException('CONFLICT_VERSION');
    }

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

  async importLeads(
    orgId: string,
    leads: Partial<Lead>[],
    userId: string,
  ): Promise<{ jobId: string; total: number; succeeded: number; failed: number }> {
    const jobId = `IMPORT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    let succeeded = 0;
    let failed = 0;

    for (const leadData of leads) {
      try {
        const lead = this.leadRepository.create({
          ...leadData,
          orgId,
          ownerUserId: leadData.ownerUserId || userId,
          status: LeadStatus.NEW,
          createdBy: userId,
        });

        await this.leadRepository.save(lead);
        succeeded++;
      } catch {
        failed++;
      }
    }

    return { jobId, total: leads.length, succeeded, failed };
  }
}
