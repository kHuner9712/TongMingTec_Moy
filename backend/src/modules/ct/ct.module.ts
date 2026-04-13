import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from './entities/contract.entity';
import { ContractApproval } from './entities/contract-approval.entity';
import { ContractDocument } from './entities/contract-document.entity';
import { CtController } from './ct.controller';
import { CtService } from './ct.service';
import { ContractExpiryScheduler } from './contract-expiry.scheduler';
import { EventsModule } from '../../common/events/events.module';
import { NtfModule } from '../ntf/ntf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, ContractApproval, ContractDocument]),
    EventsModule,
    NtfModule,
  ],
  controllers: [CtController],
  providers: [CtService, ContractExpiryScheduler],
  exports: [CtService, ContractExpiryScheduler],
})
export class CtModule {}
