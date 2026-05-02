/* ============================================================
   MOY API — 多模型 API 网关 / 开发者平台  产品官网雏形
   风格：开发者向 · 简洁 · 专业 · 技术可信
   ============================================================ */

const C = {
  brand:   "#0066e0",
  brandBg: "#edf4ff",
  dark:    "#0a1628",
  darker:  "#040d18",
  gray:    "#5f6d80",
  grayLt:  "#eaedf2",
  bg:      "#f8f9fb",
  white:   "#fff",
  green:   "#0f7b3a",
  greenBg: "#e6f4ea",
  amber:   "#b85c00",
  amberBg: "#fff6ea",
  red:     "#c04040",
  terminal:"#0d1b2a",
  termFg:  "#c0d8f0",
  termAc:  "#5bc0de",
};

const sans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif';
const mono = '"Fira Code", "Cascadia Code", "JetBrains Mono", "Consolas", "Menlo", monospace';

function h1(s: React.CSSProperties): React.CSSProperties { return { fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.15, ...s }; }
function h2(s?: React.CSSProperties): React.CSSProperties { return { fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: 700, letterSpacing: "-0.3px", lineHeight: 1.25, ...s }; }

const section = { maxWidth: 1080, margin: "0 auto", padding: "88px 24px" };

function Label({ text }: { text: string }) {
  return <p style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1.2, color: C.brand, marginBottom: 8 }}>{text}</p>;
}

function App() {
  const jsonPayload = `'{"model":"moy-default","messages":[{"role":"user","content":"Hello MOY API"}]}'`;

  return (
    <div style={{ fontFamily: sans, color: C.dark, background: C.bg, minHeight: "100vh" }}>
      {/* ==================== NAV ==================== */}
      <nav style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(248,249,251,0.94)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e4e8ed", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <a href="#" style={{ fontWeight: 800, fontSize: 20, color: C.dark, textDecoration: "none", letterSpacing: "-0.3px" }}>
          MOY<span style={{ color: C.brand }}>API</span>
        </a>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {["能力", "模型", "方案", "文档"].map(l => (
            <a key={l} href={`#${l}`} style={{ textDecoration: "none", color: C.gray, fontSize: 14, fontWeight: 500 }}>{l}</a>
          ))}
          <a href="#pricing" style={{ display: "inline-block", padding: "8px 20px", background: C.brand, color: C.white, borderRadius: 6, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>控制台</a>
        </div>
      </nav>

      {/* ==================== 1. HERO ==================== */}
      <header style={{ background: `linear-gradient(175deg, ${C.darker} 0%, ${C.dark} 40%, #142c4a 100%)`, color: C.white, textAlign: "center", padding: "90px 24px 72px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: "rgba(255,255,255,0.08)", color: "#7db5e8", fontSize: 13, fontWeight: 600, marginBottom: 28 }}>
            多模型 API 网关 · 开发者平台
          </div>
          <h1 style={h1({ color: C.white, marginBottom: 16 })}>
            一个接口，统一调用多家 AI 模型
          </h1>
          <p style={{ fontSize: "clamp(15px, 2.2vw, 18px)", color: "#94b4d8", maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.7 }}>
            MOY API 提供多模型统一调用、API Key 管理、用量统计、调用日志、限流和成本控制，帮助团队更稳定地构建 AI 应用。
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { t: "查看接入文档", href: "#docs", primary: true },
              { t: "进入控制台", href: "#", primary: false },
              { t: "申请企业方案", href: "#pricing", primary: false },
            ].map(cta => (
              <a key={cta.t} href={cta.href} style={{ display: "inline-block", padding: "13px 28px", borderRadius: 8, textDecoration: "none", fontSize: 15, fontWeight: 700,
                background: cta.primary ? C.brand : "rgba(255,255,255,0.09)", color: C.white }}
              >{cta.t}</a>
            ))}
          </div>
        </div>
      </header>

      {/* ==================== 2. 核心能力区 ==================== */}
      <section id="能力" style={section}>
        <Label text="核心能力" />
        <h2 style={h2({ marginBottom: 12 })}>不只是 API 代理，是 AI Gateway</h2>
        <p style={{ fontSize: 16, color: C.gray, maxWidth: 600, marginBottom: 48, lineHeight: 1.7 }}>
          MOY API 在模型与你的应用之间提供统一接入、可观测、可治理的网关层。每一个请求都经过认证、限流、记录和统计。
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {[
            { n: "OpenAI-compatible 接口", d: "原生兼容 OpenAI SDK 与 HTTP API。一行 base_url 切换，零迁移成本接入你的现有应用。" },
            { n: "多模型统一调用", d: "GPT-4o、Claude、DeepSeek、通义千问、智谱 GLM — 同一套接口，按需切换模型参数。" },
            { n: "API Key 管理", d: "自助创建、吊销、重命名 API Key。支持按 Key 设置额度上限、有效期和模型白名单。" },
            { n: "项目级用量统计", d: "按项目/团队/Key 维度查看 token 消耗趋势。日/周/月粒度，支持 CSV 导出和 Grafana 集成。" },
            { n: "请求日志", d: "完整的请求-响应日志：时间、模型、token 数、耗时、状态码。支持按 Key 和模型检索，保留周期可配置。" },
            { n: "成本统计", d: "按模型 × Key × 时间维度的花费明细。预算预警，超额自动通知。" },
            { n: "基础限流", d: "按 Key 的 RPM 和 TPM 限流。支持软限制（告警）和硬限制（拒绝），防止单 Key 异常消耗资源。" },
            { n: "失败重试", d: "模型返回 5xx 或超时时自动重试，可配置重试次数和退避策略。重试记录进入日志。" },
            { n: "模型 fallback", d: "规划中。主模型不可用时自动降级至备用模型，保障业务连续性。", planned: true },
            { n: "缓存", d: "规划中。相同请求命中缓存直接返回，降低延迟和 token 成本。支持 TTL 和手动失效。", planned: true },
          ].map(f => (
            <div key={f.n} style={{ background: C.white, borderRadius: 10, border: "1px solid #e4e8ed", padding: "22px 24px", position: "relative" }}>
              {f.planned && <span style={{ position: "absolute", top: 10, right: 14, fontSize: 11, fontWeight: 700, color: C.amber, background: C.amberBg, padding: "2px 8px", borderRadius: 10 }}>规划中</span>}
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, paddingRight: f.planned ? 56 : 0 }}>{f.n}</h3>
              <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.75, margin: 0 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 3. 适用场景区 ==================== */}
      <section style={{ background: C.white, padding: "88px 24px" }}>
        <div style={section}>
          <Label text="适用场景" />
          <h2 style={h2({ marginBottom: 12 })}>从个人开发者到企业团队，一个平台承载</h2>
          <p style={{ fontSize: 16, color: C.gray, marginBottom: 40, lineHeight: 1.7 }}>
            MOY API 不是面向单一场景的工具，而是可嵌入各种 AI 工作流的模型基础设施层。
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {[
              { t: "AI 应用开发团队", d: "统一管理多个模型的 API Key 和用量。开发环境用低成本模型，生产环境切高精度模型，一个接口完成。" },
              { t: "企业内部 AI 工具", d: "企业自建 AI 助手、知识库问答、内部 Copilot — MOY API 提供统一的模型调用入口和用量治理能力。" },
              { t: "GEO 内容生成与诊断", d: "作为 MOY GEO 的模型调用底座，为品牌诊断、内容生成、竞品分析等工作流提供稳定的模型供应。" },
              { t: "客服/销售 AI 助手", d: "接入客服问答、销售话术生成、客户画像分析等场景。用量可追踪，成本可分摊到业务部门。" },
              { t: "多模型测试与切换", d: "在同一个接口上对比不同模型对同一 prompt 的响应质量和延迟，快速选型最优模型。" },
              { t: "私有化模型网关", d: "企业可将 MOY API 部署在私有环境中，作为内部多个应用的统一模型网关，集中管理权限和用量。" },
            ].map(s => (
              <div key={s.t} style={{ background: C.bg, borderRadius: 10, border: "1px solid #e4e8ed", padding: "24px 26px" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.t}</h3>
                <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.75, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 4. 模型列表区 ==================== */}
      <section id="模型" style={section}>
        <Label text="可用模型" />
        <h2 style={h2({ marginBottom: 12 })}>持续接入，按需扩展</h2>
        <p style={{ fontSize: 16, color: C.gray, marginBottom: 32, lineHeight: 1.7 }}>
          具体模型以后台配置和可用区域为准。以下为规划接入的模型系列。
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { brand: "OpenAI", models: "GPT-4o / GPT-4o-mini / o1 / o3-mini" },
            { brand: "DeepSeek", models: "DeepSeek-V3 / DeepSeek-R1" },
            { brand: "通义千问", models: "Qwen-Max / Qwen-Plus / Qwen-Turbo" },
            { brand: "智谱", models: "GLM-4 / GLM-4-Air / GLM-4-Flash" },
            { brand: "Gemini", models: "Gemini 2.0 Flash / Gemini 2.0 Pro" },
            { brand: "Claude", models: "Claude 3.5 Sonnet / Claude 3.5 Haiku" },
          ].map(m => (
            <div key={m.brand} style={{ background: C.white, borderRadius: 10, border: "1px solid #e4e8ed", padding: "20px 22px", textAlign: "center" }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{m.brand}</h3>
              <p style={{ fontSize: 13, color: C.gray, margin: 0, lineHeight: 1.6 }}>{m.models}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 5. 价格区 ==================== */}
      <section id="方案" style={{ background: C.white, padding: "88px 24px" }}>
        <div style={section} id="pricing">
          <Label text="服务模式" />
          <h2 style={h2({ marginBottom: 12 })}>灵活的接入方式，不给低价陷阱</h2>
          <p style={{ fontSize: 16, color: C.gray, marginBottom: 40, lineHeight: 1.7 }}>
            MOY API 不靠低价倒卖模型获利。我们提供的价值是统一的调用管理、治理和可观测性层。
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {[
              { n: "按量调用", d: "按实际 token 消耗计费。适合个人开发者和早期项目，零固定成本起步。", tag: "弹性" },
              { n: "余额预充值", d: "预充值余额，按量扣费。支持设置自动充值，避免服务中断。", tag: "可控" },
              { n: "企业包月", d: "按月固定费用，包含定额 token 额度。超出部分按量计费，适合稳定业务场景。", tag: "可预测" },
              { n: "私有化部署", d: "将 MOY API 部署在企业自有基础设施上。数据不出境，权限自控，适合金融、医疗等行业。", tag: "企业" },
              { n: "定制模型路由", d: "按企业需求定制模型路由策略、成本优化规则和专用模型接入。专属技术经理对接。", tag: "定制" },
            ].map(p => (
              <div key={p.n} style={{ background: C.bg, borderRadius: 12, border: "1px solid #e4e8ed", padding: "28px 26px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{p.n}</h3>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.brand, background: C.brandBg, padding: "3px 10px", borderRadius: 10 }}>{p.tag}</span>
                </div>
                <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.75, margin: 0 }}>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 6. 开发者示例区 ==================== */}
      <section id="docs" style={section}>
        <Label text="快速开始" />
        <h2 style={h2({ marginBottom: 12 })}>一行 curl，即刻接入</h2>
        <p style={{ fontSize: 16, color: C.gray, marginBottom: 32, lineHeight: 1.7 }}>
          OpenAI 兼容接口，零迁移成本。以下为占位示例，具体 endpoint 以正式文档为准。
        </p>

        <div style={{ background: C.terminal, borderRadius: 10, padding: "24px 28px", fontFamily: mono, fontSize: 13, lineHeight: 1.7, color: C.termFg, overflowX: "auto" }}>
          <div style={{ color: "#6688aa", marginBottom: 12 }}>
            <span style={{ color: "#8899aa" }}>$</span> curl <span style={{ color: C.termAc }}>https://api.moy.com/v1/chat/completions</span> \
          </div>
          <div style={{ color: "#6688aa", paddingLeft: 24 }}>
            -H <span style={{ color: "#c0a060" }}>"Authorization: Bearer $MOY_API_KEY"</span> \
          </div>
          <div style={{ color: "#6688aa", paddingLeft: 24 }}>
            -H <span style={{ color: "#c0a060" }}>"Content-Type: application/json"</span> \
          </div>
          <div style={{ color: "#6688aa", paddingLeft: 24, marginBottom: 16 }}>
            -d <span style={{ color: "#c0a060" }}>{jsonPayload}</span>
          </div>

          <div style={{ color: "#6688aa", marginBottom: 4, marginTop: 20 }}><span style={{ color: "#8899aa" }}>{"// "}</span>响应示例（OpenAI 兼容格式）</div>
          <div style={{ color: "#7da0c0" }}>{'{'}</div>
          <div style={{ color: "#7da0c0", paddingLeft: 20 }}>{'"id": "chatcmpl-xxxx",'}</div>
          <div style={{ color: "#7da0c0", paddingLeft: 20 }}>{'"object": "chat.completion",'}</div>
          <div style={{ color: "#7da0c0", paddingLeft: 20 }}>{'"model": "moy-default",'}</div>
          <div style={{ color: "#7da0c0", paddingLeft: 20 }}>{'"choices": [{"index": 0, "message": {"role": "assistant", "content": "Hello! ..."}, "finish_reason": "stop"}],'}</div>
          <div style={{ color: "#7da0c0", paddingLeft: 20 }}>{'"usage": {"prompt_tokens": 12, "completion_tokens": 24, "total_tokens": 36}'}</div>
          <div style={{ color: "#7da0c0" }}>{'}'}</div>
        </div>

        <p style={{ fontSize: 13, color: C.gray, marginTop: 14, lineHeight: 1.6 }}>
          以上为静态占位内容。正式 API 端点、可用模型列表和完整文档将在产品上线时发布。
        </p>
      </section>

      {/* ==================== 7. 安全与边界区 ==================== */}
      <section style={{ background: C.white, padding: "64px 24px" }}>
        <div style={{ ...section, maxWidth: 760, padding: "0" }}>
          <div style={{ background: C.greenBg, border: "1px solid #c8e6d0", borderRadius: 12, padding: "32px 32px 28px" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.green, marginBottom: 16 }}>
              安全与使用边界
            </h3>
            <p style={{ fontSize: 14, color: "#2a5a3a", lineHeight: 1.75, marginBottom: 20 }}>
              MOY API 致力于为开发者和企业提供安全、合规、可控的 AI 模型调用基础设施。
              我们要求所有用户遵守以下原则：
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "用户应合法使用 API，遵守所在地区法律法规。",
                "不支持违法、欺诈、垃圾内容、恶意攻击、仇恨言论等用途。",
                "企业客户可申请独立部署或专属网关，满足数据驻留和安全合规要求。",
                "数据处理规则、日志保留周期、数据跨境策略后续以正式服务协议和隐私政策为准。",
                "如发现滥用行为，MOY API 保留暂停或终止服务的权利。",
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: C.green, fontWeight: 700, fontSize: 15, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, color: "#2a5a3a", lineHeight: 1.6 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer style={{ background: C.darker, color: "#708ba8", textAlign: "center", padding: "40px 24px", fontSize: 13, lineHeight: 1.8 }}>
        <p style={{ margin: 0 }}>MOY API — 多模型 API 网关 / 开发者平台 &nbsp;|&nbsp; 桐鸣科技旗下品牌</p>
        <p style={{ margin: "6px 0 0" }}>
          <a href="https://moy.com" style={{ color: "#5ba0f5", textDecoration: "none" }}>moy.com</a>
          &nbsp;·&nbsp;
          <a href="https://app.moy.com" style={{ color: "#5ba0f5", textDecoration: "none" }}>MOY App</a>
          &nbsp;·&nbsp;
          <a href="https://geo.moy.com" style={{ color: "#5ba0f5", textDecoration: "none" }}>MOY GEO</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
