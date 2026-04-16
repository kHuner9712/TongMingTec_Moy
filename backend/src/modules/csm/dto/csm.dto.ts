import {
  IsUUID,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  IsEnum,
  IsDateString,
  IsObject,
} from 'class-validator';
import { PageQueryDto } from '../../../common/dto/pagination.dto';
import { HealthLevel } from '../entities/customer-health-score.entity';
import { SuccessPlanStatus } from '../entities/success-plan.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EvaluateHealthDto {
  @ApiProperty({ example: 'a808204d-40a4-4a2f-8a5d-f86c06a8bc42' })
  @IsUUID()
  customerId: string;
}

export class CreateSuccessPlanDto {
  @ApiProperty({ example: 'a808204d-40a4-4a2f-8a5d-f86c06a8bc42' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'Q2 上线交付成功计划' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'fdcc8ad6-2b94-4ae6-b4a9-a75baf4b0df3' })
  @IsUUID()
  ownerUserId: string;

  @ApiPropertyOptional({ example: { source: 'subscription.opened' } })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class UpdateSuccessPlanDto {
  @ApiPropertyOptional({ example: 'Q2 交付复盘与续费计划' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ enum: ['draft', 'active', 'on_hold', 'completed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['draft', 'active', 'on_hold', 'completed', 'cancelled'])
  status?: SuccessPlanStatus;

  @ApiPropertyOptional({ example: { risks: ['scope_change'] } })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;
}

export class CreateReturnVisitDto {
  @ApiProperty({ example: 'a808204d-40a4-4a2f-8a5d-f86c06a8bc42' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'quarterly_review' })
  @IsString()
  @MaxLength(32)
  visitType: string;

  @ApiProperty({ example: '客户反馈交付阶段体验良好，建议推进增购方案。' })
  @IsString()
  summary: string;

  @ApiPropertyOptional({ example: '2026-05-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  nextVisitAt?: string;
}

export class HealthListQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'critical'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  level?: HealthLevel;

  @ApiPropertyOptional({ example: 'a808204d-40a4-4a2f-8a5d-f86c06a8bc42' })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}

export class SuccessPlanListQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: ['draft', 'active', 'on_hold', 'completed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['draft', 'active', 'on_hold', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ example: 'a808204d-40a4-4a2f-8a5d-f86c06a8bc42' })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
