import { IsString, IsOptional, IsIn, MaxLength } from "class-validator";

export class CreateApiKeyDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class UpdateApiKeyDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsIn(["active", "revoked", "expired"])
  status?: string;
}

export class QueryApiKeyDto {
  @IsOptional()
  @IsIn(["active", "revoked", "expired"])
  status?: string;

  page?: number;
  pageSize?: number;
}

export class ApiKeyResponseDto {
  id!: string;
  projectId!: string;
  name!: string;
  keyPrefix!: string;
  rawKey!: string;
  status!: string;
  lastUsedAt!: string | null;
  expiresAt!: string | null;
  createdAt!: string;
  updatedAt!: string;
}
