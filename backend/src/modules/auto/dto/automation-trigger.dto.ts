import {
  IsString,
  IsOptional,
  IsObject,
  MaxLength,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { PageQueryDto } from '../../../common/dto/pagination.dto';

export class CreateAutomationTriggerDto {
  @IsString()
  @MaxLength(64)
  name: string;

  @IsString()
  @MaxLength(128)
  eventType: string;

  @IsString()
  @MaxLength(64)
  actionType: string;

  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  actionPayload?: Record<string, unknown>;
}

export class UpdateAutomationTriggerDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  eventType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  actionType?: string;

  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  actionPayload?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(['active', 'paused', 'archived'])
  status?: string;

  @IsInt()
  @Min(1)
  version: number;
}

export class AutomationTriggerListQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(['active', 'paused', 'archived'])
  status?: string;

  @IsOptional()
  @IsString()
  eventType?: string;
}
