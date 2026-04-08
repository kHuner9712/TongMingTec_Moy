import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationMessage } from './entities/conversation-message.entity';
import { CnvController } from './cnv.controller';
import { CnvService } from './cnv.service';
import { EventsModule } from '../../common/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationMessage]),
    EventsModule,
  ],
  controllers: [CnvController],
  providers: [CnvService],
  exports: [CnvService],
})
export class CnvModule {}
