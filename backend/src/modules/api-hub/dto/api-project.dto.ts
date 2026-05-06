import { IsString, IsOptional, IsUUID, IsIn, MaxLength } from "class-validator";

export class CreateApiProjectDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  orgId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  defaultModelId?: string;
}

export class UpdateApiProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  defaultModelId?: string;

  @IsOptional()
  @IsIn(["active", "suspended", "archived"])
  status?: string;
}

export class QueryApiProjectDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(["active", "suspended", "archived"])
  status?: string;

  @IsOptional()
  @IsUUID()
  orgId?: string;

  page?: number;
  pageSize?: number;
}
