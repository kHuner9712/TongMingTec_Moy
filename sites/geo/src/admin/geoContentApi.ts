import { getToken, getBaseUrl } from "./geoAdminApi";

function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = `${getBaseUrl()}${path}`;
  return fetch(url, { ...options, headers: { ...headers, ...(options.headers as any || {}) } })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err: any = new Error(body.message || `请求失败 (${res.status})`);
        err.status = res.status;
        throw err;
      }
      return res.json();
    });
}

export interface GeoContentTopicBrief {
  id: string; leadId: string | null; brandAssetId: string | null; reportId: string | null;
  title: string; contentType: string; targetKeyword: string | null; targetQuestion: string | null;
  priority: string; status: string;
  plannedPublishDate: string | null; publishedUrl: string | null;
  createdAt: string; updatedAt: string;
}

export interface GeoContentTopicFull extends GeoContentTopicBrief {
  targetAudience: string | null; searchIntent: string | null;
  platformSuggestion: string | null; outline: string | null;
  keyPoints: string[] | null; referenceMaterials: string[] | null;
  complianceNotes: string | null; actualPublishDate: string | null;
}

export interface GeoContentTopicPaginated {
  data: GeoContentTopicBrief[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface CreateTopicPayload {
  leadId?: string; brandAssetId?: string; reportId?: string;
  title?: string; contentType?: string; targetKeyword?: string;
  targetQuestion?: string; targetAudience?: string; searchIntent?: string;
  platformSuggestion?: string; priority?: string; status?: string;
  outline?: string; keyPoints?: string[]; referenceMaterials?: string[];
  complianceNotes?: string; plannedPublishDate?: string;
  actualPublishDate?: string; publishedUrl?: string;
}

export function fetchTopics(params: Record<string, string | number | undefined> = {}): Promise<GeoContentTopicPaginated> {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  return request(`/geo-content-topics?${sp.toString()}`);
}

export function fetchTopicById(id: string): Promise<GeoContentTopicFull> {
  return request(`/geo-content-topics/${id}`);
}

export function createTopic(payload: CreateTopicPayload): Promise<GeoContentTopicFull> {
  return request("/geo-content-topics", { method: "POST", body: JSON.stringify(payload) });
}

export function updateTopic(id: string, payload: Partial<CreateTopicPayload>): Promise<GeoContentTopicFull> {
  return request(`/geo-content-topics/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function updateTopicStatus(id: string, status: string): Promise<GeoContentTopicFull> {
  return request(`/geo-content-topics/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export function archiveTopic(id: string): Promise<GeoContentTopicFull> {
  return request(`/geo-content-topics/${id}`, { method: "DELETE" });
}

export interface GeoContentPlanBrief {
  id: string; leadId: string | null; brandAssetId: string | null;
  title: string; month: string | null; goal: string | null; status: string;
  topics: string[] | null; createdAt: string; updatedAt: string;
}

export interface GeoContentPlanFull extends GeoContentPlanBrief {
  targetPlatforms: string[] | null; summary: string | null;
}

export interface GeoContentPlanPaginated {
  data: GeoContentPlanBrief[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface CreatePlanPayload {
  leadId?: string; brandAssetId?: string; title?: string; month?: string;
  goal?: string; targetPlatforms?: string[]; topics?: string[];
  status?: string; summary?: string;
}

export function fetchPlans(params: Record<string, string | number | undefined> = {}): Promise<GeoContentPlanPaginated> {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  return request(`/geo-content-plans?${sp.toString()}`);
}

export function fetchPlanById(id: string): Promise<GeoContentPlanFull> {
  return request(`/geo-content-plans/${id}`);
}

export function createPlan(payload: CreatePlanPayload): Promise<GeoContentPlanFull> {
  return request("/geo-content-plans", { method: "POST", body: JSON.stringify(payload) });
}

export function updatePlan(id: string, payload: Partial<CreatePlanPayload>): Promise<GeoContentPlanFull> {
  return request(`/geo-content-plans/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function updatePlanStatus(id: string, status: string): Promise<GeoContentPlanFull> {
  return request(`/geo-content-plans/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export function archivePlan(id: string): Promise<GeoContentPlanFull> {
  return request(`/geo-content-plans/${id}`, { method: "DELETE" });
}
