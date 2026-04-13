import {
  IsUUID,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { PageQueryDto } from '../../../common/dto/pagination.dto';

export class CreateSubscriptionDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  planId?: string;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  seatCount?: number;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  seatCount?: number;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsInt()
  @Min(1)
  version: number;
}

export class SuspendSubscriptionDto {
  @IsString()
  @MaxLength(255)
  reason: string;

  @IsInt()
  @Min(1)
  version: number;
}

export class SubscriptionListQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(['trial', 'active', 'overdue', 'suspended', 'expired', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
