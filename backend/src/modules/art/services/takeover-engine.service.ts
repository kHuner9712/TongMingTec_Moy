import { Injectable } from "@nestjs/common";
import { TakeoverCenterService } from "../../takeover-center/services/takeover-center.service";
import { AiTakeover } from "../entities/ai-takeover.entity";

@Injectable()
export class TakeoverEngineService {
  constructor(private readonly takeoverCenterService: TakeoverCenterService) {}

  async takeover(
    agentRunId: string,
    orgId: string,
    userId: string,
    reason: string,
  ): Promise<AiTakeover> {
    return this.takeoverCenterService.takeover(
      agentRunId,
      orgId,
      userId,
      reason,
    );
  }

  async getTakeoverRecords(
    orgId: string,
    filters?: { agentRunId?: string },
  ): Promise<AiTakeover[]> {
    return this.takeoverCenterService.getTakeoverRecords(orgId, filters);
  }
}
