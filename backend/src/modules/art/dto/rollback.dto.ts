import { IsUUID, IsOptional, IsString } from 'class-validator';

export class RollbackDto {
  @IsUUID()
  agentRunId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
