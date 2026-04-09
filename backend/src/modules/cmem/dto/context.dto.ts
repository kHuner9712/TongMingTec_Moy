import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class UpdateContextDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  contextType: string;

  @IsNotEmpty()
  contextData: Record<string, unknown>;

  @IsOptional()
  @MaxLength(64)
  lastUpdatedFrom?: string;
}
