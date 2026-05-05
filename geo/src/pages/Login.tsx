function Login() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          border: "1px solid #e8e8e8",
          padding: 40,
          width: 360,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1677ff", marginBottom: 24 }}>
          MOY GEO
        </h1>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 32 }}>
          AI 搜索增长与品牌可见度服务
        </p>
        <div
          style={{
            padding: "12px 20px",
            background: "#f0f5ff",
            borderRadius: 6,
            color: "#1677ff",
            fontSize: 13,
          }}
        >
          MVP 阶段：独立认证体系开发中。当前使用简易登录。
        </div>
      </div>
    </div>
  );
}

export default Login;
