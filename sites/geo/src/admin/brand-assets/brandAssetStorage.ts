import { BrandAssetDraft } from "./brandAssetTypes";

const KEY = "moy_geo_brand_asset_draft";

export function saveDraft(draft: BrandAssetDraft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // storage full, silently fail
  }
}

export function loadDraft(): BrandAssetDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BrandAssetDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  localStorage.removeItem(KEY);
}
