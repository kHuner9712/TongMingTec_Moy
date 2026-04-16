import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";

export enum ApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

@Entity("ai_approval_requests")
export class AiApprovalRequest extends BaseEntity {
  @Column({ type: "uuid", name: "agent_run_id", nullable: true })
  @Index()
  agentRunId: string | null;

  @Column({ type: "uuid", name: "customer_id", nullable: true })
  @Index()
  customerId: string | null;

  @Column({ type: "varchar", length: 64, name: "resource_type" })
  resourceType: string;

  @Column({ type: "uuid", name: "resource_id", nullable: true })
  resourceId: string | null;

  @Column({ type: "varchar", length: 64, name: "requested_action" })
  requestedAction: string;

  @Column({ type: "varchar", length: 16, name: "risk_level" })
  riskLevel: string;

  @Column({ type: "varchar", length: 16, default: ApprovalStatus.PENDING })
  @Index()
  status: ApprovalStatus;

  @Column({ type: "jsonb", name: "before_snapshot", nullable: true })
  beforeSnapshot: Record<string, unknown> | null;

  @Column({ type: "jsonb", name: "proposed_after_snapshot", nullable: true })
  proposedAfterSnapshot: Record<string, unknown> | null;

  @Column({ type: "text" })
  explanation: string;

  @Column({ type: "uuid", name: "approver_user_id", nullable: true })
  approverUserId: string | null;

  @Column({ type: "timestamptz", name: "approved_at", nullable: true })
  approvedAt: Date | null;

  @Column({ type: "timestamptz", name: "expires_at", nullable: true })
  expiresAt: Date | null;

  @Column({ type: "varchar", length: 16, name: "source", default: "ai_agent" })
  source: string;
}
