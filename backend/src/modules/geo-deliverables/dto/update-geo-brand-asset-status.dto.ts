import { IsString } from "class-validator";

export class UpdateGeoBrandAssetStatusDto {
  @IsString()
  status: string;
}
