import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Customer } from "../../cm/entities/customer.entity";
import { CustomerContact } from "../../cm/entities/customer-contact.entity";
import { Lead } from "../../lm/entities/lead.entity";
import { Opportunity } from "../../om/entities/opportunity.entity";
import { Conversation } from "../../cnv/entities/conversation.entity";
import { Ticket } from "../../tk/entities/ticket.entity";
import { ContextService } from "../../cmem/services/context.service";
import { IntentService } from "../../cmem/services/intent.service";
import { RiskService } from "../../cmem/services/risk.service";
import { NextActionService } from "../../cmem/services/next-action.service";

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
    private readonly contextService: ContextService,
    private readonly intentService: IntentService,
    private readonly riskService: RiskService,
    private readonly nextActionService: NextActionService,
  ) {}

  async getCustomer360(
    customerId: string,
    orgId: string,
  ): Promise<Customer360View> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, orgId },
    });
    if (!customer) {
      throw new NotFoundException("RESOURCE_NOT_FOUND");
    }

    const [
      contacts,
      leads,
      opportunities,
      conversations,
      tickets,
      latestContext,
      currentIntent,
      riskLevel,
      nextActions,
    ] = await Promise.all([
      this.contactRepo.find({ where: { customerId, orgId } }),
      this.leadRepo.find({ where: { customerId, orgId } }),
      this.opportunityRepo.find({ where: { customerId, orgId } }),
      this.conversationRepo.find({ where: { customerId, orgId } }),
      this.ticketRepo.find({ where: { customerId, orgId } }),
      this.contextService.getLatestContext(customerId, orgId).catch(() => null),
      this.intentService.getLatestIntent(customerId, orgId).catch(() => null),
      this.riskService
        .getLatestRiskLevel(customerId, orgId)
        .catch(() => customer.riskLevel),
      this.nextActionService
        .getPendingActions(customerId, orgId)
        .catch(() => []),
    ]);

    return {
      customer,
      contacts,
      leads,
      opportunities,
      conversations,
      tickets,
      latestContext: latestContext?.contextData || null,
      currentIntent: currentIntent
        ? {
            intentType: currentIntent.intentType,
            confidence: currentIntent.confidence,
          }
        : null,
      riskLevel,
      nextActions,
    };
  }
}
