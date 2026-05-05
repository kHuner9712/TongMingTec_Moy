import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageQueryDto } from '../../../common/dto/pagination.dto';
import {
  PlanBillingCycle,
  PlanScopeType,
  PlanStatus,
} from '../entities/plan.entity';
import { AddOnBillingType, AddOnStatus } from '../entities/add-on.entity';
import {
  OverageStrategy,
  QuotaPolicyStatus,
  QuotaResetCycle,
} from '../entities/quota-policy.entity';

const PLAN_STATUS: PlanStatus[] = ['active', 'inactive', 'archived'];
const PLAN_SCOPE_TYPE: PlanScopeType[] = ['org', 'global'];
const PLAN_BILLING_CYCLE: PlanBillingCycle[] = ['monthly', 'yearly'];
const ADDON_BILLING_TYPE: AddOnBillingType[] = ['one_time', 'recurring', 'usage'];
const ADDON_STATUS: AddOnStatus[] = ['active', 'inactive', 'archived'];
const QUOTA_RESET_CYCLE: QuotaResetCycle[] = ['monthly', 'yearly', 'never'];
const QUOTA_OVERAGE_STRATEGY: OverageStrategy[] = ['block', 'allow', 'notify'];
const QUOTA_STATUS: QuotaPolicyStatus[] = ['active', 'inactive', 'archived'];

export class PlanListQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: PLAN_STATUS })
  @IsOptional()
  @IsEnum(PLAN_STATUS)
  status?: PlanStatus;

  @ApiPropertyOptional({ enum: PLAN_BILLING_CYCLE })
  @IsOptional()
  @IsEnum(PLAN_BILLING_CYCLE)
  billingCycle?: PlanBillingCycle;

  @ApiPropertyOptional({ enum: PLAN_SCOPE_TYPE })
  @IsOptional()
  @IsEnum(PLAN_SCOPE_TYPE)
  scopeType?: PlanScopeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreatePlanDto {
  @ApiProperty({ example: 'pro_monthly' })
  @IsString()
  @MaxLength(64)
  code: string;

  @ApiProperty({ example: '专业版（月付）' })
  @IsString()
  @MaxLength(64)
  name: string;

  @ApiPropertyOptional({ example: '核心销售与交付功能组合' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: PLAN_BILLING_CYCLE, default: 'monthly' })
  @IsOptional()
  @IsEnum(PLAN_BILLING_CYCLE)
  billingCycle?: PlanBillingCycle;

  @ApiProperty({ example: 1999, minimum: 0 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ example: 'CNY', default: 'CNY' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({ example: 10, minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  seatLimit?: number;

  @ApiPropertyOptional({ enum: PLAN_STATUS, default: 'active' })
  @IsOptional()
  @IsEnum(PLAN_STATUS)
  status?: PlanStatus;

  @ApiPropertyOptional({ enum: PLAN_SCOPE_TYPE, default: 'org' })
  @IsOptional()
  @IsEnum(PLAN_SCOPE_TYPE)
  scopeType?: PlanScopeType;

  @ApiPropertyOptional({ example: '8ad7ae7c-9946-454b-8dbf-73826d7f5d5a' })
  @IsOptional()
  @IsUUID()
  scopeOrgId?: string;

  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ example: '2027-05-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  featureFlagsJson?: Record<string, unknown>;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ example: '专业版（年付）' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({ example: '更新后的描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: PLAN_BILLING_CYCLE })
  @IsOptional()
  @IsEnum(PLAN_BILLING_CYCLE)
  billingCycle?: PlanBillingCycle;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ example: 'CNY' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  seatLimit?: number;

  @ApiPropertyOptional({ enum: PLAN_SCOPE_TYPE })
  @IsOptional()
  @IsEnum(PLAN_SCOPE_TYPE)
  scopeType?: PlanScopeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  scopeOrgId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  featureFlagsJson?: Record<string, unknown>;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;
}

export class PlanStatusChangeDto {
  @ApiProperty({ enum: PLAN_STATUS })
  @IsEnum(PLAN_STATUS)
  status: PlanStatus;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;
}

export class AddOnListQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: ADDON_STATUS })
  @IsOptional()
  @IsEnum(ADDON_STATUS)
  status?: AddOnStatus;

  @ApiPropertyOptional({ enum: ADDON_BILLING_TYPE })
  @IsOptional()
  @IsEnum(ADDON_BILLING_TYPE)
  billingType?: AddOnBillingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  planId?: string;
}

export class CreateAddOnDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiProperty({ example: 'ai_boost_pack' })
  @IsString()
  @MaxLength(64)
  code: string;

  @ApiProperty({ example: 'AI 调用扩展包' })
  @IsString()
  @MaxLength(64)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ADDON_BILLING_TYPE, default: 'one_time' })
  @IsOptional()
  @IsEnum(ADDON_BILLING_TYPE)
  billingType?: AddOnBillingType;

  @ApiProperty({ example: 299, minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 'CNY', default: 'CNY' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  quotaDeltaJson?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ADDON_STATUS, default: 'active' })
  @IsOptional()
  @IsEnum(ADDON_STATUS)
  status?: AddOnStatus;
}

export class UpdateAddOnDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ADDON_BILLING_TYPE })
  @IsOptional()
  @IsEnum(ADDON_BILLING_TYPE)
  billingType?: AddOnBillingType;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ example: 'CNY' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  quotaDeltaJson?: Record<string, unknown>;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;
}

export class AddOnStatusChangeDto {
  @ApiProperty({ enum: ADDON_STATUS })
  @IsEnum(ADDON_STATUS)
  status: AddOnStatus;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;
}

export class QuotaPolicyListQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: QUOTA_STATUS })
  @IsOptional()
  @IsEnum(QUOTA_STATUS)
  status?: QuotaPolicyStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  addOnId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metricCode?: string;
}

export class CreateQuotaPolicyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  addOnId?: string;

  @ApiProperty({ example: 'ai_tokens' })
  @IsString()
  @MaxLength(64)
  metricCode: string;

  @ApiProperty({ example: 100000, minimum: 0 })
  @IsInt()
  @Min(0)
  limitValue: number;

  @ApiPropertyOptional({ enum: QUOTA_RESET_CYCLE, default: 'monthly' })
  @IsOptional()
  @IsEnum(QUOTA_RESET_CYCLE)
  resetCycle?: QuotaResetCycle;

  @ApiPropertyOptional({ enum: QUOTA_OVERAGE_STRATEGY, default: 'block' })
  @IsOptional()
  @IsEnum(QUOTA_OVERAGE_STRATEGY)
  overageStrategy?: OverageStrategy;

  @ApiPropertyOptional({ enum: QUOTA_STATUS, default: 'active' })
  @IsOptional()
  @IsEnum(QUOTA_STATUS)
  status?: QuotaPolicyStatus;
}

export class UpdateQuotaPolicyDto {
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  limitValue?: number;

  @ApiPropertyOptional({ enum: QUOTA_RESET_CYCLE })
  @IsOptional()
  @IsEnum(QUOTA_RESET_CYCLE)
  resetCycle?: QuotaResetCycle;

  @ApiPropertyOptional({ enum: QUOTA_OVERAGE_STRATEGY })
  @IsOptional()
  @IsEnum(QUOTA_OVERAGE_STRATEGY)
  overageStrategy?: OverageStrategy;

  @ApiPropertyOptional({ enum: QUOTA_STATUS })
  @IsOptional()
  @IsEnum(QUOTA_STATUS)
  status?: QuotaPolicyStatus;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;
}

export class QuotaPolicyStatusChangeDto {
  @ApiProperty({ enum: QUOTA_STATUS })
  @IsEnum(QUOTA_STATUS)
  status: QuotaPolicyStatus;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;
}

export class DeleteWithVersionQueryDto {
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hard?: boolean;
}
