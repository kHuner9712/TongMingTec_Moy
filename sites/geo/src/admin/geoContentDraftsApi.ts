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

export interface GeoContentDraftBrief {
  id: string; leadId: string | null; brandAssetId: string | null; reportId: string | null;
  topicId: string | null; planId: string | null;
  title: string; contentType: string | null; targetKeyword: string | null;
  platform: string | null; status: string;
  plannedPublishDate: string | null; publishedUrl: string | null;
  createdAt: string; updatedAt: string;
}

export interface GeoContentDraftFull extends GeoContentDraftBrief {
  slug: string | null; targetQuestion: string | null; targetAudience: string | null;
  summary: string | null; outline: string | null; body: string | null;
  markdown: string | null; seoTitle: string | null; metaDescription: string | null;
  tags: string[] | null; complianceChecklist: string[] | null;
  reviewNotes: string | null; actualPublishDate: string | null;
}

export interface GeoContentDraftPaginated {
  data: GeoContentDraftBrief[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface CreateDraftPayload {
  leadId?: string; brandAssetId?: string; reportId?: string;
  topicId?: string; planId?: string;
  title?: string; slug?: string; contentType?: string;
  targetKeyword?: string; targetQuestion?: string; targetAudience?: string;
  platform?: string; status?: string; summary?: string;
  outline?: string; body?: string; markdown?: string;
  seoTitle?: string; metaDescription?: string; tags?: string[];
  complianceChecklist?: string[]; reviewNotes?: string;
  publishedUrl?: string; plannedPublishDate?: string; actualPublishDate?: string;
}

export function fetchContentDrafts(params: Record<string, string | number | undefined> = {}): Promise<GeoContentDraftPaginated> {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  return request(`/geo-content-drafts?${sp.toString()}`);
}

export function fetchContentDraftById(id: string): Promise<GeoContentDraftFull> {
  return request(`/geo-content-drafts/${id}`);
}

export function createContentDraft(payload: CreateDraftPayload): Promise<GeoContentDraftFull> {
  return request("/geo-content-drafts", { method: "POST", body: JSON.stringify(payload) });
}

export function updateContentDraft(id: string, payload: Partial<CreateDraftPayload>): Promise<GeoContentDraftFull> {
  return request(`/geo-content-drafts/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function updateContentDraftStatus(id: string, status: string): Promise<GeoContentDraftFull> {
  return request(`/geo-content-drafts/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export function archiveContentDraft(id: string): Promise<GeoContentDraftFull> {
  return request(`/geo-content-drafts/${id}`, { method: "DELETE" });
}
