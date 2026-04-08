import { IsUUID } from 'class-validator';

export class RollbackRuntimeDto {
  @IsUUID()
  agentRunId: string;
}
