import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TskController } from './tsk.controller';
import { TskService } from './tsk.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [TskController],
  providers: [TskService],
  exports: [TskService],
})
export class TskModule {}
