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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'a808204d-40a4-4a2f-8a5d-f86c06a8bc42' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ example: '35d267f8-d9d1-4a70-b8ec-5786fdbb2b18' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ example: '63a3ea93-c41d-4fef-8ba8-b68f5cf3cf14' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiProperty({ example: '2026-04-15T00:00:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ example: '2027-04-15T00:00:00.000Z' })
  @IsDateString()
  endsAt: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ example: 10, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  seatCount?: number;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ example: 20, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  seatCount?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ example: '2028-04-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;
}

export class SuspendSubscriptionDto {
  @ApiProperty({ example: '客户欠费' })
  @IsString()
  @MaxLength(255)
  reason: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;
}

export class RenewSubscriptionDto {
  @ApiProperty({ example: '2028-04-15T00:00:00.000Z' })
  @IsDateString()
  newEndsAt: string;

  @ApiPropertyOptional({ example: '35d267f8-d9d1-4a70-b8ec-5786fdbb2b18' })
  @IsOptional()
  @IsUUID()
  renewedByOrderId?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ example: '客户主动取消' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

export class SubscriptionListQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: ['trial', 'active', 'overdue', 'suspended', 'expired', 'cancelled'] })
  @IsOptional()
  @IsEnum(['trial', 'active', 'overdue', 'suspended', 'expired', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ example: 'a808204d-40a4-4a2f-8a5d-f86c06a8bc42' })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
