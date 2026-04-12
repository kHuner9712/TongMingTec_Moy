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

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  externalTxnId?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class PaymentListQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'processing', 'succeeded', 'failed', 'refunded', 'voided'])
  status?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
