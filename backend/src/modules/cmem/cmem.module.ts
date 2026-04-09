import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerContext } from "./entities/customer-context.entity";
import { CustomerIntent } from "./entities/customer-intent.entity";
import { CustomerRisk } from "./entities/customer-risk.entity";
import { CustomerNextAction } from "./entities/customer-next-action.entity";
import { ContextService } from "./services/context.service";
import { IntentService } from "./services/intent.service";
import { RiskService } from "./services/risk.service";
import { NextActionService } from "./services/next-action.service";
import { CmemEventHandler } from "./services/cmem-event-handler.service";
import { CmemController } from "./cmem.controller";
import { EventsModule } from "../../common/events/events.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerContext,
      CustomerIntent,
      CustomerRisk,
      CustomerNextAction,
    ]),
    EventsModule,
  ],
  controllers: [CmemController],
  providers: [
    ContextService,
    IntentService,
    RiskService,
    NextActionService,
    CmemEventHandler,
  ],
  exports: [ContextService, IntentService, RiskService, NextActionService],
})
export class CmemModule {}
