import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class ExecuteAgentDto {
  @IsNotEmpty()
  input: Record<string, unknown>;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
