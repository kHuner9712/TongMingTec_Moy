import {
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PageQueryDto } from '../../../common/dto/pagination.dto';
import { BillType } from '../entities/bill.entity';
import { BillItemType } from '../entities/bill-item.entity';
import { BillStatus } from '../../../common/statemachine/definitions/bill.sm';

const BILL_STATUS: BillStatus[] = [
  'draft',
  'issued',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
];
const BILL_TYPE: BillType[] = ['subscription', 'renewal', 'manual'];
const BILL_ITEM_TYPE: BillItemType[] = ['plan', 'add_on', 'quota', 'tax', 'manual'];

export class BillListQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: BILL_STATUS })
  @IsOptional()
  @IsEnum(BILL_STATUS)
  status?: BillStatus;

  @ApiPropertyOptional({ enum: BILL_TYPE })
  @IsOptional()
  @IsEnum(BILL_TYPE)
  billType?: BillType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  overdueOnly?: boolean;
}

export class BillItemInputDto {
  @ApiProperty({ example: '专业版月费' })
  @IsString()
  @MaxLength(128)
  itemName: string;

  @ApiPropertyOptional({ enum: BILL_ITEM_TYPE, default: 'manual' })
  @IsOptional()
  @IsEnum(BILL_ITEM_TYPE)
  itemType?: BillItemType;

  @ApiPropertyOptional({ minimum: 0, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({ example: '2026-05-31' })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateBillDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ enum: BILL_TYPE, default: 'subscription' })
  @IsOptional()
  @IsEnum(BILL_TYPE)
  billType?: BillType;

  @ApiPropertyOptional({ example: 'CNY', default: 'CNY' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiProperty({ example: '2026-06-05T00:00:00.000Z' })
  @IsDateString()
  dueAt: string;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ type: [BillItemInputDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BillItemInputDto)
  @ArrayMinSize(1)
  items?: BillItemInputDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  issueNow?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateBillDto {
  @ApiPropertyOptional({ example: '2026-06-10T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ type: [BillItemInputDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BillItemInputDto)
  @ArrayMinSize(1)
  items?: BillItemInputDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;
}

export class BillActionDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
