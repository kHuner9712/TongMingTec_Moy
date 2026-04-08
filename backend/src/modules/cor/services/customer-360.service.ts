import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../cm/entities/customer.entity';
import { CustomerContact } from '../../cm/entities/customer-contact.entity';
import { Lead } from '../../lm/entities/lead.entity';
import { Opportunity } from '../../om/entities/opportunity.entity';
import { Conversation } from '../../cnv/entities/conversation.entity';
import { Ticket } from '../../tk/entities/ticket.entity';

export interface Customer360View {
  customer: Customer;
  contacts: CustomerContact[];
  leads: Lead[];
  opportunities: Opportunity[];
  conversations: Conversation[];
  tickets: Ticket[];
  latestContext: Record<string, unknown> | null;
  currentIntent: { intentType: string; confidence: number } | null;
  riskLevel: string | null;
  nextActions: any[];
}

@Injectable()
export class Customer360Service {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(CustomerContact)
    private readonly contactRepo: Repository<CustomerContact>,
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepo: Repository<Opportunity>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  async getCustomer360(customerId: string, orgId: string): Promise<Customer360View> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, orgId },
    });
    if (!customer) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }

    const [contacts, leads, opportunities, conversations, tickets] = await Promise.all([
      this.contactRepo.find({ where: { customerId, orgId } }),
      this.leadRepo.find({ where: { orgId } }).then((all) =>
        all.filter((l) => (l as any).customerId === customerId),
      ),
      this.opportunityRepo.find({ where: { customerId, orgId } }),
      this.conversationRepo.find({ where: { customerId, orgId } }),
      this.ticketRepo.find({ where: { customerId, orgId } }),
    ]);

    return {
      customer,
      contacts,
      leads,
      opportunities,
      conversations,
      tickets,
      latestContext: (customer as any).contextSnapshot || null,
      currentIntent: (customer as any).intentSummary
        ? { intentType: (customer as any).intentSummary, confidence: 0.8 }
        : null,
      riskLevel: (customer as any).riskLevel || null,
      nextActions: [],
    };
  }
}
