import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { ChnController } from './chn.controller';
import { ChnService } from './chn.service';

@Module({
  imports: [TypeOrmModule.forFeature([Channel])],
  controllers: [ChnController],
  providers: [ChnService],
  exports: [ChnService],
})
export class ChnModule {}
