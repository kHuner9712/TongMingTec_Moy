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

export class OrderItemInput {
  @IsString()
  @MaxLength(16)
  itemType: string;

  @IsOptional()
  @IsUUID()
  refId?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @IsOptional()
  @IsUUID()
  quoteId?: string;

  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsEnum(['new', 'renewal', 'addon', 'refund'])
  orderType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => OrderItemInput)
  items: OrderItemInput[];
}

export class OrderListQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(['draft', 'confirmed', 'active', 'completed', 'cancelled', 'refunded'])
  status?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsEnum(['new', 'renewal', 'addon', 'refund'])
  orderType?: string;
}
