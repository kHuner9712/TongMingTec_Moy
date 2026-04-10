import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { Department } from './entities/department.entity';
import { OrgController } from './org.controller';
import { OrgService } from './org.service';
import { EventsModule } from '../../common/events/events.module';
import { PermissionSeedRunner } from '../usr/seeds/permission-seed-runner';
import { Permission } from '../usr/entities/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, Department, Permission]),
    EventsModule,
  ],
  controllers: [OrgController],
  providers: [OrgService, PermissionSeedRunner],
  exports: [OrgService],
})
export class OrgModule {}
