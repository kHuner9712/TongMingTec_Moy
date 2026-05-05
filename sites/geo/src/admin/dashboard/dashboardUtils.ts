import {
  GeoLeadBrief, GeoReportBrief, GeoBrandAssetBrief,
  GeoContentTopicBrief, GeoContentDraftBrief,
  KpiSnapshot, TodoItem, RiskItem,
} from "./dashboardTypes";

export function computeKpis(leads: GeoLeadBrief[], reports: GeoReportBrief[], brandAssets: GeoBrandAssetBrief[], topics: GeoContentTopicBrief[], drafts: GeoContentDraftBrief[]): KpiSnapshot {
  return {
    leadsTotal: leads.length,
    leadsReceived: leads.filter((l) => l.status === "received").length,
    leadsQualified: leads.filter((l) => l.status === "qualified").length,
    leadsWon: leads.filter((l) => l.status === "won").length,
    reportsCount: reports.length,
    brandAssetsCount: brandAssets.length,
    topicsCount: topics.length,
    draftsCount: drafts.length,
  };
}

function findLeadName(leads: GeoLeadBrief[], leadId: string | null): string {
  if (!leadId) return "";
  const l = leads.find((l) => l.id === leadId);
  return l ? `${l.companyName}${l.brandName ? "｜" + l.brandName : ""}` : "";
}

export function generateTodos(
  leads: GeoLeadBrief[], reports: GeoReportBrief[],
  brandAssets: GeoBrandAssetBrief[], topics: GeoContentTopicBrief[],
  drafts: GeoContentDraftBrief[],
): TodoItem[] {
  const todos: TodoItem[] = [];

  for (const l of leads) {
    if (l.status === "received") {
      todos.push({ type: "线索", title: `${l.companyName}`, leadId: l.id, link: `/admin/workspace?leadId=${l.id}`, label: "需要首次联系 → 进入工作台" });
    }
  }
  for (const l of leads) {
    if (l.status === "contacted") {
      todos.push({ type: "线索", title: `${l.companyName}`, leadId: l.id, link: `/admin/workspace?leadId=${l.id}`, label: "已联系但未判定有效 → 判断线索质量" });
    }
  }
  for (const l of leads) {
    if (l.status === "qualified") {
      todos.push({ type: "线索", title: `${l.companyName}`, leadId: l.id, link: `/admin/workspace?leadId=${l.id}`, label: "有效线索待发方案或推进 → 制定方案" });
    }
  }

  const leadIdsWithBrandAssets = new Set(brandAssets.map((b) => b.leadId));
  for (const r of reports) {
    if (r.leadId && !leadIdsWithBrandAssets.has(r.leadId)) {
      const nm = findLeadName(leads, r.leadId);
      todos.push({ type: "交付", title: nm || r.title, leadId: r.leadId || undefined, link: `/admin/workspace?leadId=${r.leadId}`, label: "有报告但缺品牌资产包 → 建设资产包" });
    }
  }

  const leadIdsWithTopics = new Set(topics.map((t) => t.leadId));
  for (const b of brandAssets) {
    if (b.leadId && !leadIdsWithTopics.has(b.leadId)) {
      const nm = findLeadName(leads, b.leadId);
      todos.push({ type: "交付", title: nm || b.title, leadId: b.leadId || undefined, link: `/admin/workspace?leadId=${b.leadId}`, label: "有品牌资产包但无选题 → 规划选题" });
    }
  }

  const leadIdsWithDrafts = new Set(drafts.map((d) => d.leadId));
  for (const t of topics) {
    if (t.leadId && !leadIdsWithDrafts.has(t.leadId)) {
      const nm = findLeadName(leads, t.leadId);
      todos.push({ type: "内容", title: `${t.title} (${nm})`, leadId: t.leadId || undefined, link: `/admin/workspace?leadId=${t.leadId}`, label: "有选题但无稿件 → 开始撰写" });
    }
  }

  for (const d of drafts) {
    if (d.status === "reviewing") {
      const nm = findLeadName(leads, d.leadId);
      todos.push({ type: "内容", title: `${d.title} (${nm})`, leadId: d.leadId || undefined, link: `/admin/content-drafts/new?draftId=${d.id}`, label: "稿件待审核 → 审核" });
    }
  }
  for (const d of drafts) {
    if (d.status === "approved") {
      const nm = findLeadName(leads, d.leadId);
      todos.push({ type: "内容", title: `${d.title} (${nm})`, leadId: d.leadId || undefined, link: `/admin/content-drafts/new?draftId=${d.id}`, label: "稿件已通过审核 → 安排发布" });
    }
  }

  for (const t of topics) {
    if (t.status === "planned") {
      const nm = findLeadName(leads, t.leadId);
      todos.push({ type: "内容", title: `${t.title} (${nm})`, leadId: t.leadId || undefined, link: `/admin/content-topics/new?topicId=${t.id}`, label: "已规划但未开始撰写 → 进入编辑" });
    }
  }

  return todos.slice(0, 30);
}

export function generateRisks(
  leads: GeoLeadBrief[], reports: GeoReportBrief[],
  brandAssets: GeoBrandAssetBrief[], topics: GeoContentTopicBrief[],
  drafts: GeoContentDraftBrief[],
): RiskItem[] {
  const risks: RiskItem[] = [];
  const now = Date.now();
  const DAY7 = 7 * 24 * 60 * 60 * 1000;

  const leadIdsWithReports = new Set(reports.map((r) => r.leadId));
  const leadIdsWithBrandAssets = new Set(brandAssets.map((b) => b.leadId));
  const leadIdsWithTopics = new Set(topics.map((t) => t.leadId));
  const leadIdsWithDrafts = new Set(drafts.map((d) => d.leadId));

  for (const l of leads) {
    if (l.status === "received" && !leadIdsWithReports.has(l.id)) {
      risks.push({ companyName: l.companyName, brandName: l.brandName, riskType: "未启动诊断", action: "建议生成诊断报告", leadId: l.id });
    }
  }

  for (const l of leads) {
    if (leadIdsWithReports.has(l.id) && !leadIdsWithBrandAssets.has(l.id)) {
      risks.push({ companyName: l.companyName, brandName: l.brandName, riskType: "交付卡在资产建设", action: "建议建设品牌资产包", leadId: l.id });
    }
  }

  for (const l of leads) {
    if (leadIdsWithBrandAssets.has(l.id) && !leadIdsWithTopics.has(l.id)) {
      risks.push({ companyName: l.companyName, brandName: l.brandName, riskType: "内容规划未开始", action: "建议规划内容选题", leadId: l.id });
    }
  }

  for (const l of leads) {
    if (leadIdsWithTopics.has(l.id) && !leadIdsWithDrafts.has(l.id)) {
      risks.push({ companyName: l.companyName, brandName: l.brandName, riskType: "选题未转化为稿件", action: "建议撰写内容稿件", leadId: l.id });
    }
  }

  for (const l of leads) {
    if (leadIdsWithDrafts.has(l.id)) {
      const ldrafts = drafts.filter((d) => d.leadId === l.id);
      const hasDeliverable = ldrafts.some((d) => d.status === "approved" || d.status === "published");
      if (!hasDeliverable) {
        risks.push({ companyName: l.companyName, brandName: l.brandName, riskType: "稿件未交付", action: "稿件未进入 approved/published 状态", leadId: l.id });
      }
    }
  }

  for (const l of leads) {
    if (l.status === "contacted") {
      const updated = new Date(l.updatedAt).getTime();
      if (now - updated > DAY7) {
        risks.push({ companyName: l.companyName, brandName: l.brandName, riskType: "跟进停滞", action: "已联系超过 7 天未推进", leadId: l.id });
      }
    }
  }

  for (const l of leads) {
    if (l.status === "proposal_sent") {
      const updated = new Date(l.updatedAt).getTime();
      if (now - updated > DAY7) {
        risks.push({ companyName: l.companyName, brandName: l.brandName, riskType: "成交跟进停滞", action: "已发方案超过 7 天未 win/lost", leadId: l.id });
      }
    }
  }

  return risks.slice(0, 30);
}
