import { IsOptional, IsString } from "class-validator";

export class CreateGeoReportDto {
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
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  diagnosisDate?: string;

  @IsOptional()
  platforms?: string[];

  @IsOptional()
  @IsString()
  competitors?: string;

  @IsOptional()
  @IsString()
  targetQuestions?: string;

  @IsOptional()
  testResults?: any[];

  @IsOptional()
  @IsString()
  visibilitySummary?: string;

  @IsOptional()
  @IsString()
  mainProblems?: string;

  @IsOptional()
  @IsString()
  opportunities?: string;

  @IsOptional()
  @IsString()
  recommendedActions?: string;

  @IsOptional()
  @IsString()
  markdown?: string;
}
