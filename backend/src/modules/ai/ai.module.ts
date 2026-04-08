import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AITask } from './entities/ai-task.entity';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ArtModule } from '../art/art.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AITask]),
    ArtModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
