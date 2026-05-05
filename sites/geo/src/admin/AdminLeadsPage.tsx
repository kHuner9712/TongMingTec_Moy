import { useState, useEffect, useCallback } from "react";
import { GeoLead, STATUS_LABELS } from "./adminTypes";
import { fetchLeads, getToken } from "./geoAdminApi";
import AdminTokenPanel from "./components/AdminTokenPanel";
import LeadFilters from "./components/LeadFilters";
import LeadTable from "./components/LeadTable";
import LeadDetailPanel from "./components/LeadDetailPanel";
import { C, sans } from "../styles";

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<GeoLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initialCheck, setInitialCheck] = useState(true);

  const load = useCallback(async (p?: number, ps?: number) => {
    const currentPage = p ?? page;
    const currentPageSize = ps ?? pageSize;

    if (!getToken()) {
      setError("请先输入管理员访问令牌");
      setLoading(false);
      setInitialCheck(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await fetchLeads({ status: status || undefined, keyword: keyword || undefined, page: currentPage, pageSize: currentPageSize });
      setLeads(result.data);
      setTotal(result.pagination.total);
    } catch (err: any) {
      if (err.status === 401) {
        setError("Token 无效或已过期，请重新输入");
      } else {
        setError(err.message || "加载失败");
      }
    } finally {
      setLoading(false);
      setInitialCheck(false);
    }
  }, [status, keyword, page, pageSize]);

  useEffect(() => {
    load();
  }, []);

  const handleSearch = () => {
    setPage(1);
    load(1, pageSize);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ fontFamily: sans, color: C.dark, background: C.bg, minHeight: "100vh" }}>
      <nav style={{
        background: "#fff", borderBottom: "1px solid #e8ecf1", padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 56,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/" style={{ fontWeight: 800, fontSize: 18, color: C.dark, textDecoration: "none" }}>
            MOY<span style={{ color: C.blue }}>GEO</span>
          </a>
          <span style={{ fontSize: 13, color: "#8a9aaa", fontFamily: "monospace" }}>Admin</span>
        </div>
        <a href="/" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>← 返回官网</a>
      </nav>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>GEO 线索管理</h1>

        <AdminTokenPanel />

        {error && (
          <div style={{ marginBottom: 16, padding: 12, background: "#ffebee", borderRadius: 6, color: "#c62828", fontSize: 13 }}>
            {error}
          </div>
        )}

        <LeadFilters
          status={status}
          keyword={keyword}
          onStatusChange={setStatus}
          onKeywordChange={(v) => { setKeyword(v); setPage(1); }}
          onRefresh={handleSearch}
        />

        <LeadTable
          leads={leads}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loading && initialCheck}
        />

        {total > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, fontSize: 13, flexWrap: "wrap", gap: 12 }}>
            <div style={{ color: "#5a6a7e" }}>
              共 {total} 条，第 {page}/{totalPages || 1} 页
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p); }} style={pageBtn}>
                上一页
              </button>
              <button disabled={page >= totalPages} onClick={() => { const p = page + 1; setPage(p); load(p); }} style={pageBtn}>
                下一页
              </button>
              <select
                value={pageSize}
                onChange={(e) => { const ps = Number(e.target.value); setPageSize(ps); setPage(1); load(1, ps); }}
                style={{ marginLeft: 8, padding: "4px 8px", border: "1px solid #d0d7de", borderRadius: 4, fontSize: 13 }}
              >
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>每页 {n} 条</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <LeadDetailPanel
        leadId={selectedId}
        onClose={() => setSelectedId(null)}
        onUpdated={() => load()}
      />
    </div>
  );
}

const pageBtn: React.CSSProperties = {
  padding: "4px 12px", border: "1px solid #d0d7de", borderRadius: 4, background: "#fff",
  fontSize: 13, cursor: "pointer",
};
