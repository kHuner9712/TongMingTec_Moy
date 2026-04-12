export interface BaseEntity {
  id: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  mobile: string | null;
  status: "invited" | "active" | "disabled" | "locked";
  orgId: string;
  departmentId: string | null;
  locale: string;
  timezone: string;
  lastLoginAt: string | null;
  roles: string[];
  permissions: string[];
  dataScope: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginResponse {
  user: User;
  tokens: Tokens;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
  };
}

export type CustomerStatus = "potential" | "active" | "silent" | "lost";
export type CustomerLevel = "L1" | "L2" | "L3" | "VIP";

export interface Customer extends BaseEntity {
  name: string;
  industry: string | null;
  level: CustomerLevel | null;
  ownerUserId: string;
  status: CustomerStatus;
  phone: string | null;
  email: string | null;
  address: string | null;
  remark: string | null;
  lastContactAt: string | null;
  ownerUserName?: string;
  riskLevel?: string | null;
}

export interface CustomerContact extends BaseEntity {
  customerId: string;
  name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  remark: string | null;
}

export type LeadStatus =
  | "new"
  | "assigned"
  | "following"
  | "converted"
  | "invalid";

export interface Lead extends BaseEntity {
  source: string;
  name: string;
  mobile: string | null;
  email: string | null;
  companyName: string | null;
  ownerUserId: string | null;
  status: LeadStatus;
  score: number | null;
  scoreReason: string | null;
  lastFollowUpAt: string | null;
  ownerUserName?: string;
}

export interface LeadFollowUp extends BaseEntity {
  leadId: string;
  content: string;
  followType?: string;
  nextAction?: string | null;
  nextActionAt: string | null;
  createdBy: string;
}

export type OpportunityStage =
  | "discovery"
  | "qualification"
  | "proposal"
  | "negotiation";
export type OpportunityResult = "won" | "lost";

export interface Opportunity extends BaseEntity {
  customerId: string;
  leadId: string | null;
  ownerUserId: string;
  name: string;
  amount: number;
  currency: string;
  stage: OpportunityStage;
  result: OpportunityResult | null;
  expectedCloseDate: string | null;
  pauseReason: string | null;
  customerName?: string;
  ownerUserName?: string;
}

export interface OpportunityStageHistory extends BaseEntity {
  opportunityId: string;
  fromStage: OpportunityStage | null;
  toStage: OpportunityStage;
  reason: string | null;
  createdBy: string;
}

export type ConversationStatus = "queued" | "active" | "closed";

export interface Conversation extends BaseEntity {
  channelId: string;
  customerId: string | null;
  subject: string | null;
  assigneeUserId: string | null;
  status: ConversationStatus;
  firstResponseAt: string | null;
  lastMessageAt: string | null;
  closedAt: string | null;
  closedReason: string | null;
  ratingScore: number | null;
  ratingComment: string | null;
  channelName?: string;
  customerName?: string;
  assigneeUserName?: string;
}

export type MessageDirection = "inbound" | "outbound";
export type MessageSenderType = "customer" | "agent" | "ai" | "system";

export interface ConversationMessage extends BaseEntity {
  conversationId: string;
  direction: MessageDirection;
  senderType: MessageSenderType;
  senderId: string | null;
  senderName: string | null;
  content: string;
  contentType: string;
  metadata: Record<string, unknown> | null;
  sentAt: string;
  deliveredAt: string | null;
  readAt: string | null;
}

export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketStatus =
  | "pending"
  | "assigned"
  | "processing"
  | "resolved"
  | "closed";

export interface Ticket extends BaseEntity {
  conversationId: string | null;
  customerId: string | null;
  ticketNo: string;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeUserId: string | null;
  solution: string | null;
  closedReason: string | null;
  slaDueAt: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  customerName?: string;
  assigneeUserName?: string;
}

export interface TicketLog extends BaseEntity {
  ticketId: string;
  action: string;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus | null;
  fromUserId: string | null;
  toUserId: string | null;
  remark: string | null;
  createdBy: string;
}

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Task extends BaseEntity {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TicketPriority;
  dueDate: string | null;
  assigneeUserId: string | null;
  relatedType: string | null;
  relatedId: string | null;
  completedAt: string | null;
  assigneeUserName?: string;
}

export interface Notification extends BaseEntity {
  userId: string;
  type?: string;
  notificationType?: string;
  category?: string;
  title: string;
  content: string | null;
  isRead: boolean;
  readAt: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
}

export interface Channel extends BaseEntity {
  type: string;
  name: string;
  config: Record<string, unknown> | null;
  isActive: boolean;
}

export type AiTaskStatus = "pending" | "running" | "completed" | "failed";

export interface AiTask extends BaseEntity {
  type: string;
  status: AiTaskStatus;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: string | null;
  costTokens: number | null;
  costAmount: number | null;
  relatedType: string | null;
  relatedId: string | null;
  completedAt: string | null;
}

export interface AuditLog extends BaseEntity {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
}

export interface DashboardSummary {
  customerCount: number;
  pendingLeadCount: number;
  activeOpportunityCount: number;
  pendingConversationCount: number;
  pendingTicketCount: number;
  pendingTaskCount: number;
}

export interface ApiResponse<T = unknown> {
  code?: string;
  message?: string;
  data?: T;
  items?: T[];
  meta?: PaginatedResponse<T>["meta"];
}

export interface CreateCustomerDto {
  name: string;
  industry?: string;
  level?: CustomerLevel;
  phone?: string;
  email?: string;
  address?: string;
  remark?: string;
}

export interface UpdateCustomerDto {
  industry?: string;
  level?: CustomerLevel;
  phone?: string;
  email?: string;
  address?: string;
  remark?: string;
  version: number;
}

export interface CreateLeadDto {
  source?: string;
  name: string;
  mobile?: string;
  email?: string;
  companyName?: string;
}

export interface UpdateLeadDto {
  source?: string;
  name?: string;
  mobile?: string;
  email?: string;
  companyName?: string;
  version: number;
}

export interface CreateOpportunityDto {
  customerId: string;
  leadId?: string;
  name: string;
  amount?: number;
  currency?: string;
  expectedCloseDate?: string;
}

export interface UpdateOpportunityDto {
  name?: string;
  amount?: number;
  currency?: string;
  expectedCloseDate?: string;
  version: number;
}

export interface CreateTicketDto {
  conversationId?: string;
  customerId?: string;
  title: string;
  description?: string;
  priority?: TicketPriority;
}

export interface UpdateTicketDto {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  version: number;
}

export type TimelineActorType = "customer" | "user" | "ai" | "system";

export interface CustomerTimelineEvent {
  id: string;
  orgId: string;
  customerId: string;
  eventType: string;
  eventSource: string;
  eventPayload: Record<string, unknown>;
  occurredAt: string;
  actorType: TimelineActorType;
  actorId: string | null;
  createdAt: string;
}

export interface CustomerOperatingRecord extends BaseEntity {
  customerId: string;
  recordType: string;
  content: string;
  aiSuggestion: Record<string, unknown> | null;
  humanDecision: string | null;
  sourceType: string;
  sourceId: string | null;
}

export interface Customer360View {
  customer: Customer;
  contacts: CustomerContact[];
  leads: Lead[];
  opportunities: Opportunity[];
  conversations: Conversation[];
  tickets: Ticket[];
  latestContext: Record<string, unknown> | null;
  currentIntent: { intentType: string; confidence: number } | null;
  riskLevel: string | null;
  nextActions: CustomerNextAction[];
}

export interface CustomerContext extends BaseEntity {
  customerId: string;
  contextType: string;
  contextData: Record<string, unknown>;
  lastUpdatedFrom: string | null;
  expiresAt: string | null;
}

export interface CustomerIntent extends BaseEntity {
  customerId: string;
  intentType: string;
  confidence: number;
  evidence: Record<string, unknown>;
  detectedAt: string;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface CustomerRisk extends BaseEntity {
  customerId: string;
  riskLevel: RiskLevel;
  riskFactors: Record<string, unknown>;
  assessedAt: string;
}

export type NextActionStatus = "pending" | "accepted" | "dismissed" | "expired";

export interface CustomerNextAction extends BaseEntity {
  customerId: string;
  actionType: string;
  priority: number;
  reasoning: string;
  suggestedBy: string;
  suggestedAt: string;
  status: NextActionStatus;
}

export type AgentExecutionMode = "suggest" | "assist" | "auto" | "approval";
export type AgentStatus = "draft" | "active" | "paused" | "archived";

export interface AiAgent extends BaseEntity {
  code: string;
  name: string;
  agentType: string;
  executionMode: AgentExecutionMode;
  resourceScope: Record<string, unknown>;
  toolScope: Record<string, unknown>;
  riskLevel: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  requiresApproval: boolean;
  rollbackStrategy: Record<string, unknown> | null;
  takeoverStrategy: Record<string, unknown> | null;
  status: AgentStatus;
}

export type AgentRunStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "awaiting_approval"
  | "rolled_back"
  | "taken_over";

export interface AiAgentRun {
  id: string;
  orgId: string;
  agentId: string;
  customerId: string | null;
  requestId: string | null;
  status: AgentRunStatus;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown> | null;
  executionMode: string;
  latencyMs: number | null;
  tokenCost: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export interface AiApprovalRequest extends BaseEntity {
  agentRunId: string;
  customerId: string | null;
  resourceType: string;
  resourceId: string | null;
  requestedAction: string;
  riskLevel: string;
  status: ApprovalStatus;
  beforeSnapshot: Record<string, unknown> | null;
  proposedAfterSnapshot: Record<string, unknown> | null;
  explanation: string;
  approverUserId: string | null;
  approvedAt: string | null;
  expiresAt: string | null;
}

export interface AiRollback {
  id: string;
  orgId: string;
  agentRunId: string;
  customerId: string | null;
  resourceType: string;
  resourceId: string | null;
  rollbackScope: Record<string, unknown>;
  beforeSnapshot: Record<string, unknown> | null;
  result: string;
  rolledBackBy: string | null;
  rolledBackAt: string;
  createdAt: string;
}

export interface AiTakeover {
  id: string;
  orgId: string;
  agentRunId: string;
  customerId: string | null;
  resourceType: string;
  resourceId: string | null;
  takeoverUserId: string;
  reason: string;
  takeoverAt: string;
  createdAt: string;
}

export interface AiPromptTemplate extends BaseEntity {
  templateCode: string;
  agentCode: string;
  templateVersion: number;
  systemPrompt: string;
  userPromptPattern: string;
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
  safetyRules: Record<string, unknown> | null;
  enabled: boolean;
}

export type ToolType =
  | "read_api"
  | "write_api"
  | "kb_search"
  | "workflow_execute"
  | "integration_execute"
  | "notification_send"
  | "report_export";

export interface AiTool extends BaseEntity {
  code: string;
  name: string;
  toolType: ToolType;
  config: Record<string, unknown>;
  riskLevel: string;
  enabled: boolean;
}

export interface WorkbenchTodoItem {
  id: string;
  type:
    | "ai_suggestion"
    | "pending_approval"
    | "pending_conversation"
    | "pending_ticket"
    | "pending_task";
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  relatedType?: string;
  relatedId?: string;
  createdAt: string;
}

export interface WorkbenchAiInsight {
  id: string;
  type:
    | "risk_alert"
    | "opportunity_hint"
    | "followup_reminder"
    | "churn_warning";
  title: string;
  description: string;
  severity: "info" | "warning" | "error";
  relatedType?: string;
  relatedId?: string;
}

export type SnapshotType =
  | "pre_execution"
  | "post_execution"
  | "manual"
  | "scheduled";

export interface CustomerStateSnapshot {
  id: string;
  orgId: string;
  customerId: string;
  snapshotType: SnapshotType;
  stateData: Record<string, unknown>;
  agentRunId: string | null;
  triggerEvent: string | null;
  createdAt: string;
  createdBy: string | null;
}
