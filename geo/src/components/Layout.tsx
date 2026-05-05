import { Outlet, Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/dashboard", label: "工作台" },
  { path: "/diagnose", label: "品牌诊断" },
  { path: "/reports", label: "诊断报告" },
];

function Layout() {
  const location = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e8e8e8",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          height: 56,
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: "#1677ff", textDecoration: "none" }}>
            MOY GEO
          </Link>
          <nav style={{ display: "flex", gap: 8 }}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  padding: "6px 16px",
                  borderRadius: 6,
                  color: location.pathname.startsWith(item.path) ? "#1677ff" : "#333",
                  background: location.pathname.startsWith(item.path) ? "#e6f4ff" : "transparent",
                  textDecoration: "none",
                  fontWeight: location.pathname.startsWith(item.path) ? 600 : 400,
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <span style={{ color: "#999", fontSize: 13 }}>MOY GEO v0.1.0 MVP</span>
      </header>
      <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        <Outlet />
      </main>
      <footer
        style={{
          textAlign: "center",
          padding: "16px 0",
          color: "#999",
          fontSize: 12,
        }}
      >
        MOY GEO — AI 搜索增长与品牌可见度服务 &nbsp;|&nbsp; Powered by{" "}
        <a href="https://moy.com" style={{ color: "#1677ff" }}>
          MOY
        </a>
      </footer>
    </div>
  );
}

export default Layout;
