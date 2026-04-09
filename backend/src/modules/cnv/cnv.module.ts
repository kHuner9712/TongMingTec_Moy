import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Conversation } from "./entities/conversation.entity";
import { ConversationMessage } from "./entities/conversation-message.entity";
import { CnvController } from "./cnv.controller";
import { CnvService } from "./cnv.service";
import { EventsModule } from "../../common/events/events.module";
import { TkModule } from "../tk/tk.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationMessage]),
    EventsModule,
    TkModule,
  ],
  controllers: [CnvController],
  providers: [CnvService],
  exports: [CnvService],
})
export class CnvModule {}
