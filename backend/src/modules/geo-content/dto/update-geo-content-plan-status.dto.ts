import { IsString } from "class-validator";

export class UpdateGeoContentPlanStatusDto {
  @IsString() status: string;
}
