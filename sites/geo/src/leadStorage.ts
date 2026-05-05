import { GEO_LEAD_ENDPOINT } from "./config";
import type { LeadFormData, LeadSubmission } from "./types";

const STORAGE_KEY = "moy_geo_submissions";

export function loadSubmissions(): LeadSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeadSubmission[];
  } catch {
    return [];
  }
}

function saveSubmissions(list: LeadSubmission[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function submitLead(data: LeadFormData): Promise<LeadSubmission> {
  const submission: LeadSubmission = {
    ...data,
    submittedAt: new Date().toISOString(),
  };

  if (GEO_LEAD_ENDPOINT) {
    const res = await fetch(GEO_LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });
    if (!res.ok) {
      throw new Error(`提交失败: ${res.status} ${res.statusText}`);
    }
  } else {
    const list = loadSubmissions();
    list.unshift(submission);
    saveSubmissions(list);
  }

  return submission;
}
