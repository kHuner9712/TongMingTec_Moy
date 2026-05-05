import { BrandAssetDraft } from "./brandAssetTypes";

function lines(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join("\n");
}

function bullet(prefix: string, text: string): string {
  if (!text.trim()) return "";
  return text.split("\n").filter((t) => t.trim()).map((t) => `${prefix} ${t.trim()}`).join("\n");
}

export function generateMarkdown(draft: BrandAssetDraft): string {
  const { basicInfo, intro, serviceItems, advantages, cases, faqs, competitorDiffs, compliance } = draft;

  return lines(
    `# ${basicInfo.brandName} 品牌事实资产包`,
    ``,
    ``,
    `## 1. 基础信息`,
    ``,
    lines(
      `- **公司名称**：${basicInfo.companyName}`,
      `- **品牌名称**：${basicInfo.brandName}`,
      `- **官网**：${basicInfo.website}`,
      `- **行业**：${basicInfo.industry}`,
      `- **目标城市**：${basicInfo.targetCity}`,
      basicInfo.foundedYear && `- **成立年份**：${basicInfo.foundedYear}`,
      basicInfo.headquarters && `- **总部**：${basicInfo.headquarters}`,
      basicInfo.contactInfo && `- **联系信息**：${basicInfo.contactInfo}`,
    ),
    ``,
    ``,
    `## 2. 标准品牌介绍`,
    ``,
    `### 一句话介绍`,
    ``,
    intro.oneSentenceIntro || "（未填写）",
    ``,
    `### 100 字简介`,
    ``,
    intro.shortIntro || "（未填写）",
    ``,
    `### 500 字详细介绍`,
    ``,
    intro.fullIntro || "（未填写）",
    ``,
    ``,
    `## 3. 产品与服务`,
    ``,
    ...serviceItems.map((s, i) =>
      lines(
        `### ${i + 1}. ${s.name || "（未命名服务）"}`,
        ``,
        s.targetUsers && `- **目标用户**：${s.targetUsers}`,
        s.painPoints && `- **解决痛点**：${s.painPoints}`,
        s.coreValue && `- **核心价值**：${s.coreValue}`,
        s.deliverables && `- **交付物**：${s.deliverables}`,
        s.priceRange && `- **价格区间**：${s.priceRange}`,
        s.serviceProcess && `- **服务流程**：${s.serviceProcess}`,
        ``,
      )
    ),
    serviceItems.length === 0 && "（未填写）",
    ``,
    ``,
    `## 4. 核心优势`,
    ``,
    ...advantages.map((a, i) =>
      lines(
        `### ${i + 1}. ${a.title || "（未命名优势）"}`,
        ``,
        a.description || "（未填写说明）",
        ``,
        a.proof && `> 佐证：${a.proof}`,
        ``,
      )
    ),
    advantages.length === 0 && "（未填写）",
    ``,
    ``,
    `## 5. 成功案例`,
    ``,
    ...cases.map((c, i) =>
      lines(
        `### ${i + 1}. ${c.customerName || "（未命名客户）"}`,
        ``,
        c.industry && `- **行业**：${c.industry}`,
        `- **可公开**：${c.canPublicize ? "是" : "否"}`,
        c.problem && `- **问题**：${c.problem}`,
        c.solution && `- **方案**：${c.solution}`,
        c.result && `- **效果**：${c.result}`,
        ``,
      )
    ),
    cases.length === 0 && "（未填写）",
    ``,
    ``,
    `## 6. 常见问题 FAQ`,
    ``,
    ...faqs.map((f, i) =>
      lines(
        `### Q${i + 1}：${f.question || "（未填写问题）"}`,
        ``,
        f.answer || "（未填写答案）",
        ``,
      )
    ),
    faqs.length === 0 && "（未填写）",
    ``,
    ``,
    `## 7. 竞品差异`,
    ``,
    ...competitorDiffs.map((d, i) =>
      lines(
        `### ${i + 1}. 竞品：${d.competitor || "（未填写）"}`,
        ``,
        d.difference && `- **差异点**：${d.difference}`,
        d.ourAdvantage && `- **我方优势**：${d.ourAdvantage}`,
        d.evidence && `- **佐证**：${d.evidence}`,
        ``,
      )
    ),
    competitorDiffs.length === 0 && "（未填写）",
    ``,
    ``,
    `## 8. 可公开引用材料`,
    ``,
    bullet("-", compliance.publicMaterials) || "（未填写）",
    ``,
    ``,
    `## 9. 禁止使用材料`,
    ``,
    bullet("-", compliance.forbiddenMaterials) || "（未填写）",
    ``,
    ``,
    `## 10. GEO 内容使用规范`,
    ``,
    `本资产包仅用于基于真实信息的品牌内容建设。所有对外发布内容需经客户确认，不得使用未授权案例、虚假数据、伪造媒体引用或夸大承诺。`,
    ``,
    `---`,
    `*资产包由 MOY GEO 品牌事实资产包生成器生成 · ${new Date().toLocaleDateString("zh-CN")}*`,
  );
}
