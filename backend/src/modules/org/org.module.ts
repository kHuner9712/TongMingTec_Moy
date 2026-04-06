import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { Department } from './entities/department.entity';
import { OrgController } from './org.controller';
import { OrgService } from './org.service';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, Department])],
  controllers: [OrgController],
  providers: [OrgService],
  exports: [OrgService],
})
export class OrgModule {}
