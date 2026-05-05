import { IsString } from "class-validator";

export class UpdateGeoReportStatusDto {
  @IsString()
  status: string;
}
