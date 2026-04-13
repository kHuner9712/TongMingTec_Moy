import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Contract } from './entities/contract.entity';
import { NtfService } from '../ntf/ntf.service';
import { EventBusService } from '../../common/events/event-bus.service';
import { contractExpiryWarning } from '../../common/events/contract-events';

@Injectable()
export class ContractExpiryScheduler {
  private readonly logger = new Logger(ContractExpiryScheduler.name);

  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    private readonly ntfService: NtfService,
    private readonly eventBus: EventBusService,
  ) {}

  @Cron('0 8 * * *', { name: 'contract-expiry-warning' })
  async handleDailyExpiryWarning(): Promise<void> {
    this.logger.log('Running daily contract expiry warning check...');
    const notified = await this.checkAndNotifyExpiringContracts(30);
    this.logger.log(`Daily expiry warning: ${notified} contracts notified`);
  }

  @Cron('0 2 * * *', { name: 'contract-auto-expire' })
  async handleDailyAutoExpire(): Promise<void> {
    this.logger.log('Running daily contract auto-expire check...');
    const expired = await this.expireOverdueContracts();
    this.logger.log(`Daily auto-expire: ${expired} contracts expired`);
  }

  async checkAndNotifyExpiringContracts(warningDays: number = 30): Promise<number> {
    const now = new Date();
    const warningDate = new Date(now);
    warningDate.setDate(warningDate.getDate() + warningDays);

    const contracts = await this.contractRepository
      .createQueryBuilder('c')
      .where('c.status = :status', { status: 'active' })
      .andWhere('c.endsOn IS NOT NULL')
      .andWhere('c.endsOn <= :warningDate', { warningDate })
      .andWhere('c.endsOn > :now', { now })
      .andWhere('c.deletedAt IS NULL')
      .getMany();

    let notifiedCount = 0;

    for (const contract of contracts) {
      if (!contract.endsOn) continue;

      const daysUntilExpiry = Math.ceil(
        (contract.endsOn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      try {
        this.eventBus.publish(
          contractExpiryWarning({
            orgId: contract.orgId,
            contractId: contract.id,
            contractNo: contract.contractNo,
            customerId: contract.customerId,
            endsOn: contract.endsOn.toISOString(),
            daysUntilExpiry,
          }),
        );

        if (contract.createdBy) {
          await this.ntfService.createNotification(
            contract.orgId,
            contract.createdBy,
            'system' as any,
            '合同即将到期',
            `合同 ${contract.contractNo} 将在 ${daysUntilExpiry} 天后到期，请及时安排续费或终止。`,
            'contract',
            contract.id,
          );
        }

        notifiedCount++;
      } catch (err) {
        this.logger.error(
          `Failed to notify expiry for contract ${contract.id}: ${err}`,
        );
      }
    }

    return notifiedCount;
  }

  async expireOverdueContracts(): Promise<number> {
    const now = new Date();

    const result = await this.contractRepository
      .createQueryBuilder()
      .update(Contract)
      .set({ status: 'expired', updatedAt: now })
      .where('status = :status', { status: 'active' })
      .andWhere('endsOn IS NOT NULL')
      .andWhere('endsOn < :now', { now })
      .andWhere('deletedAt IS NULL')
      .execute();

    const affected = result.affected || 0;

    if (affected > 0) {
      this.logger.log(`Expired ${affected} overdue contracts`);
    }

    return affected;
  }
}
