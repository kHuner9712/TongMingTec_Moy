import {
  WorkspaceStageInfo, StageItem, GeoReportBrief, GeoBrandAssetBrief,
  GeoContentTopicBrief, GeoContentPlanBrief, GeoContentDraftBrief,
} from "./workspaceTypes";

export function computeStageInfo(
  leadId: string,
  reports: GeoReportBrief[],
  brandAssets: GeoBrandAssetBrief[],
  topics: GeoContentTopicBrief[],
  plans: GeoContentPlanBrief[],
  drafts: GeoContentDraftBrief[],
): WorkspaceStageInfo {
  const hasReports = reports.length > 0;
  const hasBrandAssets = brandAssets.length > 0;
  const hasTopics = topics.length > 0;
  const hasPlans = plans.length > 0;
  const hasDrafts = drafts.length > 0;
  const hasPublished = drafts.some((d) => d.status === "published");

  let currentStage = "";
  if (!hasReports) currentStage = "待诊断";
  else if (!hasBrandAssets) currentStage = "待建设品牌资产";
  else if (!hasTopics) currentStage = "待规划选题";
  else if (!hasPlans) currentStage = "待制定内容计划";
  else if (!hasDrafts) currentStage = "待撰写稿件";
  else if (!hasPublished) currentStage = "内容生产中";
  else currentStage = "持续运营中";

  const stages: StageItem[] = [
    { key: "lead", label: "线索收集", status: "done", count: 1, link: `/admin/leads`, newLink: `/admin/leads` },
    {
      key: "reports", label: "诊断报告", status: hasReports ? "done" : "active",
      count: reports.length, link: `/admin/reports?leadId=${leadId}`, newLink: `/admin/reports/new?leadId=${leadId}`,
    },
    {
      key: "brand_assets", label: "品牌事实资产",
      status: hasBrandAssets ? "done" : hasReports ? "active" : "pending",
      count: brandAssets.length, link: `/admin/brand-assets?leadId=${leadId}`, newLink: `/admin/brand-assets/new?leadId=${leadId}`,
    },
    {
      key: "topics", label: "内容选题",
      status: hasTopics ? "done" : hasBrandAssets ? "active" : "pending",
      count: topics.length, link: `/admin/content-topics?leadId=${leadId}`, newLink: `/admin/content-topics/new?leadId=${leadId}`,
    },
    {
      key: "plans", label: "内容计划",
      status: hasPlans ? "done" : hasTopics ? "active" : "pending",
      count: plans.length, link: `/admin/content-plans?leadId=${leadId}`, newLink: `/admin/content-plans/new?leadId=${leadId}`,
    },
    {
      key: "drafts", label: "内容稿件",
      status: hasDrafts ? "done" : hasTopics ? "active" : "pending",
      count: drafts.length, link: `/admin/content-drafts?leadId=${leadId}`, newLink: `/admin/content-drafts/new?leadId=${leadId}`,
    },
  ];

  return { currentStage, stages };
}

export function computeRiskHints(
  leadStatus: string,
  reports: GeoReportBrief[],
  brandAssets: GeoBrandAssetBrief[],
  topics: GeoContentTopicBrief[],
  drafts: GeoContentDraftBrief[],
): string[] {
  const hints: string[] = [];
  const hasReports = reports.length > 0;
  const hasBrandAssets = brandAssets.length > 0;
  const hasTopics = topics.length > 0;
  const hasDrafts = drafts.length > 0;
  const approvedOrPublished = drafts.filter((d) => d.status === "approved" || d.status === "published").length;

  if (leadStatus === "received" && !hasReports) hints.push("线索尚未开始诊断，建议尽快生成诊断报告");
  if (hasReports && !hasBrandAssets) hints.push("建议基于诊断报告尽快整理品牌事实资产包");
  if (hasBrandAssets && !hasTopics) hints.push("建议基于品牌资产包规划 GEO 内容选题");
  if (hasTopics && !hasDrafts) hints.push("已有内容选题，尚未进入稿件生产阶段");
  if (hasDrafts && approvedOrPublished === 0) hints.push("稿件仍未进入可交付状态（approved 或 published）");
  if (!hasReports && !hasBrandAssets && !hasTopics && !hasDrafts) hints.push("该客户暂无任何交付资产");

  return hints;
}
