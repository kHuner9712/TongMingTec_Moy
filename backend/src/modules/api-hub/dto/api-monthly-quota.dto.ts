import { IsUUID, IsString, IsInt, IsOptional, IsIn, Min } from "class-validator";
import { Type } from "class-transformer";

export class SetMonthlyQuotaDto {
  @IsUUID()
  modelId!: string;

  @IsString()
  period!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quotaLimit!: number;

  @IsOptional()
  @IsIn(["token", "request"])
  quotaUnit?: string;
}

export class UpdateMonthlyQuotaDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quotaLimit!: number;
}

export class QueryMonthlyQuotaDto {
  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsUUID()
  modelId?: string;
}

export class MonthlyQuotaResponseDto {
  id!: string;
  projectId!: string;
  modelId!: string;
  modelName?: string;
  period!: string;
  quotaUnit!: string;
  quotaLimit!: number;
  quotaUsed!: number;
  usagePercent!: number;
  resetAt!: string | null;
  createdAt!: string;
  updatedAt!: string;
}
