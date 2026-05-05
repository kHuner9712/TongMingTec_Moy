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

export interface GeoBrandAssetBrief {
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

export interface GeoBrandAssetFull extends GeoBrandAssetBrief {
  basicInfo: any;
  companyIntro: any;
  serviceItems: any[];
  advantages: any[];
  cases: any[];
  faqs: any[];
  competitorDiffs: any[];
  complianceMaterials: any;
  markdown: string | null;
}

export interface GeoBrandAssetsPaginated {
  data: GeoBrandAssetBrief[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface CreateBrandAssetPayload {
  leadId?: string;
  title?: string;
  companyName?: string;
  brandName?: string;
  website?: string;
  industry?: string;
  targetCity?: string;
  basicInfo?: any;
  companyIntro?: any;
  serviceItems?: any[];
  advantages?: any[];
  cases?: any[];
  faqs?: any[];
  competitorDiffs?: any[];
  complianceMaterials?: any;
  markdown?: string;
}

export interface QueryBrandAssetsParams {
  leadId?: string;
  status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchBrandAssets(params: QueryBrandAssetsParams = {}): Promise<GeoBrandAssetsPaginated> {
  const search = new URLSearchParams();
  if (params.leadId) search.set("leadId", params.leadId);
  if (params.status) search.set("status", params.status);
  if (params.keyword) search.set("keyword", params.keyword);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  return request(`/geo-brand-assets?${search.toString()}`);
}

export async function fetchBrandAssetById(id: string): Promise<GeoBrandAssetFull> {
  return request(`/geo-brand-assets/${id}`);
}

export async function createBrandAsset(payload: CreateBrandAssetPayload): Promise<GeoBrandAssetFull> {
  return request("/geo-brand-assets", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateBrandAsset(id: string, payload: Partial<CreateBrandAssetPayload>): Promise<GeoBrandAssetFull> {
  return request(`/geo-brand-assets/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function updateBrandAssetStatus(id: string, status: string): Promise<GeoBrandAssetFull> {
  return request(`/geo-brand-assets/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export async function archiveBrandAsset(id: string): Promise<GeoBrandAssetFull> {
  return request(`/geo-brand-assets/${id}`, { method: "DELETE" });
}
