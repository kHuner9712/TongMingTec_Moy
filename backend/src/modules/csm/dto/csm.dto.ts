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

export class EvaluateHealthDto {
  @IsUUID()
  customerId: string;
}

export class CreateSuccessPlanDto {
  @IsUUID()
  customerId: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsUUID()
  ownerUserId: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class UpdateSuccessPlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'on_hold', 'completed', 'cancelled'])
  status?: SuccessPlanStatus;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsInt()
  @Min(1)
  version: number;
}

export class CreateReturnVisitDto {
  @IsUUID()
  customerId: string;

  @IsString()
  @MaxLength(32)
  visitType: string;

  @IsString()
  summary: string;

  @IsOptional()
  @IsDateString()
  nextVisitAt?: string;
}

export class HealthListQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  level?: HealthLevel;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}

export class SuccessPlanListQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(['draft', 'active', 'on_hold', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
