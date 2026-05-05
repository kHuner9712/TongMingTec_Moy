export interface GeoLeadBrief {
  id: string; companyName: string; brandName: string; status: string;
  contactName: string; contactMethod: string; createdAt: string; updatedAt: string;
}

export interface GeoReportBrief {
  id: string; title: string; leadId: string | null; status: string; createdAt: string; updatedAt: string;
}

export interface GeoBrandAssetBrief {
  id: string; title: string; leadId: string | null; brandName: string | null; status: string; createdAt: string; updatedAt: string;
}

export interface GeoContentTopicBrief {
  id: string; title: string; leadId: string | null; status: string; contentType: string | null; createdAt: string;
}

export interface GeoContentPlanBrief {
  id: string; title: string; leadId: string | null; status: string; createdAt: string;
}

export interface GeoContentDraftBrief {
  id: string; title: string; leadId: string | null; status: string; contentType: string | null; createdAt: string;
}

export interface DashboardData {
  leads: GeoLeadBrief[]; leadsError: string;
  reports: GeoReportBrief[]; reportsError: string;
  brandAssets: GeoBrandAssetBrief[]; brandAssetsError: string;
  topics: GeoContentTopicBrief[]; topicsError: string;
  plans: GeoContentPlanBrief[]; plansError: string;
  drafts: GeoContentDraftBrief[]; draftsError: string;
}

export interface KpiSnapshot {
  leadsTotal: number;
  leadsReceived: number;
  leadsQualified: number;
  leadsWon: number;
  reportsCount: number;
  brandAssetsCount: number;
  topicsCount: number;
  draftsCount: number;
}

export interface TodoItem {
  type: string;
  title: string;
  leadId?: string;
  link: string;
  label: string;
}

export interface RiskItem {
  companyName: string;
  brandName: string;
  riskType: string;
  action: string;
  leadId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number };
}
