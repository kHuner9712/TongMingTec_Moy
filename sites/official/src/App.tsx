import { useState } from "react";

/* ============================================================
   MOY Official — 品牌官网首页 (moy.com)
   风格：科技公司 · B 端可信 · 简洁高级 · 不做模板站
   ============================================================ */

const C = {
  brand:   "#005bb5",
  brandBg: "#e8f1ff",
  dark:    "#080e1a",
  darker:  "#03060c",
  gray:    "#5f6d80",
  grayLt:  "#e8ecf1",
  bg:      "#f8f9fb",
  white:   "#fff",
  green:   "#0f6e3a",
  greenBg: "#e6f4ea",
};

const sans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif';

const h1 = (s: React.CSSProperties): React.CSSProperties => ({
  fontSize: "clamp(30px, 5.5vw, 52px)",
  fontWeight: 800,
  letterSpacing: "-0.7px",
  lineHeight: 1.12,
  ...s,
});
const h2 = (s?: React.CSSProperties): React.CSSProperties => ({
  fontSize: "clamp(22px, 3.5vw, 30px)",
  fontWeight: 700,
  letterSpacing: "-0.3px",
  lineHeight: 1.22,
  ...s,
});

const wrapWide  = { maxWidth: 1120, margin: "0 auto", padding: "0 24px" };
const wrapNarrow = { maxWidth: 760, margin: "0 auto", padding: "0 24px" };

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1.5, color: C.brand, marginBottom: 8 }}>
      {text}
    </p>
  );
}

function App() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div style={{ fontFamily: sans, color: C.dark, background: C.bg, minHeight: "100vh" }}>
      {/* ==================== NAV ==================== */}
      <nav
        style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "rgba(248,249,251,0.94)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e4e8ed",
          padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56,
        }}
      >
        <a href="#" style={{ fontWeight: 800, fontSize: 20, color: C.dark, textDecoration: "none", letterSpacing: "-0.5px" }}>
          MOY<span style={{ fontWeight: 400, color: C.gray }}> 墨言</span>
        </a>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {["产品", "客户", "联系"].map((l) => (
            <a key={l} href={`#${l}`} style={{ textDecoration: "none", color: C.gray, fontSize: 14, fontWeight: 500 }}>
              {l}
            </a>
          ))}
        </div>
      </nav>

      {/* ==================== 1. HERO ==================== */}
      <header
        style={{
          background: `linear-gradient(175deg, ${C.darker} 0%, ${C.dark} 35%, #0f2040 100%)`,
          color: C.white, textAlign: "center" as const,
          padding: "96px 24px 80px",
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "inline-block", padding: "5px 16px", borderRadius: 20, background: "rgba(255,255,255,0.07)", color: "#80b8e4", fontSize: 13, fontWeight: 600, marginBottom: 28 }}>
            桐鸣科技旗下品牌
          </div>
          <h1 style={h1({ color: C.white, marginBottom: 18 })}>
            企业 AI 增长与经营自动化平台
          </h1>
          <p style={{ fontSize: "clamp(15px, 2.2vw, 18px)", color: "#90b0d4", maxWidth: 560, margin: "0 auto 44px", lineHeight: 1.75 }}>
            MOY 连接 AI 搜索增长、多模型 API 网关与客户经营自动化，帮助企业在 AI 时代获得曝光、提升效率并交付业务结果。
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { t: "了解 MOY GEO",  href: "https://geo.moy.com" },
              { t: "查看 MOY API",  href: "https://api.moy.com" },
              { t: "进入 MOY App",  href: "https://app.moy.com" },
            ].map((cta) => (
              <a
                key={cta.t}
                href={cta.href}
                style={{
                  display: "inline-block", padding: "13px 30px", borderRadius: 8,
                  textDecoration: "none", fontSize: 15, fontWeight: 700,
                  background: "rgba(255,255,255,0.09)", color: C.white,
                }}
              >
                {cta.t}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ==================== 2. 产品矩阵 ==================== */}
      <section id="product" style={{ padding: "96px 24px" }}>
        <div style={wrapWide}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel text="产品矩阵" />
            <h2 style={h2()}>三条产品线，一个完整生态</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {[
              {
                name: "MOY GEO",
                tag: "AI 搜索增长服务",
                desc: "让品牌在 AI 问答和 AI 搜索中被看见、被理解、被推荐。覆盖 ChatGPT、豆包、Kimi、通义千问、Perplexity 等主流平台。",
                url: "https://geo.moy.com",
                accent: "#0066cc",
              },
              {
                name: "MOY API",
                tag: "多模型 API 网关",
                desc: "一个接口统一调用多家 AI 模型，管理用量、日志、成本和稳定性。面向开发者与企业技术团队。",
                url: "https://api.moy.com",
                accent: "#0a7abf",
              },
              {
                name: "MOY App",
                tag: "AI 原生客户经营系统",
                desc: "管理线索、客户、商机、会话、工单、交付和客户成功。AI 驱动的结果交付型业务经营平台。",
                url: "https://app.moy.com",
                accent: "#0050a0",
              },
            ].map((p) => (
              <div
                key={p.name}
                style={{
                  background: C.white,
                  borderRadius: 14,
                  border: "1px solid #e4e8ed",
                  padding: "36px 32px 32px",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = "0 8px 36px rgba(0,0,0,0.08)";
                  el.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = "none";
                  el.style.transform = "none";
                }}
              >
                <div style={{ width: 40, height: 3, borderRadius: 2, background: p.accent, marginBottom: 20 }} />
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{p.name}</h3>
                <p style={{ fontSize: 15, fontWeight: 600, color: p.accent, marginBottom: 14 }}>{p.tag}</p>
                <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.8, marginBottom: 24 }}>{p.desc}</p>
                <a
                  href={p.url}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 22px", borderRadius: 6,
                    background: C.brandBg, color: C.brand,
                    textDecoration: "none", fontSize: 14, fontWeight: 700,
                  }}
                >
                  访问 {p.name} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 3. 为什么是 MOY ==================== */}
      <section id="about" style={{ background: C.white, padding: "96px 24px" }}>
        <div style={wrapNarrow}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel text="为什么是 MOY" />
            <h2 style={h2()}>不卖工具，交付结果</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                left: "不只做 AI 工具",
                right: "而是交付业务结果。MOY 的每一条产品线都围绕可度量的商业目标设计：获客、曝光、效率、续费。",
              },
              {
                left: "不只做内容",
                right: "而是建设 AI 可读的品牌资产。让 AI 模型准确理解你是谁、做什么、为什么值得推荐，而非碎片化地抓取信息。",
              },
              {
                left: "不只接模型",
                right: "而是建设可治理的 AI 调用底座。权限、限流、日志、成本控制——企业级 AI Gateway，不是简单的 API 代理。",
              },
              {
                left: "不只管理客户",
                right: "而是连接获客、成交、交付、续费全链路。从线索到客户成功，一个系统完成闭环，不做孤岛式功能堆叠。",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex", gap: 28, alignItems: "baseline",
                  padding: "24px 0",
                  borderBottom: i < 3 ? "1px solid #e8ecf1" : "none",
                }}
              >
                <div style={{ minWidth: 160, fontSize: 16, fontWeight: 700, color: C.dark, lineHeight: 1.5 }}>
                  {item.left}
                </div>
                <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.8, margin: 0 }}>
                  {item.right}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 4. 目标客户 ==================== */}
      <section id="customer" style={{ padding: "96px 24px" }}>
        <div style={wrapWide}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionLabel text="目标客户" />
            <h2 style={h2()}>为这些团队和组织而设计</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {[
              "销售型公司", "客服团队", "本地服务商",
              "企业服务公司", "AI 应用开发团队", "希望提升 AI 搜索曝光的品牌方",
            ].map((c) => (
              <div
                key={c}
                style={{
                  background: C.white, borderRadius: 10, border: "1px solid #e4e8ed",
                  padding: "24px 26px", textAlign: "center" as const,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: C.dark }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 5. 产品入口 ==================== */}
      <section style={{ background: C.white, padding: "80px 24px" }}>
        <div style={wrapNarrow}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionLabel text="产品入口" />
            <h2 style={h2()}>选择你需要的服务</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 440, margin: "0 auto" }}>
            {[
              { label: "MOY GEO — AI 搜索增长服务",   url: "https://geo.moy.com" },
              { label: "MOY API — 多模型 API 网关",    url: "https://api.moy.com" },
              { label: "MOY App — AI 原生客户经营系统", url: "https://app.moy.com" },
            ].map((e) => (
              <a
                key={e.label}
                href={e.url}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "18px 24px", borderRadius: 10,
                  background: C.bg, border: "1px solid #e4e8ed",
                  textDecoration: "none", color: C.dark,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(ev) => { (ev.currentTarget as HTMLAnchorElement).style.background = C.brandBg; }}
                onMouseLeave={(ev) => { (ev.currentTarget as HTMLAnchorElement).style.background = C.bg; }}
              >
                <span style={{ fontWeight: 600, fontSize: 15 }}>{e.label}</span>
                <span style={{ color: C.brand, fontWeight: 600, fontSize: 14 }}>进入 →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 6. 联系我们 ==================== */}
      <section id="contact" style={{ padding: "96px 24px" }}>
        <div style={wrapNarrow}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionLabel text="联系我们" />
            <h2 style={h2()}>和 MOY 团队聊聊</h2>
            <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.7, marginTop: 12 }}>
              告诉我们你的需求，我们帮你找到最合适的方案。当前为静态表单占位。
            </p>
          </div>

          {submitted ? (
            <div style={{ background: C.greenBg, border: "1px solid #c8e6d0", borderRadius: 12, padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: C.green, marginBottom: 8 }}>提交成功</h3>
              <p style={{ fontSize: 14, color: "#2a5a3a", margin: 0 }}>当前为静态表单占位。正式上线后将直达 MOY 团队。</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", maxWidth: 560, margin: "0 auto" }}
            >
              {[
                { label: "姓名", placeholder: "你的姓名", span: 1 },
                { label: "公司", placeholder: "公司全称", span: 1 },
              ].map((f) => (
                <div key={f.label} style={{ gridColumn: `span ${f.span}` }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: C.dark }}>{f.label}</label>
                  <input
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 6, border: "1px solid #d0d5dd", fontSize: 14, color: C.dark, background: C.bg, boxSizing: "border-box" }}
                  />
                </div>
              ))}

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: C.dark }}>需求类型</label>
                <div style={{ display: "flex", gap: 24, padding: "10px 0", flexWrap: "wrap" }}>
                  {["MOY GEO", "MOY API", "MOY App", "定制方案"].map((t) => (
                    <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
                      <input type="radio" name="need" defaultChecked={t === "MOY GEO"} /> {t}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: C.dark }}>联系方式</label>
                <input
                  placeholder="手机 / 微信 / 邮箱"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 6, border: "1px solid #d0d5dd", fontSize: 14, color: C.dark, background: C.bg, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: C.dark }}>备注（可选）</label>
                <textarea
                  placeholder="有什么想告诉我们的？"
                  rows={3}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 6, border: "1px solid #d0d5dd", fontSize: 14, color: C.dark, background: C.bg, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>

              <div style={{ gridColumn: "span 2", paddingTop: 8 }}>
                <button
                  type="submit"
                  style={{ width: "100%", padding: "15px 0", background: C.brand, color: C.white, borderRadius: 8, border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer" }}
                >
                  提交
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer style={{ background: C.darker, color: "#6a7e94", textAlign: "center", padding: "44px 24px", fontSize: 13, lineHeight: 2 }}>
        <p style={{ margin: 0, fontWeight: 600, color: "#8098b8", fontSize: 15 }}>
          MOY <span style={{ fontWeight: 400, color: "#6a7e94" }}>墨言</span>
        </p>
        <p style={{ margin: "4px 0 12px" }}>企业 AI 增长与经营自动化平台 · 桐鸣科技旗下品牌</p>
        <p style={{ margin: 0 }}>
          <a href="https://geo.moy.com" style={{ color: "#5ba0f5", textDecoration: "none" }}>MOY GEO</a>
          &nbsp;·&nbsp;
          <a href="https://api.moy.com" style={{ color: "#5ba0f5", textDecoration: "none" }}>MOY API</a>
          &nbsp;·&nbsp;
          <a href="https://app.moy.com" style={{ color: "#5ba0f5", textDecoration: "none" }}>MOY App</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
