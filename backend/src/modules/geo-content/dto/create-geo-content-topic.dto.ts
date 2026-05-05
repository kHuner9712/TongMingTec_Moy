import { IsOptional, IsString } from "class-validator";

export class CreateGeoContentTopicDto {
  @IsOptional() @IsString() leadId?: string;
  @IsOptional() @IsString() brandAssetId?: string;
  @IsOptional() @IsString() reportId?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() contentType?: string;
  @IsOptional() @IsString() targetKeyword?: string;
  @IsOptional() @IsString() targetQuestion?: string;
  @IsOptional() @IsString() targetAudience?: string;
  @IsOptional() @IsString() searchIntent?: string;
  @IsOptional() @IsString() platformSuggestion?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() outline?: string;
  @IsOptional() keyPoints?: string[];
  @IsOptional() referenceMaterials?: string[];
  @IsOptional() @IsString() complianceNotes?: string;
  @IsOptional() @IsString() plannedPublishDate?: string;
  @IsOptional() @IsString() actualPublishDate?: string;
  @IsOptional() @IsString() publishedUrl?: string;
}
