import {
  IsUUID,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PageQueryDto } from '../../../common/dto/pagination.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemInput {
  @ApiProperty({ example: 'plan' })
  @IsString()
  @MaxLength(16)
  itemType: string;

  @ApiPropertyOptional({ example: '5d80dfb7-f2ad-4f20-aa29-7f4d42b4ebf8' })
  @IsOptional()
  @IsUUID()
  refId?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 1999, minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ example: '24dd314b-bac1-4502-bf68-3a2cb204f26a' })
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @ApiPropertyOptional({ example: 'e0dfc5de-e5de-4fd4-803f-f43e0f5563d5' })
  @IsOptional()
  @IsUUID()
  quoteId?: string;

  @ApiProperty({ example: 'a808204d-40a4-4a2f-8a5d-f86c06a8bc42' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ enum: ['new', 'renewal', 'addon', 'refund'] })
  @IsOptional()
  @IsEnum(['new', 'renewal', 'addon', 'refund'])
  orderType?: string;

  @ApiPropertyOptional({ example: 'CNY' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiProperty({ type: [OrderItemInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => OrderItemInput)
  items: OrderItemInput[];
}

export class OrderListQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: ['draft', 'pending_approval', 'confirmed', 'active', 'completed', 'cancelled', 'refunded'] })
  @IsOptional()
  @IsEnum(['draft', 'pending_approval', 'confirmed', 'active', 'completed', 'cancelled', 'refunded'])
  status?: string;

  @ApiPropertyOptional({ example: 'a808204d-40a4-4a2f-8a5d-f86c06a8bc42' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ enum: ['new', 'renewal', 'addon', 'refund'] })
  @IsOptional()
  @IsEnum(['new', 'renewal', 'addon', 'refund'])
  orderType?: string;
}
