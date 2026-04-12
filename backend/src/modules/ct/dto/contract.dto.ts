import {
  IsUUID,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PageQueryDto } from '../../../common/dto/pagination.dto';

export class CreateContractDto {
  @IsOptional()
  @IsUUID()
  quoteId?: string;

  @IsUUID()
  opportunityId: string;

  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsDateString()
  startsOn?: string;

  @IsOptional()
  @IsDateString()
  endsOn?: string;
}

export class UpdateContractDto {
  @IsOptional()
  @IsDateString()
  startsOn?: string;

  @IsOptional()
  @IsDateString()
  endsOn?: string;

  @IsInt()
  @Min(1)
  version: number;
}

export class SubmitApprovalDto {
  @IsArray()
  @ValidateNested({ each: true })
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

export class ApproveContractDto {
  @IsEnum(['approved', 'rejected'])
  action: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment?: string;
}

export class SignContractDto {
  @IsString()
  @MaxLength(32)
  signProvider: string;

  @IsInt()
  @Min(1)
  version: number;
}

export class ContractListQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(['draft', 'pending_approval', 'approved', 'signing', 'active', 'expired', 'terminated'])
  status?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @IsOptional()
  @IsDateString()
  startsOnGte?: string;

  @IsOptional()
  @IsDateString()
  endsOnLte?: string;
}
