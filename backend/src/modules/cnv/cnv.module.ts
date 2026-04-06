import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationMessage } from './entities/conversation-message.entity';
import { CnvController } from './cnv.controller';
import { CnvService } from './cnv.service';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, ConversationMessage])],
  controllers: [CnvController],
  providers: [CnvService],
  exports: [CnvService],
})
export class CnvModule {}
