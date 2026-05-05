import { Type } from "class-transformer";
import { IsOptional, IsString, Max, Min } from "class-validator";

export class QueryGeoContentDraftsDto {
  @IsOptional() @IsString() leadId?: string;
  @IsOptional() @IsString() brandAssetId?: string;
  @IsOptional() @IsString() reportId?: string;
  @IsOptional() @IsString() topicId?: string;
  @IsOptional() @IsString() planId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() contentType?: string;
  @IsOptional() @IsString() keyword?: string;

  @IsOptional() @Type(() => Number) @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @Min(1) @Max(100) pageSize?: number = 20;
}
