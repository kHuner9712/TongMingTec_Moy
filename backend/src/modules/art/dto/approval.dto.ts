import { IsUUID } from "class-validator";

export class ApproveRequestDto {
  @IsUUID()
  id: string;
}

export class RejectRequestDto {
  @IsUUID()
  id: string;

  reason?: string;

  version: number;
}
