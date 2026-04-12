import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdController } from './ord.controller';
import { OrdService } from './ord.service';
import { EventsModule } from '../../common/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    EventsModule,
  ],
  controllers: [OrdController],
  providers: [OrdService],
  exports: [OrdService],
})
export class OrdModule {}
