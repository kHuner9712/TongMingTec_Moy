import { IsString, IsOptional, IsIn, IsInt, MaxLength } from "class-validator";

export class CreateProviderConfigDto {
  @IsString()
  @MaxLength(64)
  provider!: string;

  @IsString()
  @MaxLength(128)
  displayName!: string;

  @IsString()
  @MaxLength(512)
  baseUrl!: string;

  @IsString()
  @MaxLength(128)
  apiKeyEnvName!: string;

  @IsOptional()
  @IsInt()
  timeoutMs?: number;
}

export class UpdateProviderConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  baseUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  apiKeyEnvName?: string;

  @IsOptional()
  @IsIn(["active", "inactive", "error"])
  status?: string;

  @IsOptional()
  @IsInt()
  timeoutMs?: number;
}
