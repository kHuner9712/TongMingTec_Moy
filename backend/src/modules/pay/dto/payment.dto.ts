import {
  IsUUID,
  IsOptional,
  IsString,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { PageQueryDto } from '../../../common/dto/pagination.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: '35d267f8-d9d1-4a70-b8ec-5786fdbb2b18' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 'a808204d-40a4-4a2f-8a5d-f86c06a8bc42' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ example: 'bank_transfer' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'CNY' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiProperty({ example: 1999, minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'WX20260415001' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  externalTxnId?: string;

  @ApiPropertyOptional({ example: '首付款' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class PaymentListQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: ['pending', 'processing', 'pending_approval', 'succeeded', 'failed', 'refunded', 'voided'] })
  @IsOptional()
  @IsEnum(['pending', 'processing', 'pending_approval', 'succeeded', 'failed', 'refunded', 'voided'])
  status?: string;

  @ApiPropertyOptional({ example: '35d267f8-d9d1-4a70-b8ec-5786fdbb2b18' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ example: 'a808204d-40a4-4a2f-8a5d-f86c06a8bc42' })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
