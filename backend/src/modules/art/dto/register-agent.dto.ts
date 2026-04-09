import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class RegisterAgentDto {
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
  agentType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  executionMode: string;

  @IsNotEmpty()
  resourceScope: Record<string, unknown>;

  @IsNotEmpty()
  toolScope: Record<string, unknown>;

  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  riskLevel: string;

  @IsNotEmpty()
  inputSchema: Record<string, unknown>;

  @IsNotEmpty()
  outputSchema: Record<string, unknown>;

  @IsOptional()
  requiresApproval?: boolean;

  @IsOptional()
  rollbackStrategy?: Record<string, unknown>;

  @IsOptional()
  takeoverStrategy?: Record<string, unknown>;
}
