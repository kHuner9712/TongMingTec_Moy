import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionSeat } from './entities/subscription-seat.entity';
import { SubController } from './sub.controller';
import { SubService } from './sub.service';
import { EventsModule } from '../../common/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, SubscriptionSeat]),
    EventsModule,
  ],
  controllers: [SubController],
  providers: [SubService],
  exports: [SubService],
})
export class SubModule {}
