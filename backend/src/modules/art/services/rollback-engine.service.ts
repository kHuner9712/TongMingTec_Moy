import { Injectable } from "@nestjs/common";
import { RollbackCenterService } from "../../rollback-center/services/rollback-center.service";
import { AiRollback } from "../entities/ai-rollback.entity";

@Injectable()
export class RollbackEngineService {
  constructor(private readonly rollbackCenterService: RollbackCenterService) {}

  async rollback(
    agentRunId: string,
    orgId: string,
    userId: string,
  ): Promise<AiRollback> {
    return this.rollbackCenterService.rollback(agentRunId, orgId, userId);
  }

  async getRollbackRecords(
    orgId: string,
    filters?: { agentRunId?: string },
  ): Promise<AiRollback[]> {
    return this.rollbackCenterService.getRollbackRecords(orgId, filters);
  }
}
