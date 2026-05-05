import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GeoReport } from "./entities/geo-report.entity";
import { GeoBrandAsset } from "./entities/geo-brand-asset.entity";
import { GeoReportsService } from "./geo-reports.service";
import { GeoBrandAssetsService } from "./geo-brand-assets.service";
import { GeoReportsController } from "./geo-reports.controller";
import { GeoBrandAssetsController } from "./geo-brand-assets.controller";

@Module({
  imports: [TypeOrmModule.forFeature([GeoReport, GeoBrandAsset])],
  controllers: [GeoReportsController, GeoBrandAssetsController],
  providers: [GeoReportsService, GeoBrandAssetsService],
})
export class GeoDeliverablesModule {}
