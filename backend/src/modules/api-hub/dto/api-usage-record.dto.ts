import { IsUUID, IsInt, IsString, IsOptional, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateUsageRecordDto {
  @IsUUID()
  keyId!: string;

  @IsUUID()
  modelId!: string;

  @IsOptional()
  @IsString()
  requestId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  inputTokens!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  outputTokens!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalTokens!: number;

  @Type(() => Number)
  @Min(0)
  cost!: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class QueryUsageRecordDto {
  @IsOptional()
  @IsUUID()
  keyId?: string;

  @IsOptional()
  @IsUUID()
  modelId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  page?: number;
  pageSize?: number;
}

export class UsageStatsDto {
  totalTokens!: number;
  totalCost!: number;
  totalRequests!: number;
  byModel!: { modelId: string; modelName: string; tokens: number; cost: number; requests: number }[];
  byDay!: { date: string; tokens: number; cost: number; requests: number }[];
}
