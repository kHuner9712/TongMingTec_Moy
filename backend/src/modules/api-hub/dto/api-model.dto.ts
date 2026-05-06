import { IsString, IsOptional, IsIn, IsBoolean, IsInt, MaxLength } from "class-validator";

export class CreateApiModelDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(50)
  provider!: string;

  @IsString()
  @MaxLength(100)
  modelId!: string;

  @IsOptional()
  @IsIn(["text", "image", "audio", "video", "embedding"])
  category?: string;

  @IsOptional()
  @IsString()
  pricingUnit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unitLabel?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(["internal", "public", "deprecated"])
  status?: string;

  @IsOptional()
  @IsInt()
  maxInputTokens?: number;

  @IsOptional()
  @IsInt()
  maxOutputTokens?: number;

  @IsOptional()
  @IsBoolean()
  supportsStreaming?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsVision?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsFunctionCalling?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  upstreamModel?: string;
}

export class UpdateApiModelDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  modelId?: string;

  @IsOptional()
  @IsIn(["text", "image", "audio", "video", "embedding"])
  category?: string;

  @IsOptional()
  @IsString()
  pricingUnit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unitLabel?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(["internal", "public", "deprecated"])
  status?: string;

  @IsOptional()
  @IsInt()
  maxInputTokens?: number;

  @IsOptional()
  @IsInt()
  maxOutputTokens?: number;

  @IsOptional()
  @IsBoolean()
  supportsStreaming?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsVision?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsFunctionCalling?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  upstreamModel?: string;
}

export class QueryApiModelDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsIn(["internal", "public", "deprecated"])
  status?: string;

  @IsOptional()
  @IsIn(["text", "image", "audio", "video", "embedding"])
  category?: string;

  page?: number;
  pageSize?: number;
}
