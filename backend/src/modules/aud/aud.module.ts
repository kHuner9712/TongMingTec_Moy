import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AudController } from './aud.controller';
import { AudService } from './aud.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AudController],
  providers: [AudService],
  exports: [AudService],
})
export class AudModule {}
