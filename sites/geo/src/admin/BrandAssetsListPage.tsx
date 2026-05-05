import { useState, useEffect } from "react";
import { fetchBrandAssets, GeoBrandAssetBrief, QueryBrandAssetsParams } from "./brand-assets/geoBrandAssetsApi";
import { C, sans } from "../styles";

const STATUS_LABELS: Record<string, string> = {
  draft: "草稿", ready: "就绪", reviewed: "已审核", delivered: "已交付", archived: "已归档",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "#8a9aaa", ready: "#0055cc", reviewed: "#7c3aed", delivered: "#0f7b3a", archived: "#a0a0a0",
};
const ALL_STATUSES = ["", "draft", "ready", "reviewed", "delivered", "archived"];

export default function BrandAssetsListPage() {
  const [data, setData] = useState<GeoBrandAssetBrief[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [leadId, setLeadIdState] = useState("");
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const load = (p: number) => {
    setLoading(true);
    const params: QueryBrandAssetsParams = { page: p, pageSize };
    if (status) params.status = status;
    if (keyword) params.keyword = keyword;
    if (leadId) params.leadId = leadId;

    fetchBrandAssets(params)
      .then((res) => {
        setData(res.data);
        setTotal(res.pagination.total);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lid = params.get("leadId");
    if (lid) setLeadIdState(lid);
  }, []);

  useEffect(() => { load(1); }, []);

  const handleSearch = () => load(1);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ fontFamily: sans, color: C.dark, background: C.bg, minHeight: "100vh" }}>
      <nav style={{
        background: "#fff", borderBottom: "1px solid #e8ecf1", padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 56,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ fontWeight: 800, fontSize: 18, color: C.dark, textDecoration: "none" }}>
            MOY<span style={{ color: C.blue }}>GEO</span>
          </a>
          <span style={{ fontSize: 13, color: "#8a9aaa" }}>/</span>
          <a href="/admin/leads" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>Leads</a>
          <span style={{ fontSize: 13, color: "#8a9aaa", fontFamily: "monospace" }}>Brand Assets</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/admin/brand-assets/new" style={{ fontSize: 13, color: "#fff", textDecoration: "none", fontWeight: 600, background: "#0055cc", padding: "6px 14px", borderRadius: 6 }}>新建资产包</a>
          <a href="/" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>← 返回官网</a>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>品牌事实资产包列表</h1>

        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={filterSelect}>
            <option value="">全部状态</option>
            {ALL_STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索公司/品牌/网站..." style={filterInput}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          <input value={leadId} onChange={(e) => setLeadIdState(e.target.value)} placeholder="Lead ID（可选）" style={{ ...filterInput, width: 200 }} />
          <button onClick={handleSearch} style={searchBtn}>搜索</button>
        </div>

        {loading && <div style={{ textAlign: "center", padding: 40, color: "#8a9aaa" }}>加载中...</div>}

        {!loading && data.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#8a9aaa", border: "1px dashed #d0d7de", borderRadius: 10 }}>
            暂无资产包，<a href="/admin/brand-assets/new" style={{ color: C.blue }}>新建资产包</a>
          </div>
        )}

        {!loading && data.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e8ecf1", textAlign: "left" }}>
                <th style={th}>品牌</th>
                <th style={th}>公司</th>
                <th style={th}>官网</th>
                <th style={th}>行业</th>
                <th style={th}>状态</th>
                <th style={th}>创建日期</th>
                <th style={th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                  <td style={td}>{a.brandName || "-"}</td>
                  <td style={td}>{a.companyName || "-"}</td>
                  <td style={td}><a href={a.website || "#"} target="_blank" rel="noopener" style={{ color: C.blue, fontSize: 13 }}>{a.website}</a></td>
                  <td style={td}>{a.industry || "-"}</td>
                  <td style={td}>
                    <span style={{ padding: "2px 10px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: STATUS_COLORS[a.status] + "18", color: STATUS_COLORS[a.status] }}>
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </td>
                  <td style={td}>{new Date(a.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td style={td}>
                    <a href={`/admin/brand-assets/new?assetId=${a.id}`} style={{ color: C.blue, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>编辑</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "center" }}>
            <button disabled={page <= 1} onClick={() => load(page - 1)} style={pageBtn}>上一页</button>
            <span style={{ fontSize: 13, color: "#8a9aaa", lineHeight: "32px" }}>{page} / {totalPages}（共 {total} 条）</span>
            <button disabled={page >= totalPages} onClick={() => load(page + 1)} style={pageBtn}>下一页</button>
          </div>
        )}
      </div>
    </div>
  );
}

const filterSelect: React.CSSProperties = { padding: "8px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14, background: "#fff" };
const filterInput: React.CSSProperties = { padding: "8px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14, flex: 1, minWidth: 200 };
const searchBtn: React.CSSProperties = { padding: "8px 20px", background: "#0055cc", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" };
const th: React.CSSProperties = { padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#5a6a7e", textTransform: "uppercase" as const };
const td: React.CSSProperties = { padding: "12px 12px", fontSize: 13 };
const pageBtn: React.CSSProperties = { padding: "6px 14px", border: "1px solid #d0d7de", borderRadius: 6, background: "#fff", fontSize: 13, cursor: "pointer" };
