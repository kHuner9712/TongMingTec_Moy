import { useState, useEffect } from "react";
import { fetchContentDrafts, GeoContentDraftBrief, archiveContentDraft, updateContentDraftStatus } from "./geoContentDraftsApi";
import { C, sans } from "../styles";

const STATUS_LABELS: Record<string, string> = {
  draft: "草稿", reviewing: "审核中", approved: "已通过", published: "已发布", archived: "已归档",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "#8a9aaa", reviewing: "#ef4444", approved: "#0ea5e9", published: "#0f7b3a", archived: "#a0a0a0",
};
const CT_LABELS: Record<string, string> = {
  industry_question: "行业问答", local_service: "本地服务", competitor_comparison: "竞品对比",
  buying_guide: "购买决策", misconception: "常见误区", case_study: "案例拆解",
  pricing_explainer: "价格解释", process_explainer: "服务流程", brand_intro: "品牌介绍", faq: "FAQ",
};

export default function ContentDraftsListPage() {
  const [data, setData] = useState<GeoContentDraftBrief[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [contentType, setContentType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [leadId, setLeadId] = useState("");
  const [brandAssetId, setBrandAssetId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [planId, setPlanId] = useState("");
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const load = (p: number) => {
    setLoading(true);
    const params: any = { page: p, pageSize };
    if (status) params.status = status;
    if (contentType) params.contentType = contentType;
    if (keyword) params.keyword = keyword;
    if (leadId) params.leadId = leadId;
    if (brandAssetId) params.brandAssetId = brandAssetId;
    if (topicId) params.topicId = topicId;
    if (planId) params.planId = planId;
    fetchContentDrafts(params).then((r) => { setData(r.data); setTotal(r.pagination.total); setPage(p); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("leadId")) setLeadId(sp.get("leadId")!);
    if (sp.get("brandAssetId")) setBrandAssetId(sp.get("brandAssetId")!);
    if (sp.get("topicId")) setTopicId(sp.get("topicId")!);
    if (sp.get("planId")) setPlanId(sp.get("planId")!);
    load(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ padding: "2rem", maxWidth: 1320, margin: "0 auto", fontFamily: sans }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, marginBottom: 4 }}>内容稿件管理</h1>
      <p style={{ color: C.gray, margin: "0 0 24px", fontSize: 14 }}>管理 GEO 内容稿件的创建、编辑、审核与发布状态</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); setTimeout(() => load(1), 0); }} style={{ padding: "8px 12px", border: `1px solid ${C.grayLight}`, borderRadius: 6, fontSize: 13, background: "#fff" }}>
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="reviewing">审核中</option>
          <option value="approved">已通过</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>
        <select value={contentType} onChange={(e) => { setContentType(e.target.value); setPage(1); setTimeout(() => load(1), 0); }} style={{ padding: "8px 12px", border: `1px solid ${C.grayLight}`, borderRadius: 6, fontSize: 13, background: "#fff" }}>
          <option value="">全部类型</option>
          {Object.entries(CT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input placeholder="关键词搜索标题/关键词/正文..." value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); load(1); } }} style={{ padding: "8px 12px", border: `1px solid ${C.grayLight}`, borderRadius: 6, fontSize: 13, width: 260 }} />
        <input placeholder="Lead ID" value={leadId} onChange={(e) => { setLeadId(e.target.value); setPage(1); }} onKeyDown={(e) => { if (e.key === "Enter") { load(1); } }} style={{ padding: "8px 12px", border: `1px solid ${C.grayLight}`, borderRadius: 6, fontSize: 13, width: 120 }} />
        <input placeholder="Topic ID" value={topicId} onChange={(e) => { setTopicId(e.target.value); setPage(1); }} onKeyDown={(e) => { if (e.key === "Enter") { load(1); } }} style={{ padding: "8px 12px", border: `1px solid ${C.grayLight}`, borderRadius: 6, fontSize: 13, width: 120 }} />
        <button onClick={() => { setPage(1); load(1); }} style={{ padding: "8px 16px", background: C.dark, color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>搜索</button>
        <button onClick={() => { window.location.href = "/admin/content-drafts/new"; }} style={{ padding: "8px 16px", background: "#0055cc", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", marginLeft: "auto" }}>+ 新建稿件</button>
      </div>

      {loading && <p style={{ color: C.gray, fontSize: 13 }}>加载中...</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${C.grayLight}`, textAlign: "left", color: C.gray, fontSize: 12, textTransform: "uppercase" }}>
            <th style={{ padding: "8px 12px" }}>标题</th>
            <th style={{ padding: "8px 12px" }}>类型</th>
            <th style={{ padding: "8px 12px" }}>目标关键词</th>
            <th style={{ padding: "8px 12px" }}>平台</th>
            <th style={{ padding: "8px 12px" }}>状态</th>
            <th style={{ padding: "8px 12px" }}>计划发布</th>
            <th style={{ padding: "8px 12px" }}>已发布 URL</th>
            <th style={{ padding: "8px 12px" }}>创建时间</th>
            <th style={{ padding: "8px 12px" }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.id} style={{ borderBottom: `1px solid ${C.grayLight}`, verticalAlign: "top" }}>
              <td style={{ padding: "8px 12px", fontWeight: 600, color: C.dark }}>{d.title || "（无标题）"}</td>
              <td style={{ padding: "8px 12px", color: C.gray }}>{d.contentType ? (CT_LABELS[d.contentType] || d.contentType) : "-"}</td>
              <td style={{ padding: "8px 12px", color: C.gray }}>{d.targetKeyword || "-"}</td>
              <td style={{ padding: "8px 12px", color: C.gray }}>{d.platform || "-"}</td>
              <td style={{ padding: "8px 12px" }}>
                <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, color: "#fff", background: STATUS_COLORS[d.status] || "#a0a0a0" }}>
                  {STATUS_LABELS[d.status] || d.status}
                </span>
              </td>
              <td style={{ padding: "8px 12px", color: C.gray }}>{d.plannedPublishDate || "-"}</td>
              <td style={{ padding: "8px 12px", color: C.gray, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.publishedUrl ? <a href={d.publishedUrl} target="_blank" style={{ color: "#0055cc" }}>{d.publishedUrl}</a> : "-"}</td>
              <td style={{ padding: "8px 12px", color: C.gray }}>{new Date(d.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
              <td style={{ padding: "8px 12px" }}>
                <a href={`/admin/content-drafts/new?draftId=${d.id}`} style={{ color: "#0055cc", fontSize: 12, marginRight: 10, textDecoration: "none" }}>编辑</a>
                {d.status !== "archived" && (
                  <span style={{ color: "#cc0000", fontSize: 12, cursor: "pointer" }} onClick={() => { if (confirm("确定归档？")) { archiveContentDraft(d.id).then(() => load(page)).catch(() => {}); } }}>归档</span>
                )}
              </td>
            </tr>
          ))}
          {data.length === 0 && !loading && (
            <tr><td colSpan={9} style={{ padding: "2rem", textAlign: "center", color: C.gray }}>暂无稿件，<a href="/admin/content-drafts/new" style={{ color: "#0055cc" }}>创建第一篇</a></td></tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 8 }}>
          <button disabled={page <= 1} onClick={() => load(page - 1)} style={{ padding: "6px 12px", border: `1px solid ${C.grayLight}`, borderRadius: 4, background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}>上一页</button>
          <span style={{ padding: "6px 12px", fontSize: 13, color: C.gray }}>第 {page}/{totalPages} 页（共 {total} 条）</span>
          <button disabled={page >= totalPages} onClick={() => load(page + 1)} style={{ padding: "6px 12px", border: `1px solid ${C.grayLight}`, borderRadius: 4, background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1 }}>下一页</button>
        </div>
      )}
    </div>
  );
}
