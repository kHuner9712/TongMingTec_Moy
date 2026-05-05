import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GeoLead } from "./entities/geo-lead.entity";
import { GeoLeadsService } from "./geo-leads.service";
import { GeoLeadsController } from "./geo-leads.controller";
import { GeoLeadsAdminController } from "./geo-leads-admin.controller";

@Module({
  imports: [TypeOrmModule.forFeature([GeoLead])],
  controllers: [GeoLeadsController, GeoLeadsAdminController],
  providers: [GeoLeadsService],
})
export class GeoLeadsModule {}
