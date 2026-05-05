function Reports() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
        诊断报告
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
        <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          暂无诊断报告
        </h2>
        <p style={{ color: "#666" }}>
          完成品牌诊断后，结构化报告将在此查看。MVP 阶段报告以 PDF 形式交付。
        </p>
      </div>
    </div>
  );
}

export default Reports;
