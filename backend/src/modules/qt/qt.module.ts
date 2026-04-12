import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from './entities/quote.entity';
import { QuoteVersion } from './entities/quote-version.entity';
import { QuoteApproval } from './entities/quote-approval.entity';
import { QtController } from './qt.controller';
import { QtService } from './qt.service';
import { EventsModule } from '../../common/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, QuoteVersion, QuoteApproval]),
    EventsModule,
  ],
  controllers: [QtController],
  providers: [QtService],
  exports: [QtService],
})
export class QtModule {}
