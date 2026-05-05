import { ReportDraft, TestRecord } from "./reportTypes";

function lines(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join("\n");
}

function table(headers: string[], rows: string[][]): string {
  const h = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const r = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return `${h}\n${sep}\n${r}`;
}

function testRecordRow(r: TestRecord): string[] {
  return [
    r.platform || "-",
    r.question,
    r.brandMentioned ? "是" : "否",
    r.brandDescription || "-",
    r.competitorsMentioned || "-",
    r.sentiment,
    r.accuracy,
    r.notes || "-",
  ];
}

export function generateMarkdown(draft: ReportDraft): string {
  const { customerInfo, scope, testRecords, summary } = draft;

  return lines(
    `# ${customerInfo.brandName} AI 搜索可见度诊断报告`,
    ``,
    `## 1. 诊断背景`,
    ``,
    lines(
      `- 公司名称：${customerInfo.companyName}`,
      `- 品牌名称：${customerInfo.brandName}`,
      `- 官网：${customerInfo.website}`,
      `- 行业：${customerInfo.industry}`,
      customerInfo.targetCity && `- 目标城市：${customerInfo.targetCity}`,
      `- 诊断日期：${scope.diagnosisDate || "未填写"}`,
    ),
    ``,
    `## 2. 诊断范围`,
    ``,
    `### 2.1 测试平台`,
    ``,
    ...scope.platforms.map((p) => `- ${p}`),
    ``,
    `### 2.2 目标问题`,
    ``,
    scope.targetQuestions
      .split("\n")
      .filter((q) => q.trim())
      .map((q, i) => `${i + 1}. ${q.trim()}`)
      .join("\n"),
    ``,
    `### 2.3 主要竞品`,
    ``,
    scope.competitors
      .split("\n")
      .filter((c) => c.trim())
      .map((c) => `- ${c.trim()}`)
      .join("\n"),
    ``,
    `## 3. AI 回答测试结果`,
    ``,
    testRecords.length > 0
      ? table(
          ["平台", "问题", "提及本品牌", "品牌描述", "提及竞品", "情感倾向", "准确性", "备注"],
          testRecords.map(testRecordRow),
        )
      : "（未录入测试记录）",
    ``,
    `## 4. 关键发现`,
    ``,
    summary.visibilitySummary || "（未填写）",
    ``,
    `## 5. 风险与问题`,
    ``,
    summary.mainProblems || "（未填写）",
    ``,
    `## 6. 优化机会`,
    ``,
    summary.opportunities || "（未填写）",
    ``,
    `## 7. 建议执行动作`,
    ``,
    summary.recommendedActions || "（未填写）",
    ``,
    `## 8. 下一步计划`,
    ``,
    `- 建立品牌事实资产包`,
    `- 补充官网 AI 可读内容`,
    `- 规划 GEO 内容选题`,
    `- 持续监测 AI 回答变化`,
    `- 月度复盘与优化`,
    ``,
    `## 9. 合规说明`,
    ``,
    `本报告基于人工测试、客户提供资料与公开信息整理，不承诺 AI 平台一定推荐或固定排名。MOY GEO 不提供虚假宣传、伪造案例、垃圾内容批量发布等服务。`,
    ``,
    `---`,
    `*报告由 MOY GEO 诊断报告生成器生成 · ${new Date().toLocaleDateString("zh-CN")}*`,
  );
}
