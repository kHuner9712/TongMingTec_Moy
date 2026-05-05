import { IsOptional, IsString } from "class-validator";

export class CreateGeoBrandAssetDto {
  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  targetCity?: string;

  @IsOptional()
  basicInfo?: any;

  @IsOptional()
  companyIntro?: any;

  @IsOptional()
  serviceItems?: any[];

  @IsOptional()
  advantages?: any[];

  @IsOptional()
  cases?: any[];

  @IsOptional()
  faqs?: any[];

  @IsOptional()
  competitorDiffs?: any[];

  @IsOptional()
  complianceMaterials?: any;

  @IsOptional()
  @IsString()
  markdown?: string;
}
