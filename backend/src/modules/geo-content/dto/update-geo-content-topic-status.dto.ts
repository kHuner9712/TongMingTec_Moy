import { IsString } from "class-validator";

export class UpdateGeoContentTopicStatusDto {
  @IsString() status: string;
}
