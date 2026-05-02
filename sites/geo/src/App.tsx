import { useState } from "react";

/* ============================================================
   MOY GEO — AI 搜索增长与品牌可见度服务  销售页
   风格：专业 B 端 · 科技感 · 克制 · 不浮夸
   ============================================================ */

const C = {
  blue: "#0055cc",
  blueLight: "#e8f1ff",
  dark: "#0d1b2a",
  darker: "#060f1a",
  gray: "#5a6a7e",
  grayLight: "#eaeef3",
  bg: "#f7f9fb",
  white: "#fff",
  green: "#0f7b3a",
  greenBg: "#e6f4ea",
  amber: "#b85c00",
  amberBg: "#fff6ea",
};

const sans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif';

const h1 = {
  fontSize: "clamp(30px, 5vw, 48px)",
  fontWeight: 800,
  letterSpacing: "-0.5px",
  lineHeight: 1.15,
};
const h2 = {
  fontSize: "clamp(24px, 3.5vw, 32px)",
  fontWeight: 700,
  letterSpacing: "-0.3px",
  lineHeight: 1.25,
};
const body = {
  fontSize: "clamp(15px, 2vw, 17px)",
  color: C.gray,
  lineHeight: 1.75,
};
const small = { fontSize: 14, color: C.gray, lineHeight: 1.7 };

const section = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "88px 24px",
};

const sectionNarrow = {
  maxWidth: 760,
  margin: "0 auto",
  padding: "80px 24px",
};

const pill = (active: boolean) => ({
  display: "inline-block",
  padding: "5px 14px",
  borderRadius: 20,
  fontSize: 13,
  fontWeight: 600,
  background: active ? C.blueLight : C.grayLight,
  color: active ? C.blue : C.gray,
  margin: "0 6px 8px 0",
});

function App() {
  /* ---------- 表单占位（不做真实提交） ---------- */
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ fontFamily: sans, color: C.dark, background: C.bg, minHeight: "100vh" }}>
      {/* ==================== NAV ==================== */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(247,249,251,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e8ecf1",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
        }}
      >
        <a href="#" style={{ fontWeight: 800, fontSize: 20, color: C.dark, textDecoration: "none", letterSpacing: "-0.3px" }}>
          MOY<span style={{ color: C.blue }}>GEO</span>
        </a>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {["服务", "方案", "流程", "FAQ"].map((l) => (
            <a
              key={l}
              href={`#${l}`}
              style={{ textDecoration: "none", color: C.gray, fontSize: 14, fontWeight: 500 }}
            >
              {l}
            </a>
          ))}
          <a
            href="#contact"
            style={{
              display: "inline-block",
              padding: "8px 20px",
              background: C.blue,
              color: C.white,
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            预约诊断
          </a>
        </div>
      </nav>

      {/* ==================== 1. HERO ==================== */}
      <header
        style={{
          background: `linear-gradient(170deg, ${C.darker} 0%, ${C.dark} 40%, #122744 100%)`,
          color: C.white,
          textAlign: "center",
          padding: "100px 24px 80px",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.10)",
              color: "#8eb8e0",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 28,
            }}
          >
            AI 搜索增长 · 品牌可见度服务
          </div>
          <h1 style={{ ...h1, color: C.white, marginBottom: 20 }}>
            让你的品牌在 AI 搜索时代被看见
          </h1>
          <p style={{ ...body, color: "#9bb5d4", maxWidth: 560, margin: "0 auto 40px" }}>
            MOY GEO 帮助企业建设 AI 能读懂、能引用、能推荐的品牌内容资产，
            提升在智能问答和 AI 搜索结果中的可见度。
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="#contact"
              style={{
                display: "inline-block",
                padding: "14px 32px",
                background: C.blue,
                color: C.white,
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              获取 AI 可见度诊断
            </a>
            <a
              href="#plan"
              style={{
                display: "inline-block",
                padding: "14px 32px",
                background: "rgba(255,255,255,0.10)",
                color: C.white,
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              查看服务方案
            </a>
          </div>
        </div>
      </header>

      {/* ==================== 2. 痛点区 ==================== */}
      <section id="service" style={sectionNarrow}>
        <p style={{ ...small, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: C.blue, fontWeight: 700 }}>
          为什么需要 GEO
        </p>
        <h2 style={{ ...h2, marginBottom: 16 }}>
          AI 正在重塑用户获取信息的方式，你的品牌准备好了吗？
        </h2>
        <p style={{ ...body, marginBottom: 48 }}>
          当用户打开 ChatGPT、豆包或 Kimi 询问"哪个 CRM 好用"时，
          如果你的品牌从未出现在回答中 — 你已经在丢失客户。
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            {
              k: "流量入口正在迁移",
              d: "用户不再只依赖百度或 Google。AI 问答正在成为新一代信息获取入口。当用户直接在 AI 中提问时，传统搜索排名不再起作用。",
            },
            {
              k: "你的品牌可能在 AI 中完全不可见",
              d: "AI 模型基于训练数据和实时检索生成回答。如果你的品牌信息没有被 AI 收录、理解或认为是可信来源，你就在答案中缺席。",
            },
            {
              k: "AI 可能错误描述你的业务",
              d: "当 AI 缺少结构化信息时，可能从过时页面、第三方评论甚至竞品网站中提取信息，导致用户对你的品牌产生错误认知。",
            },
            {
              k: "竞品可能正在被优先推荐",
              d: `竞品如果已经建设了 AI 可读的内容资产和事实数据，在"XX 行业有哪些好的服务商"这类问题中会被优先引用和推荐。`,
            },
            {
              k: "传统 SEO 不等于 GEO",
              d: "SEO 优化关键词密度和反向链接让页面被搜索引擎收录和排序。GEO 则需要让 AI 模型理解你是谁、做什么、为什么可信 — 这是两套完全不同的方法论。",
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 20,
                alignItems: "baseline",
                padding: "20px 0",
                borderBottom: i < 4 ? "1px solid #e8ecf1" : "none",
              }}
            >
              <div
                style={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: C.blueLight,
                  color: C.blue,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 14,
                  marginTop: 2,
                }}
              >
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
      <section id="方案" style={{ ...section, background: C.white, maxWidth: "100%", padding: "88px calc((100% - 1100px)/2 + 24px)" }}>
        <div style={{ maxWidth: 1100 }}>
          <p style={{ ...small, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: C.blue, fontWeight: 700 }}>
            服务内容
          </p>
          <h2 style={{ ...h2, marginBottom: 16 }}>从诊断到持续增长，一站式品牌 AI 可见度建设</h2>
          <p style={{ ...body, marginBottom: 48 }}>
            MOY GEO 不是一次性的报告交付，而是帮助企业在 AI 搜索环境中建立长期、稳定、可信的品牌存在。
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {[
              {
                icon: "🔎",
                t: "品牌 AI 可见度诊断",
                d: "在 ChatGPT、豆包、Kimi、通义、Perplexity 等主流 AI 平台检索品牌引用情况，量化可见度评分，发现信息缺口与偏差。",
              },
              {
                icon: "📊",
                t: "竞品 AI 曝光对比",
                d: "选取 3-5 家主要竞品，对比在 AI 平台中的引用频率、情感倾向、信息完整度和推荐强度，明确差距与机会。",
              },
              {
                icon: "📋",
                t: "品牌事实资产库建设",
                d: "梳理品牌核心事实 — 成立时间、主营业务、资质认证、服务范围、客户案例 — 按 AI 可读的结构化格式建立事实资产库。",
              },
              {
                icon: "✍️",
                t: "GEO 内容选题与生产",
                d: "基于「用户可能在 AI 中问什么」设计内容选题，生产 FAQ、知识库条目、行业术语解释、选购指南等 AI 友好的结构化内容。",
              },
              {
                icon: "🏗️",
                t: "官网 AI 可读结构优化",
                d: "优化官网 Schema 标记、结构化数据、页面层级和内容密度，让 AI 爬取时能准确提取品牌信息而非碎片化文本。",
              },
              {
                icon: "📡",
                t: "多平台内容资产分发建议",
                d: "不依赖单一平台。基于品牌内容资产，评估在多个 AI 平台和内容生态中的最佳分发策略。",
              },
              {
                icon: "📈",
                t: "月度 AI 回答监测报告",
                d: "每月检测品牌在核心 AI 平台中的引用变化，识别新出现的信息偏差或竞品动作，输出可视化趋势报告和优化建议。",
              },
            ].map((s) => (
              <div
                key={s.t}
                style={{
                  background: C.bg,
                  borderRadius: 10,
                  border: "1px solid #e8ecf1",
                  padding: 28,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.t}</h3>
                <p style={{ ...small, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 4. 服务流程 ==================== */}
      <section id="流程" style={section}>
        <p style={{ ...small, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: C.blue, fontWeight: 700 }}>
          服务流程
        </p>
        <h2 style={{ ...h2, marginBottom: 16 }}>六步流程，从诊断到持续增长</h2>
        <p style={{ ...body, marginBottom: 48 }}>
          每个阶段交付结果明确，不模糊承诺，不黑箱操作。
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 700 }}>
          {[
            { n: "01", t: "提交品牌信息", d: "填写品牌基本信息、行业、目标市场、主要竞品。GEO 团队进行需求对齐和诊断范围确认。" },
            { n: "02", t: "生成 AI 可见度诊断", d: "在主流 AI 平台系统化检索品牌，输出可见度评分、信息缺口、偏差和竞品对比报告。" },
            { n: "03", t: "建立品牌事实资产", d: "基于诊断结果，梳理品牌核心事实，按结构化格式整理为 AI 可读的事实资产库。" },
            { n: "04", t: "生产 GEO 内容", d: "围绕 AI 可能被问及的场景，生产 FAQ、知识库、结构化页面等内容资产，并优化官网 Schema 标记。" },
            { n: "05", t: "持续监测 AI 回答变化", d: "每月检测品牌在核心平台中的引用变化，追踪新出现的偏差或竞品动态。" },
            { n: "06", t: "月度复盘与优化", d: "输出月度报告，总结变化趋势，提出下月优化策略和内容生产优先级。" },
          ].map((step, i) => (
            <div
              key={step.n}
              style={{
                display: "flex",
                gap: 24,
                alignItems: "flex-start",
                padding: "24px 0",
                borderBottom: i < 5 ? "1px solid #e8ecf1" : "none",
                position: "relative" as const,
              }}
            >
              <div
                style={{
                  minWidth: 48,
                  height: 48,
                  borderRadius: 12,
                  background: C.blue,
                  color: C.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                {step.n}
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{step.t}</h3>
                <p style={{ ...small, margin: 0 }}>{step.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 5. 套餐区 ==================== */}
      <section id="plan" style={{ ...section, background: C.white, maxWidth: "100%", padding: "88px calc((100% - 1100px)/2 + 24px)" }}>
        <div style={{ maxWidth: 1100 }}>
          <p style={{ ...small, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: C.blue, fontWeight: 700 }}>
            服务方案
          </p>
          <h2 style={{ ...h2, marginBottom: 16 }}>选择适合你企业的服务级别</h2>
          <p style={{ ...body, marginBottom: 48 }}>
            所有方案均基于真实品牌资料。不夸大、不保证排名、不做虚假内容。
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {[
              {
                name: "诊断版",
                price: "¥3,980",
                period: "一次性",
                desc: "了解你的品牌在 AI 平台中的可见度现状",
                items: [
                  "覆盖 6 大主流 AI 平台",
                  "品牌 AI 可见度评分",
                  "信息缺口与偏差分析",
                  "竞品简要对比（≤3 家）",
                  "结构化诊断报告 PDF",
                  "一次优化建议书面交付",
                ],
                highlight: false,
              },
              {
                name: "标准版",
                price: "¥9,800",
                period: "/月",
                desc: "建立品牌 AI 内容资产，持续提升可见度",
                items: [
                  "诊断版全部内容",
                  "品牌事实资产库建设",
                  "GEO 内容月度生产（≥4 篇）",
                  "官网 AI 可读结构优化",
                  "月度 AI 回答监测报告",
                  "月度复盘会议（线上）",
                  "专属 GEO 顾问对接",
                ],
                highlight: true,
              },
              {
                name: "定制版",
                price: "¥30,000",
                period: "/月",
                desc: "多品牌/集团级 AI 搜索品牌管理",
                items: [
                  "标准版全部内容 × 多品牌",
                  "定制品牌内容策略",
                  "行业术语库建设",
                  "全平台内容资产分发执行",
                  "舆情与回答偏差应急响应",
                  "季度高管战略复盘会",
                  "专职 GEO 经理 + 内容团队",
                ],
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                style={{
                  background: plan.highlight ? C.dark : C.bg,
                  color: plan.highlight ? C.white : C.dark,
                  borderRadius: 14,
                  border: plan.highlight ? "none" : "1px solid #e8ecf1",
                  padding: 32,
                  position: "relative" as const,
                  transform: plan.highlight ? "scale(1.03)" : "none",
                }}
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      padding: "4px 16px",
                      borderRadius: 12,
                      background: C.blue,
                      color: C.white,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    推荐
                  </div>
                )}
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{plan.name}</h3>
                <p style={{ ...small, color: plan.highlight ? "#9bb5d4" : C.gray, marginBottom: 16 }}>
                  {plan.desc}
                </p>
                <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 2 }}>
                  {plan.price}
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{plan.period}</span>
                </div>
                <div style={{ height: 1, background: plan.highlight ? "rgba(255,255,255,0.12)" : "#e8ecf1", margin: "24px 0" }} />
                <ul
                  style={{
                    padding: 0,
                    margin: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {plan.items.map((item) => (
                    <li
                      key={item}
                      style={{
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: plan.highlight ? "#c0d4e8" : C.gray,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <span style={{ color: plan.highlight ? "#5ba0f5" : C.blue, fontWeight: 700 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: 28,
                    padding: "12px 0",
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 700,
                    textDecoration: "none",
                    background: plan.highlight ? C.blue : C.blue,
                    color: C.white,
                  }}
                >
                  咨询方案
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 6. 合规声明 ==================== */}
      <section style={{ ...sectionNarrow, padding: "64px 24px" }}>
        <div
          style={{
            background: C.greenBg,
            border: `1px solid #c8e6d0`,
            borderRadius: 10,
            padding: 32,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.green, marginBottom: 12 }}>
            合规与价值观声明
          </h3>
          <p style={{ ...small, color: "#2a5a3a", marginBottom: 20 }}>
            MOY GEO 基于企业真实资料、真实服务、真实案例和有价值内容进行 AI
            可读内容资产建设。我们坚持对品牌和用户双方负责。
          </p>
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

      {/* ==================== 7. 表单区 ==================== */}
      <section id="contact" style={{ ...section, background: C.white, maxWidth: "100%", padding: "88px calc((100% - 1100px)/2 + 24px)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <p style={{ ...small, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: C.blue, fontWeight: 700 }}>
            预约诊断
          </p>
          <h2 style={{ ...h2, marginBottom: 12 }}>让我们了解你的品牌</h2>
          <p style={{ ...body, marginBottom: 40 }}>
            提交信息后，GEO 团队将在 1 个工作日内联系你，进行需求对齐和下一步安排。当前为表单占位，暂不连接后端。
          </p>

          {submitted ? (
            <div
              style={{
                background: C.greenBg,
                border: "1px solid #c8e6d0",
                borderRadius: 10,
                padding: 40,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: C.green, marginBottom: 8 }}>
                提交成功
              </h3>
              <p style={{ ...small, color: "#2a5a3a", margin: 0 }}>
                当前为静态表单占位。正式上线后，你的信息将直接送达 GEO 团队。
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}
            >
              {[
                { label: "公司名称", placeholder: "你的公司全称", span: 1 },
                { label: "品牌名称", placeholder: "需要诊断的品牌名", span: 1 },
                { label: "官网", placeholder: "https://", span: 2 },
                { label: "行业", placeholder: "如 SaaS、制造业、教育等", span: 1 },
                { label: "目标城市", placeholder: "主要服务城市或区域", span: 1 },
                { label: "主要竞品（可选）", placeholder: "你最关注的竞品品牌", span: 2 },
                { label: "联系人", placeholder: "你的姓名", span: 1 },
                { label: "手机/微信", placeholder: "联系方式", span: 1 },
              ].map((f) => (
                <div key={f.label} style={{ gridColumn: `span ${f.span}` }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: C.dark }}>
                    {f.label}
                  </label>
                  <input
                    placeholder={f.placeholder}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 6,
                      border: "1px solid #d0d5dd",
                      fontSize: 14,
                      color: C.dark,
                      background: C.bg,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: C.dark }}>
                  备注（可选）
                </label>
                <textarea
                  placeholder="你想了解什么？有什么特别关注的方面？"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 6,
                    border: "1px solid #d0d5dd",
                    fontSize: 14,
                    color: C.dark,
                    background: C.bg,
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ gridColumn: "span 2", paddingTop: 8 }}>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "16px 0",
                    background: C.blue,
                    color: C.white,
                    borderRadius: 8,
                    border: "none",
                    fontSize: 17,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  提交预约
                </button>
                <p style={{ ...small, marginTop: 12, textAlign: "center" }}>
                  提交即表示同意我们的隐私政策，信息仅用于 GEO 诊断沟通。
                </p>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer
        style={{
          background: C.darker,
          color: "#7a8fa8",
          textAlign: "center",
          padding: "40px 24px",
          fontSize: 13,
          lineHeight: 1.8,
        }}
      >
        <p style={{ margin: 0 }}>
          MOY GEO — AI 搜索增长与品牌可见度服务 &nbsp;|&nbsp; 桐鸣科技旗下品牌
        </p>
        <p style={{ margin: "6px 0 0" }}>
          <a href="https://moy.com" style={{ color: "#5ba0f5", textDecoration: "none" }}>
            moy.com
          </a>
          &nbsp;·&nbsp;
          <a href="https://app.moy.com" style={{ color: "#5ba0f5", textDecoration: "none" }}>
            MOY App
          </a>
          &nbsp;·&nbsp;
          <a href="https://api.moy.com" style={{ color: "#5ba0f5", textDecoration: "none" }}>
            MOY API
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
