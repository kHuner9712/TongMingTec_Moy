import { GeoLead, STATUS_LABELS } from "../adminTypes";
import { GeoReportFull } from "../reports/geoReportsApi";
import { GeoBrandAssetFull } from "../brand-assets/geoBrandAssetsApi";
import { GeoContentTopicBrief, GeoContentPlanBrief } from "../geoContentApi";
import { GeoContentDraftBrief } from "../geoContentDraftsApi";

export interface ExportData {
  lead: GeoLead | null;
  reports: GeoReportFull[];
  brandAssets: GeoBrandAssetFull[];
  topics: GeoContentTopicBrief[];
  plans: GeoContentPlanBrief[];
  drafts: GeoContentDraftBrief[];
}

export interface ExportOptions {
  includeCustomerInfo: boolean;
  includeReports: boolean;
  includeBrandAssets: boolean;
  includeTopics: boolean;
  includePlans: boolean;
  includeDrafts: boolean;
  includeCompliance: boolean;
  includeSummary: boolean;
}

export const DEFAULT_OPTIONS: ExportOptions = {
  includeCustomerInfo: true,
  includeReports: true,
  includeBrandAssets: true,
  includeTopics: true,
  includePlans: true,
  includeDrafts: true,
  includeCompliance: true,
  includeSummary: true,
};

const CT_LABELS: Record<string, string> = {
  industry_question: "行业问答", local_service: "本地服务", competitor_comparison: "竞品对比",
  buying_guide: "购买决策", misconception: "常见误区", case_study: "案例拆解",
  pricing_explainer: "价格解释", process_explainer: "服务流程", brand_intro: "品牌介绍", faq: "FAQ",
};

const TOPIC_STATUS_LABELS: Record<string, string> = {
  idea: "想法", planned: "已规划", drafting: "起草中", reviewing: "审核中",
  approved: "已批准", published: "已发布", archived: "已归档",
};

const PLAN_STATUS_LABELS: Record<string, string> = {
  draft: "草稿", active: "进行中", completed: "已完成", archived: "已归档",
};

const DRAFT_STATUS_LABELS: Record<string, string> = {
  draft: "草稿", reviewing: "审核中", approved: "已批准", published: "已发布", archived: "已归档",
};

function esc(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/_/g, "\\_").replace(/\*/g, "\\*").replace(/\|/g, "\\|");
}

function pad(text: string | null | undefined): string {
  return text || "-";
}

export function generateExportMarkdown(data: ExportData, options: ExportOptions): string {
  const lines: string[] = [];
  const lead = data.lead;
  const brandName = esc(lead?.brandName) || "未命名品牌";

  lines.push(`# ${brandName} GEO 交付包`);
  lines.push("");
  if (lead) {
    lines.push(`> 生成日期：${new Date().toISOString().split("T")[0]}`);
    lines.push("");
  }

  if (options.includeSummary && lead) {
    const publishedCount = data.drafts.filter((d) => d.status === "published").length;
    lines.push("## 1. 交付摘要");
    lines.push("");
    lines.push(`| 交付项 | 数量 |`);
    lines.push(`|--------|------|`);
    lines.push(`| 诊断报告 | ${data.reports.length} |`);
    lines.push(`| 品牌事实资产包 | ${data.brandAssets.length} |`);
    lines.push(`| 内容选题 | ${data.topics.length} |`);
    lines.push(`| 内容计划 | ${data.plans.length} |`);
    lines.push(`| 内容稿件 | ${data.drafts.length} |`);
    lines.push(`| 已发布稿件 | ${publishedCount} |`);
    lines.push("");
  }

  if (options.includeCustomerInfo && lead) {
    const secNum = options.includeSummary ? "2" : "1";
    lines.push(`## ${secNum}. 客户基础信息`);
    lines.push("");
    lines.push(`- 公司：${esc(lead.companyName)}`);
    lines.push(`- 品牌：${esc(lead.brandName)}`);
    lines.push(`- 官网：${esc(lead.website)}`);
    lines.push(`- 行业：${esc(lead.industry)}`);
    lines.push(`- 城市：${esc(lead.targetCity) || "-"}`);
    lines.push(`- 联系人：${esc(lead.contactName)}`);
    lines.push(`- 当前线索状态：${STATUS_LABELS[lead.status] || lead.status}`);
    if (lead.notes) {
      lines.push(`- 备注：${esc(lead.notes)}`);
    }
    lines.push("");
  }

  let secIdx = 1;
  if (options.includeSummary) secIdx++;
  if (options.includeCustomerInfo) secIdx++;

  if (options.includeReports && data.reports.length > 0) {
    const sorted = [...data.reports].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    lines.push(`## ${secIdx}. 诊断报告`);
    lines.push("");
    sorted.forEach((r, i) => {
      lines.push(`### ${secIdx}.${i + 1} ${esc(r.title)}`);
      lines.push("");
      lines.push(`- 状态：${r.status}`);
      if (r.diagnosisDate) lines.push(`- 诊断日期：${r.diagnosisDate}`);
      if (r.markdown) {
        lines.push("");
        lines.push(r.markdown);
        lines.push("");
      }
      lines.push("");
    });
    secIdx++;
  }

  if (options.includeBrandAssets && data.brandAssets.length > 0) {
    lines.push(`## ${secIdx}. 品牌事实资产包`);
    lines.push("");
    data.brandAssets.forEach((a, i) => {
      lines.push(`### ${secIdx}.${i + 1} ${esc(a.title)}`);
      lines.push("");
      lines.push(`- 状态：${a.status}`);
      if (a.markdown) {
        lines.push("");
        lines.push(a.markdown);
        lines.push("");
      }
      lines.push("");
    });
    secIdx++;
  }

  if (options.includeTopics && data.topics.length > 0) {
    lines.push(`## ${secIdx}. 内容选题`);
    lines.push("");
    lines.push("| 标题 | 类型 | 目标关键词 | 目标问题 | 优先级 | 状态 | 计划发布日期 |");
    lines.push("|------|------|------------|----------|--------|------|--------------|");
    data.topics.forEach((t) => {
      const typeLabel = CT_LABELS[t.contentType] || t.contentType || "-";
      const statusLabel = TOPIC_STATUS_LABELS[t.status] || t.status;
      const priorityMap: Record<string, string> = { high: "高", medium: "中", low: "低" };
      const priorityLabel = priorityMap[t.priority] || t.priority;
      lines.push(
        `| ${esc(t.title)} | ${esc(typeLabel)} | ${pad(t.targetKeyword)} | ${pad(t.targetQuestion)} | ${priorityLabel} | ${esc(statusLabel)} | ${pad(t.plannedPublishDate)} |`
      );
    });
    lines.push("");
    secIdx++;
  }

  if (options.includePlans && data.plans.length > 0) {
    lines.push(`## ${secIdx}. 内容计划`);
    lines.push("");
    data.plans.forEach((p, i) => {
      const statusLabel = PLAN_STATUS_LABELS[p.status] || p.status;
      lines.push(`### ${secIdx}.${i + 1} ${esc(p.title)}`);
      lines.push("");
      lines.push(`- 月份：${p.month || "-"}`);
      lines.push(`- 状态：${esc(statusLabel)}`);
      lines.push(`- 目标：${esc(p.goal) || "-"}`);
      lines.push("");
    });
    secIdx++;
  }

  if (options.includeDrafts && data.drafts.length > 0) {
    lines.push(`## ${secIdx}. 内容稿件`);
    lines.push("");

    const statusOrder = ["draft", "reviewing", "approved", "published", "archived"];
    statusOrder.forEach((status) => {
      const group = data.drafts.filter((d) => d.status === status);
      if (group.length === 0) return;
      const statusLabel = DRAFT_STATUS_LABELS[status] || status;
      lines.push(`### ${statusLabel}`);
      lines.push("");
      group.forEach((d) => {
        lines.push(`#### ${esc(d.title)}`);
        lines.push("");
        lines.push(`- 状态：${esc(statusLabel)}`);
        lines.push(`- 平台：${d.platform || "-"}`);
        lines.push(`- 目标关键词：${d.targetKeyword || "-"}`);
        if (d.plannedPublishDate) lines.push(`- 计划发布日期：${d.plannedPublishDate}`);
        if (d.publishedUrl) lines.push(`- 发布链接：${esc(d.publishedUrl)}`);
        lines.push("");
      });
    });
    secIdx++;
  }

  if (options.includeCompliance) {
    lines.push(`## ${secIdx}. 合规说明`);
    lines.push("");
    lines.push(
      "本交付包仅基于客户提供资料、人工测试结果和已确认的品牌事实资产整理。" +
      "MOY GEO 不承诺固定排名，不提供虚假宣传、伪造媒体报道、伪造客户案例或垃圾内容批量发布服务。" +
      "对外发布前，客户需确认内容准确性与授权范围。"
    );
    lines.push("");
  }

  return lines.join("\n");
}
