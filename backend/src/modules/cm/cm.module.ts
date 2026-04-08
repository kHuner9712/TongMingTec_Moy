import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerContact } from './entities/customer-contact.entity';
import { CmController } from './cm.controller';
import { CmService } from './cm.service';
import { EventsModule } from '../../common/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerContact]),
    EventsModule,
  ],
  controllers: [CmController],
  providers: [CmService],
  exports: [CmService],
})
export class CmModule {}
