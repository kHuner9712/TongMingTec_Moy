import { getToken, getBaseUrl } from "../geoAdminApi";

function request<T>(path: string): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${getBaseUrl()}${path}`, { headers }).then((res) => {
    if (!res.ok) throw new Error(`请求失败 (${res.status})`);
    return res.json();
  });
}

export function fetchLeads() {
  return request("/geo-leads?page=1&pageSize=100");
}

export function fetchReports() {
  return request("/geo-reports?page=1&pageSize=100");
}

export function fetchBrandAssets() {
  return request("/geo-brand-assets?page=1&pageSize=100");
}

export function fetchContentTopics() {
  return request("/geo-content-topics?page=1&pageSize=100");
}

export function fetchContentPlans() {
  return request("/geo-content-plans?page=1&pageSize=100");
}

export function fetchContentDrafts() {
  return request("/geo-content-drafts?page=1&pageSize=100");
}
