import { getToken, getBaseUrl } from "../geoAdminApi";

function request<T>(path: string): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = `${getBaseUrl()}${path}`;
  return fetch(url, { headers }).then((res) => {
    if (!res.ok) throw new Error(`请求失败 (${res.status})`);
    return res.json();
  });
}

export function fetchLead(leadId: string) {
  return request(`/geo-leads/${leadId}`);
}

export function fetchReports(leadId: string) {
  return request(`/geo-reports?leadId=${leadId}&pageSize=100`);
}

export function fetchBrandAssets(leadId: string) {
  return request(`/geo-brand-assets?leadId=${leadId}&pageSize=100`);
}

export function fetchTopics(leadId: string) {
  return request(`/geo-content-topics?leadId=${leadId}&pageSize=100`);
}

export function fetchPlans(leadId: string) {
  return request(`/geo-content-plans?leadId=${leadId}&pageSize=100`);
}

export function fetchDrafts(leadId: string) {
  return request(`/geo-content-drafts?leadId=${leadId}&pageSize=100`);
}
