import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrgConfig } from './entities/org-config.entity';
import { SysController } from './sys.controller';
import { SysService } from './sys.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrgConfig])],
  controllers: [SysController],
  providers: [SysService],
  exports: [SysService],
})
export class SysModule {}
