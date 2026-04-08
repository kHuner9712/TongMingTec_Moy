import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class RegisterToolDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  toolType: string;

  @IsNotEmpty()
  config: Record<string, unknown>;

  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  riskLevel: string;
}
