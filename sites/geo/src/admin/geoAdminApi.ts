import { GeoLead, PaginatedResponse, UpdateStatusPayload } from "./adminTypes";

const TOKEN_KEY = "moy_geo_admin_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function getBaseUrl(): string {
  return import.meta.env.VITE_GEO_ADMIN_API_BASE_URL || "http://localhost:3001/api/v1";
}

export { getBaseUrl };

function headers(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, { ...options, headers: { ...headers(), ...(options.headers as Record<string, string> || {}) } });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body.message || `请求失败 (${res.status})`);
    err.status = res.status;
    err.code = body.code || body.error;
    throw err;
  }

  return res.json();
}

export async function fetchLeads(params: {
  status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<GeoLead>> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.keyword) search.set("keyword", params.keyword);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  return request(`/geo-leads?${search.toString()}`);
}

export async function fetchLeadById(id: string): Promise<GeoLead> {
  return request(`/geo-leads/${id}`);
}

export async function updateLeadStatus(
  id: string,
  payload: UpdateStatusPayload,
): Promise<GeoLead> {
  return request(`/geo-leads/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
