import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NtfController } from './ntf.controller';
import { NtfService } from './ntf.service';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationPreferenceController } from './notification-preference.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationPreference])],
  controllers: [NtfController, NotificationPreferenceController],
  providers: [NtfService],
  exports: [NtfService],
})
export class NtfModule {}
