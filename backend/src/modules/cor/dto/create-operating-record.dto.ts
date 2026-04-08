import { IsString, IsNotEmpty, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class CreateOperatingRecordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  recordType: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  aiSuggestion?: Record<string, unknown>;

  @IsOptional()
  @MaxLength(64)
  humanDecision?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  sourceType: string;

  @IsOptional()
  @IsUUID()
  sourceId?: string;
}
