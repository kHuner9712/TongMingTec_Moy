import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GeoContentTopic } from "./entities/geo-content-topic.entity";
import { GeoContentPlan } from "./entities/geo-content-plan.entity";
import { GeoContentDraft } from "./entities/geo-content-draft.entity";
import { GeoContentTopicsService } from "./geo-content-topics.service";
import { GeoContentPlansService } from "./geo-content-plans.service";
import { GeoContentDraftsService } from "./geo-content-drafts.service";
import { GeoContentTopicsController } from "./geo-content-topics.controller";
import { GeoContentPlansController } from "./geo-content-plans.controller";
import { GeoContentDraftsController } from "./geo-content-drafts.controller";

@Module({
  imports: [TypeOrmModule.forFeature([GeoContentTopic, GeoContentPlan, GeoContentDraft])],
  controllers: [GeoContentTopicsController, GeoContentPlansController, GeoContentDraftsController],
  providers: [GeoContentTopicsService, GeoContentPlansService, GeoContentDraftsService],
})
export class GeoContentModule {}
