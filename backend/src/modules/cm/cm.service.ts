import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, QueryDeepPartialEntity } from "typeorm";
import { Customer, CustomerStatus } from "./entities/customer.entity";
import { CustomerContact } from "./entities/customer-contact.entity";
import { customerStateMachine } from "../../common/statemachine/definitions/customer.sm";
import { EventBusService } from "../../common/events/event-bus.service";
import { customerStatusChanged } from "../../common/events/customer-events";

@Injectable()
export class CmService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerContact)
    private contactRepository: Repository<CustomerContact>,
    private readonly eventBus: EventBusService,
  ) {}

  async findCustomers(
    orgId: string,
    userId: string,
    dataScope: string,
    filters: { status?: string; keyword?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: Customer[]; total: number }> {
    const qb = this.customerRepository
      .createQueryBuilder("customer")
      .where("customer.orgId = :orgId", { orgId });

    if (dataScope === "self") {
      qb.andWhere("customer.ownerUserId = :userId", { userId });
    }

    if (filters.status) {
      qb.andWhere("customer.status = :status", { status: filters.status });
    }

    if (filters.keyword) {
      qb.andWhere(
        "(customer.name LIKE :keyword OR customer.phone LIKE :keyword)",
        {
          keyword: `%${filters.keyword}%`,
        },
      );
    }

    qb.orderBy("customer.updatedAt", "DESC");
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findCustomerById(id: string, orgId: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id, orgId },
    });

    if (!customer) {
      throw new NotFoundException("RESOURCE_NOT_FOUND");
    }

    return customer;
  }

  async createCustomer(
    orgId: string,
    data: Partial<Customer>,
    userId: string,
  ): Promise<Customer> {
    const customer = this.customerRepository.create({
      ...data,
      orgId,
      ownerUserId: userId,
    });

    return this.customerRepository.save(customer);
  }

  async updateCustomer(
    id: string,
    orgId: string,
    data: Partial<Customer>,
    version: number,
  ): Promise<Customer> {
    const customer = await this.findCustomerById(id, orgId);

    if (customer.version !== version) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    await this.customerRepository.update(id, {
      ...data,
      version: () => "version + 1",
    } as QueryDeepPartialEntity<Customer>);

    return this.findCustomerById(id, orgId);
  }

  async changeStatus(
    id: string,
    orgId: string,
    status: CustomerStatus,
    reason: string,
    version: number,
  ): Promise<Customer> {
    const customer = await this.findCustomerById(id, orgId);

    customerStateMachine.validateTransition(customer.status, status);

    const updated = await this.updateCustomer(id, orgId, { status }, version);

    this.eventBus.publish(
      customerStatusChanged({
        orgId,
        customerId: id,
        fromStatus: customer.status,
        toStatus: status,
        reason,
        actorType: "user",
        actorId: customer.ownerUserId,
      }),
    );

    return updated;
  }

  async findContacts(
    customerId: string,
    orgId: string,
  ): Promise<CustomerContact[]> {
    return this.contactRepository.find({
      where: { customerId, orgId },
      order: { isPrimary: "DESC", createdAt: "ASC" },
    });
  }

  async createContact(
    customerId: string,
    orgId: string,
    data: Partial<CustomerContact>,
    userId: string,
  ): Promise<CustomerContact> {
    await this.findCustomerById(customerId, orgId);

    if (data.isPrimary) {
      await this.clearPrimaryFlag(customerId, orgId);
    }

    const contact = this.contactRepository.create({
      ...data,
      customerId,
      orgId,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.contactRepository.save(contact);
  }

  async updateContact(
    contactId: string,
    customerId: string,
    orgId: string,
    data: Partial<CustomerContact>,
    version: number,
  ): Promise<CustomerContact> {
    const contact = await this.findContactById(contactId, customerId, orgId);

    if (contact.version !== version) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    if (data.isPrimary && !contact.isPrimary) {
      await this.clearPrimaryFlag(customerId, orgId);
    }

    await this.contactRepository.update(contactId, {
      ...data,
      version: () => "version + 1",
    } as QueryDeepPartialEntity<CustomerContact>);

    return this.findContactById(contactId, customerId, orgId);
  }

  async deleteContact(
    contactId: string,
    customerId: string,
    orgId: string,
  ): Promise<void> {
    const contact = await this.findContactById(contactId, customerId, orgId);
    await this.contactRepository.softRemove(contact);
  }

  async setPrimaryContact(
    contactId: string,
    customerId: string,
    orgId: string,
    version: number,
  ): Promise<CustomerContact> {
    const contact = await this.findContactById(contactId, customerId, orgId);

    if (contact.version !== version) {
      throw new ConflictException("CONFLICT_VERSION");
    }

    await this.clearPrimaryFlag(customerId, orgId);

    await this.contactRepository.update(contactId, {
      isPrimary: true,
      version: () => "version + 1",
    } as QueryDeepPartialEntity<CustomerContact>);

    return this.findContactById(contactId, customerId, orgId);
  }

  private async findContactById(
    contactId: string,
    customerId: string,
    orgId: string,
  ): Promise<CustomerContact> {
    const contact = await this.contactRepository.findOne({
      where: { id: contactId, customerId, orgId },
    });

    if (!contact) {
      throw new NotFoundException("RESOURCE_NOT_FOUND");
    }

    return contact;
  }

  private async clearPrimaryFlag(
    customerId: string,
    orgId: string,
  ): Promise<void> {
    await this.contactRepository.update(
      { customerId, orgId, isPrimary: true },
      { isPrimary: false },
    );
  }
}
