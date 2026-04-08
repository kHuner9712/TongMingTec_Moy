import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerContext } from '../entities/customer-context.entity';

@Injectable()
export class ContextService {
  constructor(
    @InjectRepository(CustomerContext)
    private readonly contextRepo: Repository<CustomerContext>,
  ) {}

  async updateContext(
    customerId: string,
    orgId: string,
    contextType: string,
    contextData: Record<string, unknown>,
    source?: string,
  ): Promise<CustomerContext> {
    const existing = await this.contextRepo.findOne({
      where: { customerId, orgId, contextType },
    });

    if (existing) {
      await this.contextRepo.update(existing.id, {
        contextData: { ...existing.contextData, ...contextData } as any,
        lastUpdatedFrom: source || null,
      });
      return this.contextRepo.findOne({ where: { id: existing.id } }) as Promise<CustomerContext>;
    }

    const context = this.contextRepo.create({
      orgId,
      customerId,
      contextType,
      contextData,
      lastUpdatedFrom: source || null,
    });
    return this.contextRepo.save(context);
  }

  async getContext(customerId: string, orgId: string): Promise<CustomerContext[]> {
    return this.contextRepo.find({
      where: { customerId, orgId },
      order: { updatedAt: 'DESC' },
    });
  }

  async getLatestContext(customerId: string, orgId: string): Promise<Record<string, unknown> | null> {
    const contexts = await this.contextRepo.find({
      where: { customerId, orgId },
      order: { updatedAt: 'DESC' },
      take: 1,
    });
    if (contexts.length === 0) return null;
    return contexts[0].contextData;
  }
}
