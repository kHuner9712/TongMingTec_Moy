import { IsUUID, IsString } from 'class-validator';

export class TakeoverRuntimeDto {
  @IsUUID()
  agentRunId: string;

  @IsString()
  reason: string;
}
