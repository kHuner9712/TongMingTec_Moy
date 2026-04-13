import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeCategory } from './entities/knowledge-category.entity';
import { KnowledgeItem } from './entities/knowledge-item.entity';
import { KnowledgeReview } from './entities/knowledge-review.entity';
import { KbController } from './kb.controller';
import { KbService } from './kb.service';
import { EventsModule } from '../../common/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KnowledgeCategory, KnowledgeItem, KnowledgeReview]),
    EventsModule,
  ],
  controllers: [KbController],
  providers: [KbService],
  exports: [KbService],
})
export class KbModule {}
