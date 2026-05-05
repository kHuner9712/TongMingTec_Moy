import { IsOptional, IsString } from "class-validator";

export class CreateGeoContentPlanDto {
  @IsOptional() @IsString() leadId?: string;
  @IsOptional() @IsString() brandAssetId?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() month?: string;
  @IsOptional() @IsString() goal?: string;
  @IsOptional() targetPlatforms?: string[];
  @IsOptional() topics?: string[];
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() summary?: string;
}
