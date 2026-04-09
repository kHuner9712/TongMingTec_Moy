import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CustomerOperatingRecord } from "../entities/customer-operating-record.entity";
import { CreateOperatingRecordDto } from "../dto/create-operating-record.dto";

@Injectable()
export class OperatingRecordService {
  constructor(
    @InjectRepository(CustomerOperatingRecord)
    private readonly recordRepo: Repository<CustomerOperatingRecord>,
  ) {}

  async createRecord(
    customerId: string,
    orgId: string,
    dto: CreateOperatingRecordDto,
    _userId: string,
  ): Promise<CustomerOperatingRecord> {
    const record = this.recordRepo.create({
      orgId,
      customerId,
      recordType: dto.recordType,
      content: dto.content,
      aiSuggestion: dto.aiSuggestion || null,
      humanDecision: dto.humanDecision || null,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId || null,
    });
    return this.recordRepo.save(record);
  }

  async getRecords(
    customerId: string,
    orgId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ items: CustomerOperatingRecord[]; total: number }> {
    const [items, total] = await this.recordRepo.findAndCount({
      where: { customerId, orgId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total };
  }
}
