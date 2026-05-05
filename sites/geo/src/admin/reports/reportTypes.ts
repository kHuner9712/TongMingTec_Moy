export interface CustomerInfo {
  companyName: string;
  brandName: string;
  website: string;
  industry: string;
  targetCity: string;
  contactName: string;
}

export const ALL_PLATFORMS = [
  "ChatGPT", "豆包", "Kimi", "通义千问", "文心一言",
  "Perplexity", "Google AI Overviews", "Bing Copilot",
] as const;

export type Platform = typeof ALL_PLATFORMS[number];

export type Sentiment = "正向" | "中性" | "负向" | "未提及";
export type Accuracy = "准确" | "部分准确" | "不准确" | "无法判断";

export interface TestRecord {
  question: string;
  platform: Platform | "";
  brandMentioned: boolean;
  brandDescription: string;
  competitorsMentioned: string;
  sentiment: Sentiment;
  accuracy: Accuracy;
  notes: string;
}

export interface DiagnosisScope {
  diagnosisDate: string;
  platforms: Platform[];
  competitors: string;
  targetQuestions: string;
}

export interface Summary {
  visibilitySummary: string;
  mainProblems: string;
  opportunities: string;
  recommendedActions: string;
}

export interface ReportDraft {
  customerInfo: CustomerInfo;
  scope: DiagnosisScope;
  testRecords: TestRecord[];
  summary: Summary;
}
