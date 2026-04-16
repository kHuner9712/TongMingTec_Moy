import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  MaxLength,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { PageQueryDto } from '../../../common/dto/pagination.dto';

export class CreateAutomationFlowDto {
  @IsString()
  @MaxLength(64)
  code: string;

  @IsString()
  @MaxLength(128)
  name: string;

  @IsString()
  @MaxLength(32)
  triggerType: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  triggerEventType?: string;

  @IsOptional()
  @IsObject()
  triggerCondition?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  definition?: Record<string, unknown>[];
}

export class UpdateAutomationFlowDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  triggerType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  triggerEventType?: string;

  @IsOptional()
  @IsObject()
  triggerCondition?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  definition?: Record<string, unknown>[];

  @IsOptional()
  @IsEnum(['draft', 'active', 'paused', 'archived'])
  status?: string;

  @IsInt()
  @Min(1)
  version: number;
}

export class AutomationFlowListQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(['draft', 'active', 'paused', 'archived'])
  status?: string;

  @IsOptional()
  @IsString()
  triggerType?: string;
}
