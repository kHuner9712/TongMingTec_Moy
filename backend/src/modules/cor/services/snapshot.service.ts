import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerStateSnapshot, SnapshotType } from '../entities/customer-state-snapshot.entity';

@Injectable()
export class SnapshotService {
  constructor(
    @InjectRepository(CustomerStateSnapshot)
    private readonly snapshotRepo: Repository<CustomerStateSnapshot>,
  ) {}

  async createSnapshot(data: {
    customerId: string;
    orgId: string;
    snapshotType: SnapshotType;
    stateData: Record<string, unknown>;
    agentRunId?: string;
    triggerEvent?: string;
    createdBy?: string;
  }): Promise<CustomerStateSnapshot> {
    const snapshot = this.snapshotRepo.create({
      customerId: data.customerId,
      orgId: data.orgId,
      snapshotType: data.snapshotType,
      stateData: data.stateData,
      agentRunId: data.agentRunId ?? undefined,
      triggerEvent: data.triggerEvent ?? undefined,
      createdBy: data.createdBy ?? undefined,
    });
    return this.snapshotRepo.save(snapshot);
  }

  async getLatestSnapshot(customerId: string, orgId: string): Promise<CustomerStateSnapshot | null> {
    return this.snapshotRepo.findOne({
      where: { customerId, orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSnapshots(
    customerId: string,
    orgId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ items: CustomerStateSnapshot[]; total: number }> {
    const [items, total] = await this.snapshotRepo.findAndCount({
      where: { customerId, orgId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total };
  }
}
