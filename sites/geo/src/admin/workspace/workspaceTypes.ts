import { GeoLead } from "../adminTypes";

export interface GeoReportBrief {
  id: string; title: string; status: string; createdAt: string; updatedAt: string;
}

export interface GeoBrandAssetBrief {
  id: string; title: string; status: string; createdAt: string; updatedAt: string;
}

export interface GeoContentTopicBrief {
  id: string; title: string; contentType: string | null; status: string; plannedPublishDate: string | null; createdAt: string;
}

export interface GeoContentPlanBrief {
  id: string; title: string; month: string | null; status: string; createdAt: string;
}

export interface GeoContentDraftBrief {
  id: string; title: string; status: string; plannedPublishDate: string | null; publishedUrl: string | null; createdAt: string;
}

export interface WorkspaceData {
  lead: GeoLead | null;
  leadError: string;
  reports: GeoReportBrief[];
  reportsError: string;
  brandAssets: GeoBrandAssetBrief[];
  brandAssetsError: string;
  topics: GeoContentTopicBrief[];
  topicsError: string;
  plans: GeoContentPlanBrief[];
  plansError: string;
  drafts: GeoContentDraftBrief[];
  draftsError: string;
  stageInfo: WorkspaceStageInfo;
  riskHints: string[];
}

export type StageStatus = "done" | "active" | "pending";

export interface StageItem {
  key: string;
  label: string;
  status: StageStatus;
  count: number;
  link: string;
  newLink: string;
}

export interface WorkspaceStageInfo {
  currentStage: string;
  stages: StageItem[];
}

export interface TopicStatusCount {
  status: string; count: number;
}

export interface DraftStatusCount {
  status: string; count: number;
}
