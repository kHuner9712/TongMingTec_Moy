import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class TakeoverDto {
  @IsUUID()
  agentRunId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
