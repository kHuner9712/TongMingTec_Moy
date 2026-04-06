import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketLog } from './entities/ticket-log.entity';
import { TkController } from './tk.controller';
import { TkService } from './tk.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, TicketLog])],
  controllers: [TkController],
  providers: [TkService],
  exports: [TkService],
})
export class TkModule {}
