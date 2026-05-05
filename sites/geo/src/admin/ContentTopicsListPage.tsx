import { useState, useEffect } from "react";
import { fetchTopics, GeoContentTopicBrief, archiveTopic, updateTopicStatus } from "./geoContentApi";
import { C, sans } from "../styles";

const STATUS_LABELS: Record<string, string> = {
  idea: "想法", planned: "已规划", drafting: "起草中", reviewing: "审核中",
  approved: "已批准", published: "已发布", archived: "已归档",
};
const STATUS_COLORS: Record<string, string> = {
  idea: "#a0a0a0", planned: "#8a6fdf", drafting: "#f59e0b", reviewing: "#ef4444",
  approved: "#0ea5e9", published: "#0f7b3a", archived: "#a0a0a0",
};
const PRIORITY_LABELS: Record<string, string> = { high: "高", medium: "中", low: "低" };
const PRIORITY_COLORS: Record<string, string> = { high: "#dc3545", medium: "#ffc107", low: "#6c757d" };
const CT_LABELS: Record<string, string> = {
  industry_question: "行业问答", local_service: "本地服务", competitor_comparison: "竞品对比",
  buying_guide: "购买决策", misconception: "常见误区", case_study: "案例拆解",
  pricing_explainer: "价格解释", process_explainer: "服务流程", brand_intro: "品牌介绍", faq: "FAQ",
};

export default function ContentTopicsListPage() {
  const [data, setData] = useState<GeoContentTopicBrief[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [contentType, setContentType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [leadId, setLeadId] = useState("");
  const [brandAssetId, setBrandAssetId] = useState("");
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const load = (p: number) => {
    setLoading(true);
    const params: any = { page: p, pageSize };
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (contentType) params.contentType = contentType;
    if (keyword) params.keyword = keyword;
    if (leadId) params.leadId = leadId;
    if (brandAssetId) params.brandAssetId = brandAssetId;
    fetchTopics(params).then((r) => { setData(r.data); setTotal(r.pagination.total); setPage(p); }).catch(() => {}).finally(() => setLoading(false));
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
          <span style={{ fontSize: 13, color: "#8a9aaa", fontFamily: "monospace" }}>Content Topics</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/admin/content-topics/new" style={newBtn}>新建选题</a>
          <a href="/" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600, lineHeight: "32px" }}>← 返回官网</a>
        </div>
      </nav>
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>内容选题列表</h1>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={s}>
            <option value="">全部状态</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} style={s}>
            <option value="">全部优先级</option>
            <option value="high">高</option><option value="medium">中</option><option value="low">低</option>
          </select>
          <select value={contentType} onChange={(e) => setContentType(e.target.value)} style={s}>
            <option value="">全部类型</option>
            {Object.entries(CT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索..." style={i} onKeyDown={(e) => e.key === "Enter" && load(1)} />
          <button onClick={() => load(1)} style={btn}>搜索</button>
        </div>
        {loading && <div style={{ textAlign: "center", padding: 40, color: "#8a9aaa" }}>加载中...</div>}
        {!loading && data.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#8a9aaa", border: "1px dashed #d0d7de", borderRadius: 10 }}>暂无选题，<a href="/admin/content-topics/new" style={{ color: C.blue }}>新建选题</a></div>}
        {!loading && data.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e8ecf1", textAlign: "left" }}>
                <th style={th}>标题</th><th style={th}>类型</th><th style={th}>关键词</th><th style={th}>优先级</th><th style={th}>状态</th><th style={th}>计划发布</th><th style={th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                  <td style={td}>{t.title}</td>
                  <td style={td}>{CT_LABELS[t.contentType] || t.contentType}</td>
                  <td style={td}>{t.targetKeyword || "-"}</td>
                  <td style={td}><span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: PRIORITY_COLORS[t.priority] + "22", color: PRIORITY_COLORS[t.priority] }}>{PRIORITY_LABELS[t.priority]}</span></td>
                  <td style={td}><span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: STATUS_COLORS[t.status] + "18", color: STATUS_COLORS[t.status] }}>{STATUS_LABELS[t.status] || t.status}</span></td>
                  <td style={td}>{t.plannedPublishDate || "-"}</td>
                  <td style={td}><a href={`/admin/content-topics/new?topicId=${t.id}`} style={{ color: C.blue, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>编辑</a> <a href={`/admin/content-drafts/new?topicId=${t.id}&leadId=${leadId}`} style={{ color: "#7c3aed", fontSize: 13, fontWeight: 600, textDecoration: "none", marginLeft: 8 }}>建稿件</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "center" }}>
            <button disabled={page <= 1} onClick={() => load(page - 1)} style={pBtn}>上一页</button>
            <span style={{ fontSize: 13, color: "#8a9aaa", lineHeight: "32px" }}>{page} / {totalPages}（共 {total} 条）</span>
            <button disabled={page >= totalPages} onClick={() => load(page + 1)} style={pBtn}>下一页</button>
          </div>
        )}
      </div>
    </div>
  );
}

const s: React.CSSProperties = { padding: "7px 10px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13, background: "#fff" };
const i: React.CSSProperties = { padding: "7px 10px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13, flex: 1, minWidth: 150 };
const btn: React.CSSProperties = { padding: "7px 18px", background: "#0055cc", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const newBtn: React.CSSProperties = { fontSize: 13, color: "#fff", textDecoration: "none", fontWeight: 600, background: "#0055cc", padding: "6px 14px", borderRadius: 6 };
const th: React.CSSProperties = { padding: "10px 10px", fontSize: 12, fontWeight: 600, color: "#5a6a7e", textTransform: "uppercase" };
const td: React.CSSProperties = { padding: "10px 10px", fontSize: 13 };
const pBtn: React.CSSProperties = { padding: "6px 14px", border: "1px solid #d0d7de", borderRadius: 6, background: "#fff", fontSize: 13, cursor: "pointer" };
