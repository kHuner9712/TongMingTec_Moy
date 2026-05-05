import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GeoLead } from "./entities/geo-lead.entity";
import { GeoLeadsService } from "./geo-leads.service";
import { GeoLeadsController } from "./geo-leads.controller";

@Module({
  imports: [TypeOrmModule.forFeature([GeoLead])],
  controllers: [GeoLeadsController],
  providers: [GeoLeadsService],
})
export class GeoLeadsModule {}
