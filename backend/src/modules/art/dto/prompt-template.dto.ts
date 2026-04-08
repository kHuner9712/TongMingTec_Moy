import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  MaxLength,
  Min,
} from "class-validator";

export class CreatePromptTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  templateCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  agentCode: string;

  @IsInt()
  @Min(1)
  templateVersion: number;

  @IsString()
  @IsNotEmpty()
  systemPrompt: string;

  @IsString()
  @IsNotEmpty()
  userPromptPattern: string;

  @IsOptional()
  inputSchema?: Record<string, unknown>;

  @IsOptional()
  outputSchema?: Record<string, unknown>;

  @IsOptional()
  safetyRules?: Record<string, unknown>;
}
