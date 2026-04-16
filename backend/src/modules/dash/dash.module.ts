import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricSnapshot } from './entities/metric-snapshot.entity';
import { DashController } from './dash.controller';
import { DashService } from './dash.service';
import { Lead } from '../lm/entities/lead.entity';
import { Conversation } from '../cnv/entities/conversation.entity';
import { Contract } from '../ct/entities/contract.entity';
import { Order } from '../ord/entities/order.entity';
import { Ticket } from '../tk/entities/ticket.entity';
import { CmModule } from '../cm/cm.module';
import { LmModule } from '../lm/lm.module';
import { OmModule } from '../om/om.module';
import { CtModule } from '../ct/ct.module';
import { OrdModule } from '../ord/ord.module';
import { PayModule } from '../pay/pay.module';
import { SubModule } from '../sub/sub.module';
import { CnvModule } from '../cnv/cnv.module';
import { TkModule } from '../tk/tk.module';
import { CsmModule } from '../csm/csm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MetricSnapshot,
      Lead,
      Conversation,
      Contract,
      Order,
      Ticket,
    ]),
    CmModule,
    LmModule,
    OmModule,
    CtModule,
    OrdModule,
    PayModule,
    SubModule,
    CnvModule,
    TkModule,
    CsmModule,
  ],
  controllers: [DashController],
  providers: [DashService],
  exports: [DashService],
})
export class DashModule {}
