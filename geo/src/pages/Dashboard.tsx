function Dashboard() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
        GEO 工作台
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        <StatCard title="已诊断品牌" value="—" desc="MVP 阶段，诊断功能开发中" />
        <StatCard title="AI 搜索可见度" value="—" desc="暂无可见度数据" />
        <StatCard title="优化建议" value="—" desc="诊断完成后自动生成" />
        <StatCard title="覆盖平台" value="5+" desc="ChatGPT / Kimi / 豆包 / 通义 / Perplexity" />
      </div>
      <div
        style={{
          marginTop: 32,
          padding: 24,
          background: "#fff",
          borderRadius: 8,
          border: "1px solid #e8e8e8",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          MOY GEO 第一阶段 MVP
        </h2>
        <p style={{ color: "#666", lineHeight: 1.8 }}>
          MOY GEO 帮助企业在 ChatGPT、豆包、Kimi、通义千问、Perplexity、Google AI
          Overviews 等 AI 搜索/问答环境中被看见、被理解、被推荐。第一阶段以服务化交付为主，提供品牌可见度诊断报告与基础优化建议。
        </p>
        <ul style={{ color: "#666", lineHeight: 2, paddingLeft: 20 }}>
          <li>AI 搜索可见度诊断（≥5 个平台）</li>
          <li>诊断报告生成（结构化报告 / PDF）</li>
          <li>基础优化建议</li>
          <li>轻量客户管理</li>
          <li>后续：实时监控、竞品分析、自动化优化</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  desc,
}: {
  title: string;
  value: string;
  desc: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #e8e8e8",
        padding: 20,
      }}
    >
      <div style={{ color: "#999", fontSize: 13, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#1677ff", marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ color: "#999", fontSize: 12 }}>{desc}</div>
    </div>
  );
}

export default Dashboard;
