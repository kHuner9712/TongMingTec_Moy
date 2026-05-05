export interface DraftMarkdownInput {
  title: string;
  slug?: string;
  summary?: string;
  outline?: string;
  body?: string;
  targetQuestion?: string;
  targetKeyword?: string;
  contentType?: string;
  platform?: string;
  seoTitle?: string;
  metaDescription?: string;
  tags?: string[];
  complianceChecklist?: string[];
  plannedPublishDate?: string;
  actualPublishDate?: string;
  publishedUrl?: string;
}

const CT_LABELS: Record<string, string> = {
  industry_question: "行业问答", local_service: "本地服务", competitor_comparison: "竞品对比",
  buying_guide: "购买决策", misconception: "常见误区", case_study: "案例拆解",
  pricing_explainer: "价格解释", process_explainer: "服务流程", brand_intro: "品牌介绍", faq: "FAQ",
};

export function generateDraftMarkdown(input: DraftMarkdownInput): string {
  const lines: string[] = [];

  lines.push(`# ${input.title || "（未命名稿件）"}`);
  lines.push("");

  if (input.slug) {
    lines.push(`> 短链接: \`${input.slug}\``);
    lines.push("");
  }

  if (input.contentType) {
    lines.push(`**内容类型**: ${CT_LABELS[input.contentType] || input.contentType}`);
    lines.push("");
  }

  if (input.targetKeyword) {
    lines.push(`**目标关键词**: ${input.targetKeyword}`);
    lines.push("");
  }

  if (input.summary) {
    lines.push("## 摘要");
    lines.push("");
    lines.push(input.summary);
    lines.push("");
  }

  if (input.platform) {
    lines.push(`**建议平台**: ${input.platform}`);
    lines.push("");
  }

  if (input.outline) {
    lines.push("## 大纲");
    lines.push("");
    lines.push(input.outline);
    lines.push("");
  }

  lines.push("## 正文");
  lines.push("");
  if (input.body) {
    lines.push(input.body);
  } else {
    lines.push("> 请基于品牌事实资产包和客户真实资料补充正文。");
  }
  lines.push("");

  if (input.targetQuestion) {
    lines.push("## FAQ / 延伸问题");
    lines.push("");
    lines.push(`### ${input.targetQuestion}`);
    lines.push("");
    if (input.body) {
      lines.push("（根据正文内容整理回答）");
    } else {
      lines.push("> 请补充针对该问题的回答。");
    }
    lines.push("");
  }

  lines.push("## SEO 信息");
  lines.push("");
  if (input.seoTitle) lines.push(`- SEO 标题: ${input.seoTitle}`);
  if (input.metaDescription) lines.push(`- Meta Description: ${input.metaDescription}`);
  if (input.targetKeyword) lines.push(`- 目标关键词: ${input.targetKeyword}`);
  if (input.tags && input.tags.length > 0) lines.push(`- 标签: ${input.tags.join(", ")}`);
  if (!input.seoTitle && !input.metaDescription && !input.targetKeyword && (!input.tags || input.tags.length === 0)) {
    lines.push("> 请在编辑器中补充 SEO 信息。");
  }
  lines.push("");

  if (input.complianceChecklist && input.complianceChecklist.length > 0) {
    lines.push("## 合规检查");
    lines.push("");
    for (const item of input.complianceChecklist) {
      lines.push(`- [x] ${item}`);
    }
    lines.push("");
  }

  lines.push("## 发布信息");
  lines.push("");
  if (input.platform) lines.push(`- 建议平台: ${input.platform}`);
  if (input.plannedPublishDate) lines.push(`- 计划发布日期: ${input.plannedPublishDate}`);
  if (input.actualPublishDate) lines.push(`- 实际发布日期: ${input.actualPublishDate}`);
  if (input.publishedUrl) lines.push(`- 发布链接: ${input.publishedUrl}`);
  if (!input.platform && !input.plannedPublishDate && !input.actualPublishDate && !input.publishedUrl) {
    lines.push("> 尚未填写发布信息。");
  }
  lines.push("");

  return lines.join("\n");
}
