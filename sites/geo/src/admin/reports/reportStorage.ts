import { ReportDraft } from "./reportTypes";

const KEY = "moy_geo_report_draft";

export function saveDraft(draft: ReportDraft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // storage full, silently fail
  }
}

export function loadDraft(): ReportDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ReportDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  localStorage.removeItem(KEY);
}
