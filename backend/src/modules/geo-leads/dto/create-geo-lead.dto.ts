import {
  IsString,
  IsUrl,
  IsOptional,
  MinLength,
  Length,
} from "class-validator";

export class CreateGeoLeadDto {
  @IsString()
  @Length(1, 200)
  companyName: string;

  @IsString()
  @Length(1, 200)
  brandName: string;

  @IsString()
  @Length(1, 500)
  website: string;

  @IsString()
  @Length(1, 100)
  industry: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  targetCity?: string;

  @IsOptional()
  @IsString()
  competitors?: string;

  @IsString()
  @Length(1, 100)
  contactName: string;

  @IsString()
  @MinLength(5)
  contactMethod: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  submittedAt?: string;

  @IsOptional()
  @IsString()
  _hint?: string;
}
