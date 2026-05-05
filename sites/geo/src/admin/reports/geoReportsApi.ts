import { getToken, getBaseUrl } from "../geoAdminApi";

const BASE = () => getBaseUrl();

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE()}${path}`;
  const res = await fetch(url, { ...options, headers: { ...authHeaders(), ...(options.headers as Record<string, string> || {}) } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body.message || `请求失败 (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export interface GeoReportBrief {
  id: string;
  leadId: string | null;
  title: string;
  companyName: string;
  brandName: string;
  website: string;
  industry: string;
  targetCity: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeoReportFull extends GeoReportBrief {
  contactName: string | null;
  diagnosisDate: string | null;
  platforms: string[] | null;
  competitors: string | null;
  targetQuestions: string | null;
  testResults: any[] | null;
  visibilitySummary: string | null;
  mainProblems: string | null;
  opportunities: string | null;
  recommendedActions: string | null;
  markdown: string | null;
}

export interface GeoReportsPaginated {
  data: GeoReportBrief[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface CreateReportPayload {
  leadId?: string;
  title?: string;
  companyName?: string;
  brandName?: string;
  website?: string;
  industry?: string;
  targetCity?: string;
  contactName?: string;
  diagnosisDate?: string;
  platforms?: string[];
  competitors?: string;
  targetQuestions?: string;
  testResults?: any[];
  visibilitySummary?: string;
  mainProblems?: string;
  opportunities?: string;
  recommendedActions?: string;
  markdown?: string;
}

export interface QueryReportsParams {
  leadId?: string;
  status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchReports(params: QueryReportsParams = {}): Promise<GeoReportsPaginated> {
  const search = new URLSearchParams();
  if (params.leadId) search.set("leadId", params.leadId);
  if (params.status) search.set("status", params.status);
  if (params.keyword) search.set("keyword", params.keyword);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  return request(`/geo-reports?${search.toString()}`);
}

export async function fetchReportById(id: string): Promise<GeoReportFull> {
  return request(`/geo-reports/${id}`);
}

export async function createReport(payload: CreateReportPayload): Promise<GeoReportFull> {
  return request("/geo-reports", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateReport(id: string, payload: Partial<CreateReportPayload>): Promise<GeoReportFull> {
  return request(`/geo-reports/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function updateReportStatus(id: string, status: string): Promise<GeoReportFull> {
  return request(`/geo-reports/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export async function archiveReport(id: string): Promise<GeoReportFull> {
  return request(`/geo-reports/${id}`, { method: "DELETE" });
}
