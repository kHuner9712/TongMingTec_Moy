export type GeoLeadStatus =
  | "received"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "won"
  | "lost"
  | "archived";

export interface GeoLead {
  id: string;
  companyName: string;
  brandName: string;
  website: string;
  industry: string;
  targetCity: string | null;
  competitors: string | null;
  contactName: string;
  contactMethod: string;
  notes: string | null;
  source: string;
  status: GeoLeadStatus;
  assignedTo: string | null;
  firstContactedAt: string | null;
  convertedToCustomerId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface UpdateStatusPayload {
  status: GeoLeadStatus;
  notes?: string;
}

export const STATUS_LABELS: Record<GeoLeadStatus, string> = {
  received: "待处理",
  contacted: "已联系",
  qualified: "有效线索",
  proposal_sent: "已发方案",
  won: "已成交",
  lost: "已丢失",
  archived: "已归档",
};

export const ALL_STATUSES: GeoLeadStatus[] = [
  "received",
  "contacted",
  "qualified",
  "proposal_sent",
  "won",
  "lost",
  "archived",
];
