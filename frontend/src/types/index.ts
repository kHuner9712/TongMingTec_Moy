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
  status: 'invited' | 'active' | 'disabled' | 'locked';
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

export type CustomerStatus = 'potential' | 'active' | 'silent' | 'lost';
export type CustomerLevel = 'L1' | 'L2' | 'L3' | 'VIP';

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

export type LeadStatus = 'new' | 'assigned' | 'following' | 'converted' | 'invalid';

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

export type OpportunityStage = 'discovery' | 'qualification' | 'proposal' | 'negotiation';
export type OpportunityResult = 'won' | 'lost';

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

export type ConversationStatus = 'queued' | 'waiting' | 'active' | 'paused' | 'closed';

export interface Conversation extends BaseEntity {
  channelId: string;
  customerId: string | null;
  externalId: string | null;
  assigneeUserId: string | null;
  status: ConversationStatus;
  waitingSince: string | null;
  firstResponseAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  ratingScore: number | null;
  ratingComment: string | null;
  channelName?: string;
  customerName?: string;
  assigneeUserName?: string;
}

export type MessageDirection = 'inbound' | 'outbound';
export type MessageSenderType = 'customer' | 'agent' | 'ai' | 'system';

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

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export interface Ticket extends BaseEntity {
  conversationId: string | null;
  customerId: string | null;
  title: string;
  description: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeUserId: string | null;
  solution: string | null;
  closeReason: string | null;
  slaResponseAt: string | null;
  slaResolveAt: string | null;
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

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

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
  type: string;
  title: string;
  content: string | null;
  isRead: boolean;
  readAt: string | null;
  relatedType: string | null;
  relatedId: string | null;
}

export interface Channel extends BaseEntity {
  type: string;
  name: string;
  config: Record<string, unknown> | null;
  isActive: boolean;
}

export type AiTaskStatus = 'pending' | 'running' | 'completed' | 'failed';

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
  meta?: PaginatedResponse<T>['meta'];
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
