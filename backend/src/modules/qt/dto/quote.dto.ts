import {
  IsUUID,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  MinLength,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PageQueryDto } from '../../../common/dto/pagination.dto';

export class QuoteItemInput {
  @IsString()
  @MaxLength(32)
  itemType: string;

  @IsOptional()
  @IsUUID()
  refId?: string;

  @IsString()
  @MaxLength(128)
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateQuoteDto {
  @IsUUID()
  opportunityId: string;

  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => QuoteItemInput)
  items: QuoteItemInput[];
}

export class UpdateQuoteDto {
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemInput)
  items?: QuoteItemInput[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;

  @IsInt()
  @Min(1)
  version: number;
}

export class SubmitApprovalDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  approverIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment?: string;

  @IsInt()
  @Min(1)
  version: number;
}

export class ApproveQuoteDto {
  @IsEnum(['approved', 'rejected'])
  action: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment?: string;
}

export class SendQuoteDto {
  @IsEnum(['email', 'wechat', 'portal'])
  channel: string;

  @IsString()
  @MaxLength(128)
  receiver: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  message?: string;

  @IsInt()
  @Min(1)
  version: number;
}

export class QuoteListQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(['draft', 'pending_approval', 'approved', 'sent', 'accepted', 'rejected', 'expired'])
  status?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @IsOptional()
  @IsDateString()
  validUntilLte?: string;
}
