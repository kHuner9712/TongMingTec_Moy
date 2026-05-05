import { useState, useEffect } from "react";
import { fetchPlans, GeoContentPlanBrief } from "./geoContentApi";
import { C, sans } from "../styles";

const STATUS_LABELS: Record<string, string> = { draft: "草稿", active: "进行中", completed: "已完成", archived: "已归档" };
const STATUS_COLORS: Record<string, string> = { draft: "#8a9aaa", active: "#0055cc", completed: "#0f7b3a", archived: "#a0a0a0" };

export default function ContentPlansListPage() {
  const [data, setData] = useState<GeoContentPlanBrief[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [month, setMonth] = useState("");
  const [keyword, setKeyword] = useState("");
  const [leadId, setLeadId] = useState("");
  const [brandAssetId, setBrandAssetId] = useState("");
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const load = (p: number) => {
    setLoading(true);
    const params: any = { page: p, pageSize };
    if (status) params.status = status;
    if (month) params.month = month;
    if (keyword) params.keyword = keyword;
    if (leadId) params.leadId = leadId;
    if (brandAssetId) params.brandAssetId = brandAssetId;
    fetchPlans(params).then((r) => { setData(r.data); setTotal(r.pagination.total); setPage(p); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("leadId")) setLeadId(p.get("leadId")!);
    if (p.get("brandAssetId")) setBrandAssetId(p.get("brandAssetId")!);
  }, []);
  useEffect(() => { load(1); }, []);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ fontFamily: sans, color: C.dark, background: C.bg, minHeight: "100vh" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #e8ecf1", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ fontWeight: 800, fontSize: 18, color: C.dark, textDecoration: "none" }}>MOY<span style={{ color: C.blue }}>GEO</span></a>
          <span style={{ fontSize: 13, color: "#8a9aaa" }}>/</span>
          <a href="/admin/leads" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>Leads</a>
          <span style={{ fontSize: 13, color: "#8a9aaa", fontFamily: "monospace" }}>Content Plans</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/admin/content-plans/new" style={newBtn}>新建计划</a>
          <a href="/" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600, lineHeight: "32px" }}>← 返回官网</a>
        </div>
      </nav>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>内容计划列表</h1>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={s}><option value="">全部状态</option>{Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <input value={month} onChange={(e) => setMonth(e.target.value)} placeholder="月份 2026-05" style={{ ...i, width: 120 }} />
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索..." style={i} onKeyDown={(e) => e.key === "Enter" && load(1)} />
          <button onClick={() => load(1)} style={btn}>搜索</button>
        </div>
        {loading && <div style={{ textAlign: "center", padding: 40, color: "#8a9aaa" }}>加载中...</div>}
        {!loading && data.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#8a9aaa", border: "1px dashed #d0d7de", borderRadius: 10 }}>暂无计划，<a href="/admin/content-plans/new" style={{ color: C.blue }}>新建计划</a></div>}
        {!loading && data.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "2px solid #e8ecf1", textAlign: "left" }}><th style={th}>标题</th><th style={th}>月份</th><th style={th}>目标</th><th style={th}>选题数</th><th style={th}>状态</th><th style={th}>创建</th><th style={th}>操作</th></tr></thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                  <td style={td}>{p.title}</td><td style={td}>{p.month || "-"}</td><td style={td}>{p.goal || "-"}</td>
                  <td style={td}>{p.topics?.length || 0}</td>
                  <td style={td}><span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: STATUS_COLORS[p.status] + "18", color: STATUS_COLORS[p.status] }}>{STATUS_LABELS[p.status] || p.status}</span></td>
                  <td style={td}>{new Date(p.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td style={td}><a href={`/admin/content-plans/new?planId=${p.id}`} style={{ color: C.blue, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>编辑</a> <a href={`/admin/content-drafts/new?planId=${p.id}&leadId=${leadId || ""}`} style={{ color: "#7c3aed", fontSize: 13, fontWeight: 600, textDecoration: "none", marginLeft: 8 }}>建稿件</a> <a href={`/admin/content-drafts?planId=${p.id}`} style={{ color: "#5a6a7e", fontSize: 12, textDecoration: "none", marginLeft: 4 }}>稿件</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "center" }}><button disabled={page <= 1} onClick={() => load(page - 1)} style={pBtn}>上一页</button><span style={{ fontSize: 13, color: "#8a9aaa", lineHeight: "32px" }}>{page} / {totalPages}（共 {total} 条）</span><button disabled={page >= totalPages} onClick={() => load(page + 1)} style={pBtn}>下一页</button></div>}
      </div>
    </div>
  );
}

const s: React.CSSProperties = { padding: "7px 10px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13, background: "#fff" };
const i: React.CSSProperties = { padding: "7px 10px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13, flex: 1, minWidth: 150 };
const btn: React.CSSProperties = { padding: "7px 18px", background: "#0055cc", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const newBtn: React.CSSProperties = { fontSize: 13, color: "#fff", textDecoration: "none", fontWeight: 600, background: "#0055cc", padding: "6px 14px", borderRadius: 6 };
const th: React.CSSProperties = { padding: "10px 10px", fontSize: 12, fontWeight: 600, color: "#5a6a7e" };
const td: React.CSSProperties = { padding: "10px 10px", fontSize: 13 };
const pBtn: React.CSSProperties = { padding: "6px 14px", border: "1px solid #d0d7de", borderRadius: 6, background: "#fff", fontSize: 13, cursor: "pointer" };
