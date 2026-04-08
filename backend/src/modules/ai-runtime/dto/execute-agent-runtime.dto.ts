import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class ExecuteAgentRuntimeDto {
  @IsString()
  agentCode: string;

  @IsObject()
  input: Record<string, unknown>;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
