import { IsString, IsIn, IsOptional, MaxLength } from "class-validator";
import { GeoLeadStatus } from "../entities/geo-lead.entity";

const ALLOWED_STATUSES: GeoLeadStatus[] = [
  "received",
  "contacted",
  "qualified",
  "proposal_sent",
  "won",
  "lost",
  "archived",
];

export class UpdateGeoLeadStatusDto {
  @IsString()
  @IsIn(ALLOWED_STATUSES, {
    message: `status 必须是以下值之一: ${ALLOWED_STATUSES.join(", ")}`,
  })
  status: GeoLeadStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
