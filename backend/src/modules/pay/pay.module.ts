import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PayController } from './pay.controller';
import { PayService } from './pay.service';
import { EventsModule } from '../../common/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    EventsModule,
  ],
  controllers: [PayController],
  providers: [PayService],
  exports: [PayService],
})
export class PayModule {}
