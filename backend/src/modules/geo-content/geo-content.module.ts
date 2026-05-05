import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GeoContentTopic } from "./entities/geo-content-topic.entity";
import { GeoContentPlan } from "./entities/geo-content-plan.entity";
import { GeoContentTopicsService } from "./geo-content-topics.service";
import { GeoContentPlansService } from "./geo-content-plans.service";
import { GeoContentTopicsController } from "./geo-content-topics.controller";
import { GeoContentPlansController } from "./geo-content-plans.controller";

@Module({
  imports: [TypeOrmModule.forFeature([GeoContentTopic, GeoContentPlan])],
  controllers: [GeoContentTopicsController, GeoContentPlansController],
  providers: [GeoContentTopicsService, GeoContentPlansService],
})
export class GeoContentModule {}
