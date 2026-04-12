import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from './entities/contract.entity';
import { ContractApproval } from './entities/contract-approval.entity';
import { ContractDocument } from './entities/contract-document.entity';
import { CtController } from './ct.controller';
import { CtService } from './ct.service';
import { EventsModule } from '../../common/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, ContractApproval, ContractDocument]),
    EventsModule,
  ],
  controllers: [CtController],
  providers: [CtService],
  exports: [CtService],
})
export class CtModule {}
