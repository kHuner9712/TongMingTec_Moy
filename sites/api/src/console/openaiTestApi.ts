import { getTestKey } from "./consoleStorage";

const BASE = import.meta.env.VITE_API_HUB_OPENAI_BASE_URL || "http://localhost:3001/v1";

async function request(path: string, options: RequestInit = {}) {
  const key = getTestKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (key) headers["Authorization"] = `Bearer ${key}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export const openaiApi = {
  listModels: () => request("/models"),
  chatCompletions: (body: { model: string; messages: { role: string; content: string }[]; temperature?: number }) =>
    request("/chat/completions", { method: "POST", body: JSON.stringify(body) }),
};
