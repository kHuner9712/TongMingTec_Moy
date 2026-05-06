import { getAdminToken } from "./consoleStorage";

const BASE = import.meta.env.VITE_API_HUB_ADMIN_BASE_URL || "http://localhost:3001/api/v1/api-hub";

async function request(path: string, options: RequestInit = {}) {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export const adminApi = {
  projects: {
    list: () => request("/projects"),
    create: (body: { name: string; description?: string }) => request("/projects", { method: "POST", body: JSON.stringify(body) }),
    get: (id: string) => request(`/projects/${id}`),
    update: (id: string, body: { name?: string; description?: string }) => request(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    archive: (id: string) => request(`/projects/${id}`, { method: "DELETE" }),
    addModel: (projectId: string, body: { modelId: string; enabled?: boolean }) => request(`/projects/${projectId}/models`, { method: "POST", body: JSON.stringify(body) }),
    listModels: (projectId: string) => request(`/projects/${projectId}/models`),
    updateModel: (projectId: string, modelId: string, body: { enabled?: boolean }) => request(`/projects/${projectId}/models/${modelId}`, { method: "PATCH", body: JSON.stringify(body) }),
    removeModel: (projectId: string, modelId: string) => request(`/projects/${projectId}/models/${modelId}`, { method: "DELETE" }),
    setQuota: (projectId: string, body: { modelId: string; quotaLimit: number; quotaUnit?: string; period?: string }) => request(`/projects/${projectId}/quota`, { method: "POST", body: JSON.stringify(body) }),
    listQuota: (projectId: string) => request(`/projects/${projectId}/quota`),
    updateQuota: (projectId: string, quotaId: string, body: { quotaLimit: number }) => request(`/projects/${projectId}/quota/${quotaId}`, { method: "PATCH", body: JSON.stringify(body) }),
    deleteQuota: (projectId: string, quotaId: string) => request(`/projects/${projectId}/quota/${quotaId}`, { method: "DELETE" }),
    getRemaining: (projectId: string, modelId: string) => request(`/projects/${projectId}/remaining?modelId=${encodeURIComponent(modelId)}`),
  },
  models: {
    list: () => request("/models"),
    create: (body: any) => request("/models", { method: "POST", body: JSON.stringify(body) }),
    get: (id: string) => request(`/models/${id}`),
    update: (id: string, body: any) => request(`/models/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    archive: (id: string) => request(`/models/${id}`, { method: "DELETE" }),
  },
  keys: {
    list: (projectId: string) => request(`/projects/${projectId}/keys`),
    create: (projectId: string, body: { name: string }) => request(`/projects/${projectId}/keys`, { method: "POST", body: JSON.stringify(body) }),
    get: (projectId: string, keyId: string) => request(`/projects/${projectId}/keys/${keyId}`),
    update: (projectId: string, keyId: string, body: { name?: string; status?: string }) => request(`/projects/${projectId}/keys/${keyId}`, { method: "PATCH", body: JSON.stringify(body) }),
    revoke: (projectId: string, keyId: string) => request(`/projects/${projectId}/keys/${keyId}`, { method: "DELETE" }),
  },
};
