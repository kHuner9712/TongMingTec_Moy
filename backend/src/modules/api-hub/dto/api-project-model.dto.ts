import { IsUUID, IsBoolean, IsOptional } from "class-validator";

export class AddProjectModelDto {
  @IsUUID()
  modelId!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateProjectModelDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
