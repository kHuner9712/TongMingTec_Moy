import LeadForm from "./components/LeadForm";
import DevSubmissionsPanel from "./components/DevSubmissionsPanel";
import AdminLeadsPage from "./admin/AdminLeadsPage";
import ReportBuilderPage from "./admin/reports/ReportBuilderPage";
import BrandAssetBuilderPage from "./admin/brand-assets/BrandAssetBuilderPage";
import ReportsListPage from "./admin/ReportsListPage";
import BrandAssetsListPage from "./admin/BrandAssetsListPage";
import ContentTopicsListPage from "./admin/ContentTopicsListPage";
import ContentPlansListPage from "./admin/ContentPlansListPage";
import ContentTopicEditorPage from "./admin/ContentTopicEditorPage";
import ContentPlanEditorPage from "./admin/ContentPlanEditorPage";
import ContentDraftsListPage from "./admin/ContentDraftsListPage";
import ContentDraftEditorPage from "./admin/ContentDraftEditorPage";
import GeoWorkspacePage from "./admin/workspace/GeoWorkspacePage";
import { C, sans, h1, h2, body, small, section, sectionNarrow, sectionWhite, navBar, navLink, btnPrimary, heroBg, painItem, serviceCard, stepItem, footer, SectionLabel } from "./styles";

const FAQ_LIST = [
  { q: "GEO 是什么？", a: "GEO（生成式引擎优化）是帮助品牌在 AI 搜索/问答平台（如 ChatGPT、豆包、Kimi、通义千问）中被看见、被理解、被推荐的系统化方法。与传统搜索引擎优化不同，GEO 面向的是 AI 模型的推理和检索机制。" },
  { q: "GEO 和传统 SEO 的区别是什么？", a: "SEO 优化关键词密度、反向链接和页面结构让搜索引擎收录和排序。GEO 需要让 AI 模型理解你是谁、做什么、为什么可信。两者方法论完全不同，GEO 更强调结构化事实数据、权威内容和语义关联。" },
  { q: "如何保证不做虚假内容和垃圾信息？", a: "MOY GEO 严格遵守合规底线：所有品牌事实基于真实资料，所有案例经客户授权，不做垃圾内容批量发布，不伪造媒体报道或客户评价，不保证 AI 搜索结果排名。只提供基于真实资料的可见度提升服务。" },
  { q: "多久能看到效果？", a: "AI 搜索可见度的提升是一个渐进过程。诊断报告可在提交资料后 3-5 个工作日内完成。品牌事实资产建设和内容生产通常需要 2-4 周。AI 平台中可见度的变化通常需要 1-3 个月持续建设和监测。" },
  { q: "什么样的企业适合 GEO？", a: `B2B 服务商、SaaS 企业、专业服务机构（法律/咨询/财税）、本地服务商、教育机构等需要被潜在客户在 AI 中检索到的企业。如果你的客户可能在 AI 中问"哪个 XX 比较好"，你就需要 GEO。` },
  { q: "需要技术团队配合吗？", a: "GEO 服务的大部分工作由 MOY GEO 团队完成。客户需要配合提供品牌资料、确认内容方向，以及授权操作官网站点的技术标记（Schema 标记等）。通常不需要客户自有技术团队参与。" },
  { q: "第一步应该做什么？", a: "填写上方表单预约 AI 可见度诊断，GEO 团队将在 1 个工作日内联系你，进行需求对齐和诊断范围确认。诊断是你的品牌在 AI 搜索时代的第一步。" },
];

export default function App() {
  if (window.location.pathname.startsWith("/admin/workspace")) {
    return <GeoWorkspacePage />;
  }
  if (window.location.pathname.startsWith("/admin/content-drafts/new")) {
    return <ContentDraftEditorPage />;
  }
  if (window.location.pathname.startsWith("/admin/content-drafts")) {
    return <ContentDraftsListPage />;
  }
  if (window.location.pathname.startsWith("/admin/content-topics/new")) {
    return <ContentTopicEditorPage />;
  }
  if (window.location.pathname.startsWith("/admin/content-topics")) {
    return <ContentTopicsListPage />;
  }
  if (window.location.pathname.startsWith("/admin/content-plans/new")) {
    return <ContentPlanEditorPage />;
  }
  if (window.location.pathname.startsWith("/admin/content-plans")) {
    return <ContentPlansListPage />;
  }
  if (window.location.pathname.startsWith("/admin/brand-assets/new")) {
    return <BrandAssetBuilderPage />;
  }
  if (window.location.pathname.startsWith("/admin/brand-assets")) {
    return <BrandAssetsListPage />;
  }
  if (window.location.pathname.startsWith("/admin/reports/new")) {
    return <ReportBuilderPage />;
  }
  if (window.location.pathname.startsWith("/admin/reports")) {
    return <ReportsListPage />;
  }
  if (window.location.pathname.startsWith("/admin/leads")) {
    return <AdminLeadsPage />;
  }

  return (
    <div style={{ fontFamily: sans, color: C.dark, background: C.bg, minHeight: "100vh" }}>
      {/* ==================== NAV ==================== */}
      <nav style={navBar}>
        <a href="#" style={{ fontWeight: 800, fontSize: 20, color: C.dark, textDecoration: "none", letterSpacing: "-0.3px" }}>
          MOY<span style={{ color: C.blue }}>GEO</span>
        </a>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="#services" style={navLink}>服务</a>
          <a href="#pricing" style={navLink}>方案</a>
          <a href="#process" style={navLink}>流程</a>
          <a href="#faq" style={navLink}>FAQ</a>
          <a href="#contact" style={btnPrimary}>预约诊断</a>
        </div>
      </nav>

      {/* ==================== 1. HERO ==================== */}
      <header style={heroBg}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: "rgba(255,255,255,0.10)", color: "#8eb8e0", fontSize: 13, fontWeight: 600, marginBottom: 28 }}>
            AI 搜索增长 · 品牌可见度服务
          </div>
          <h1 style={{ ...h1, color: C.white, marginBottom: 20 }}>让你的品牌在 AI 搜索时代被看见</h1>
          <p style={{ ...body, color: "#9bb5d4", maxWidth: 560, margin: "0 auto 40px" }}>
            MOY GEO 帮助企业建设 AI 能读懂、能引用、能推荐的品牌内容资产，提升在智能问答和 AI 搜索结果中的可见度。
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#contact" style={{ display: "inline-block", padding: "14px 32px", background: C.blue, color: C.white, borderRadius: 8, textDecoration: "none", fontSize: 16, fontWeight: 700 }}>
              获取 AI 可见度诊断
            </a>
            <a href="#pricing" style={{ display: "inline-block", padding: "14px 32px", background: "rgba(255,255,255,0.10)", color: C.white, borderRadius: 8, textDecoration: "none", fontSize: 16, fontWeight: 600 }}>
              查看服务方案
            </a>
          </div>
        </div>
      </header>

      {/* ==================== 2. 痛点区 ==================== */}
      <section id="services" style={sectionNarrow}>
        <SectionLabel text="为什么需要 GEO" />
        <h2 style={{ ...h2, marginBottom: 16 }}>AI 正在重塑用户获取信息的方式，你的品牌准备好了吗？</h2>
        <p style={{ ...body, marginBottom: 48 }}>
          当用户打开 ChatGPT、豆包或 Kimi 询问"哪个 CRM 好用"时，如果你的品牌从未出现在回答中 — 你已经在丢失客户。
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { k: "流量入口正在迁移", d: "用户不再只依赖百度或 Google。AI 问答正在成为新一代信息获取入口。当用户直接在 AI 中提问时，传统搜索排名不再起作用。" },
            { k: "你的品牌可能在 AI 中完全不可见", d: "AI 模型基于训练数据和实时检索生成回答。如果你的品牌信息没有被 AI 收录、理解或认为是可信来源，你就在答案中缺席。" },
            { k: "AI 可能错误描述你的业务", d: "当 AI 缺少结构化信息时，可能从过时页面、第三方评论甚至竞品网站中提取信息，导致用户对你的品牌产生错误认知。" },
            { k: "竞品可能正在被优先推荐", d: `竞品如果已经建设了 AI 可读的内容资产和事实数据，在"XX 行业有哪些好的服务商"这类问题中会被优先引用和推荐。` },
            { k: "传统 SEO 不等于 GEO", d: "SEO 优化关键词密度和反向链接让页面被搜索引擎收录和排序。GEO 则需要让 AI 模型理解你是谁、做什么、为什么可信 — 这是两套完全不同的方法论。" },
          ].map((item, i) => (
            <div key={i} style={{ ...painItem, borderBottom: i < 4 ? "1px solid #e8ecf1" : "none" }}>
              <div style={{ minWidth: 28, height: 28, borderRadius: "50%", background: C.blueLight, color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, marginTop: 2 }}>
                {i + 1}
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{item.k}</h3>
                <p style={{ ...small, margin: 0 }}>{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 3. 服务内容 ==================== */}
      <section id="pricing" style={sectionWhite}>
        <div style={{ maxWidth: 1100 }}>
          <SectionLabel text="服务内容" />
          <h2 style={{ ...h2, marginBottom: 16 }}>从诊断到持续增长，一站式品牌 AI 可见度建设</h2>
          <p style={{ ...body, marginBottom: 48 }}>MOY GEO 不是一次性的报告交付，而是帮助企业在 AI 搜索环境中建立长期、稳定、可信的品牌存在。</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {[
              { icon: "🔎", t: "品牌 AI 可见度诊断", d: "在 ChatGPT、豆包、Kimi、通义、Perplexity 等主流 AI 平台检索品牌引用情况，量化可见度评分，发现信息缺口与偏差。" },
              { icon: "📊", t: "竞品 AI 曝光对比", d: "选取 3-5 家主要竞品，对比在 AI 平台中的引用频率、情感倾向、信息完整度和推荐强度，明确差距与机会。" },
              { icon: "📋", t: "品牌事实资产库建设", d: "梳理品牌核心事实 — 成立时间、主营业务、资质认证、服务范围、客户案例 — 按 AI 可读的结构化格式建立事实资产库。" },
              { icon: "✍️", t: "GEO 内容选题与生产", d: "基于「用户可能在 AI 中问什么」设计内容选题，生产 FAQ、知识库条目、行业术语解释、选购指南等 AI 友好的结构化内容。" },
              { icon: "🏗️", t: "官网 AI 可读结构优化", d: "优化官网 Schema 标记、结构化数据、页面层级和内容密度，让 AI 爬取时能准确提取品牌信息而非碎片化文本。" },
              { icon: "📡", t: "多平台内容资产分发建议", d: "不依赖单一平台。基于品牌内容资产，评估在多个 AI 平台和内容生态中的最佳分发策略。" },
              { icon: "📈", t: "月度 AI 回答监测报告", d: "每月检测品牌在核心 AI 平台中的引用变化，识别新出现的信息偏差或竞品动作，输出可视化趋势报告和优化建议。" },
            ].map((s) => (
              <div key={s.t} style={serviceCard}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.t}</h3>
                <p style={{ ...small, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 4. 套餐区 ==================== */}
      <section style={section}>
        <SectionLabel text="服务方案" />
        <h2 style={{ ...h2, marginBottom: 16 }}>选择适合你企业的服务级别</h2>
        <p style={{ ...body, marginBottom: 48 }}>所有方案均基于真实品牌资料。不夸大、不保证排名、不做虚假内容。</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            {
              name: "诊断版", price: "¥3,980", period: "一次性",
              desc: "了解你的品牌在 AI 平台中的可见度现状",
              items: ["覆盖 6 大主流 AI 平台", "品牌 AI 可见度评分", "信息缺口与偏差分析", "竞品简要对比（≤3 家）", "结构化诊断报告 PDF", "一次优化建议书面交付"],
              highlight: false,
            },
            {
              name: "标准版", price: "¥9,800", period: "/月",
              desc: "建立品牌 AI 内容资产，持续提升可见度",
              items: ["诊断版全部内容", "品牌事实资产库建设", "GEO 内容月度生产（≥4 篇）", "官网 AI 可读结构优化", "月度 AI 回答监测报告", "月度复盘会议（线上）", "专属 GEO 顾问对接"],
              highlight: true,
            },
            {
              name: "定制版", price: "¥30,000", period: "/月",
              desc: "多品牌/集团级 AI 搜索品牌管理",
              items: ["标准版全部内容 × 多品牌", "定制品牌内容策略", "行业术语库建设", "全平台内容资产分发执行", "舆情与回答偏差应急响应", "季度高管战略复盘会", "专职 GEO 经理 + 内容团队"],
              highlight: false,
            },
          ].map((plan) => (
            <div key={plan.name} style={{ background: plan.highlight ? C.dark : C.bg, color: plan.highlight ? C.white : C.dark, borderRadius: 14, border: plan.highlight ? "none" : "1px solid #e8ecf1", padding: 32, position: "relative" as const, transform: plan.highlight ? "scale(1.03)" : "none" }}>
              {plan.highlight && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 12, background: C.blue, color: C.white, fontSize: 12, fontWeight: 700 }}>推荐</div>}
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{plan.name}</h3>
              <p style={{ ...small, color: plan.highlight ? "#9bb5d4" : C.gray, marginBottom: 16 }}>{plan.desc}</p>
              <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 2 }}>{plan.price}<span style={{ fontSize: 14, fontWeight: 500 }}>{plan.period}</span></div>
              <div style={{ height: 1, background: plan.highlight ? "rgba(255,255,255,0.12)" : "#e8ecf1", margin: "24px 0" }} />
              <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {plan.items.map((item) => (
                  <li key={item} style={{ fontSize: 14, lineHeight: 1.6, color: plan.highlight ? "#c0d4e8" : C.gray, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: plan.highlight ? "#5ba0f5" : C.blue, fontWeight: 700 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <a href="#contact" style={{ display: "block", textAlign: "center", marginTop: 28, padding: "12px 0", borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: "none", background: C.blue, color: C.white }}>咨询方案</a>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 5. 服务流程 ==================== */}
      <section id="process" style={section}>
        <SectionLabel text="服务流程" />
        <h2 style={{ ...h2, marginBottom: 16 }}>六步流程，从诊断到持续增长</h2>
        <p style={{ ...body, marginBottom: 48 }}>每个阶段交付结果明确，不模糊承诺，不黑箱操作。</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 700 }}>
          {[
            { n: "01", t: "提交品牌信息", d: "填写品牌基本信息、行业、目标市场、主要竞品。GEO 团队进行需求对齐和诊断范围确认。" },
            { n: "02", t: "生成 AI 可见度诊断", d: "在主流 AI 平台系统化检索品牌，输出可见度评分、信息缺口、偏差和竞品对比报告。" },
            { n: "03", t: "建立品牌事实资产", d: "基于诊断结果，梳理品牌核心事实，按结构化格式整理为 AI 可读的事实资产库。" },
            { n: "04", t: "生产 GEO 内容", d: "围绕 AI 可能被问及的场景，生产 FAQ、知识库、结构化页面等内容资产，并优化官网 Schema 标记。" },
            { n: "05", t: "持续监测 AI 回答变化", d: "每月检测品牌在核心平台中的引用变化，追踪新出现的偏差或竞品动态。" },
            { n: "06", t: "月度复盘与优化", d: "输出月度报告，总结变化趋势，提出下月优化策略和内容生产优先级。" },
          ].map((step, i) => (
            <div key={step.n} style={{ ...stepItem, borderBottom: i < 5 ? "1px solid #e8ecf1" : "none" }}>
              <div style={{ minWidth: 48, height: 48, borderRadius: 12, background: C.blue, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>{step.n}</div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{step.t}</h3>
                <p style={{ ...small, margin: 0 }}>{step.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 6. FAQ ==================== */}
      <section id="faq" style={sectionWhite}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <SectionLabel text="常见问题" />
          <h2 style={{ ...h2, marginBottom: 40 }}>关于 GEO 的常见问题</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {FAQ_LIST.map((faq, i) => (
              <div key={i} style={{ padding: "22px 0", borderBottom: i < FAQ_LIST.length - 1 ? "1px solid #e8ecf1" : "none" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: C.dark }}>{faq.q}</h3>
                <p style={{ ...small, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 7. 合规声明 ==================== */}
      <section style={{ ...sectionNarrow, padding: "64px 24px" }}>
        <div style={{ background: C.greenBg, border: `1px solid #c8e6d0`, borderRadius: 10, padding: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.green, marginBottom: 12 }}>合规与价值观声明</h3>
          <p style={{ ...small, color: "#2a5a3a", marginBottom: 20 }}>MOY GEO 基于企业真实资料、真实服务、真实案例和有价值内容进行 AI 可读内容资产建设。我们坚持对品牌和用户双方负责。</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {[
              { ok: "基于真实资料的品牌内容建设", no: "虚假宣传或夸大服务能力" },
              { ok: "真实客户案例（经客户授权）", no: "伪造客户案例或编造效果数据" },
              { ok: "有价值的行业知识内容生产", no: "垃圾内容批量发布" },
              { ok: "合规的多平台信息同步", no: "恶意操纵 AI 搜索结果" },
              { ok: "透明的效果监测与报告", no: "伪造媒体报道或第三方引用" },
            ].map((r) => (
              <div key={r.ok} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: C.green, fontWeight: 700, fontSize: 14 }}>✓</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1a4a2a" }}>{r.ok}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 22 }}>
                  <span style={{ color: "#c04040", fontWeight: 700, fontSize: 14 }}>✗</span>
                  <span style={{ fontSize: 13, color: "#7a5050" }}>{r.no}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 8. 表单区 ==================== */}
      <section id="contact" style={sectionWhite}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <SectionLabel text="预约诊断" />
          <h2 style={{ ...h2, marginBottom: 12 }}>让我们了解你的品牌</h2>
          <p style={{ ...body, marginBottom: 40 }}>提交信息后，GEO 团队将在 1 个工作日内联系你，进行需求对齐和下一步安排。</p>
          <LeadForm />
          <p style={{ ...small, textAlign: "center", marginTop: 20, color: C.gray, lineHeight: 1.6 }}>
            提交信息仅用于 MOY GEO 诊断沟通与服务跟进，不会公开展示。正式隐私政策上线前，如需删除或更正信息，请联系 MOY 团队。
          </p>
        </div>
      </section>

      {/* ==================== 9. 开发调试面板 ==================== */}
      <DevSubmissionsPanel />

      {/* ==================== FOOTER ==================== */}
      <footer style={footer}>
        <p style={{ margin: 0 }}>MOY GEO — AI 搜索增长与品牌可见度服务 &nbsp;|&nbsp; 桐鸣科技旗下品牌</p>
        <p style={{ margin: "6px 0 0" }}>
          <a href="https://moy.com" style={{ color: "#5ba0f5", textDecoration: "none" }}>moy.com</a>
          &nbsp;·&nbsp;
          <a href="https://app.moy.com" style={{ color: "#5ba0f5", textDecoration: "none" }}>MOY App</a>
          &nbsp;·&nbsp;
          <a href="https://api.moy.com" style={{ color: "#5ba0f5", textDecoration: "none" }}>MOY API</a>
        </p>
      </footer>
    </div>
  );
}
