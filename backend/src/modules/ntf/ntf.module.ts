import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NtfController } from './ntf.controller';
import { NtfService } from './ntf.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NtfController],
  providers: [NtfService],
  exports: [NtfService],
})
export class NtfModule {}
