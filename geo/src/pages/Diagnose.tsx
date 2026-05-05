function Diagnose() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
        品牌诊断
      </h1>
      <div
        style={{
          padding: 40,
          background: "#fff",
          borderRadius: 8,
          border: "1px solid #e8e8e8",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          品牌 AI 搜索可见度诊断
        </h2>
        <p style={{ color: "#666", maxWidth: 500, margin: "0 auto 24px", lineHeight: 1.8 }}>
          输入品牌名称或关键词，MOY GEO 将在主流 AI 搜索平台中检索您的品牌引用情况，
          生成可见度诊断报告。MVP 阶段以人工服务化交付为主。
        </p>
        <div
          style={{
            background: "#f0f5ff",
            borderRadius: 8,
            padding: "16px 24px",
            display: "inline-block",
            textAlign: "left",
          }}
        >
          <p style={{ margin: 0, color: "#1677ff", fontWeight: 600 }}>
            MVP 阶段：诊断功能开发中
          </p>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>
            当前阶段通过工单/邮件发起诊断请求，由运营团队手动执行并交付报告。
          </p>
        </div>
      </div>
    </div>
  );
}

export default Diagnose;
