import { useState, useEffect } from "react";
import { createContentDraft, updateContentDraft, fetchContentDraftById } from "./geoContentDraftsApi";
import { fetchTopicById } from "./geoContentApi";
import { C, sans } from "../styles";
import { getToken } from "./geoAdminApi";
import { generateDraftMarkdown } from "./content-drafts/contentDraftMarkdown";

const DRAFT_KEY = "moy_geo_content_draft_draft";

const CT_OPTIONS = [
  { v: "industry_question", l: "行业问答" }, { v: "local_service", l: "本地服务" },
  { v: "competitor_comparison", l: "竞品对比" }, { v: "buying_guide", l: "购买决策" },
  { v: "misconception", l: "常见误区" }, { v: "case_study", l: "案例拆解" },
  { v: "pricing_explainer", l: "价格解释" }, { v: "process_explainer", l: "服务流程" },
  { v: "brand_intro", l: "品牌介绍" }, { v: "faq", l: "FAQ" },
];

const COMPLIANCE_ITEMS = [
  "内容基于客户真实资料",
  "未使用未授权客户案例",
  "未伪造媒体报道",
  "未承诺固定排名或百分百推荐",
  "未夸大服务效果",
  "已标注需要客户确认的信息",
  "适合对外发布",
];

function emptyForm() {
  return {
    title: "", slug: "", contentType: "industry_question" as string, targetKeyword: "",
    targetQuestion: "", targetAudience: "", platform: "", status: "draft" as string,
    summary: "", outline: "", body: "",
    seoTitle: "", metaDescription: "", tags: [] as string[],
    complianceChecklist: [] as string[],
    reviewNotes: "", plannedPublishDate: "", actualPublishDate: "", publishedUrl: "",
  };
}

export default function ContentDraftEditorPage() {
  const [f, setF] = useState(emptyForm());
  const [draftId, setDraftId] = useState<string | null>(null);
  const [leadId, setLid] = useState<string | null>(null);
  const [brandAssetId, setBid] = useState<string | null>(null);
  const [reportId, setRid] = useState<string | null>(null);
  const [topicId, setTid] = useState<string | null>(null);
  const [planId, setPid] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const did = sp.get("draftId");
    if (sp.get("leadId")) setLid(sp.get("leadId"));
    if (sp.get("brandAssetId")) setBid(sp.get("brandAssetId"));
    if (sp.get("reportId")) setRid(sp.get("reportId"));
    if (sp.get("topicId")) setTid(sp.get("topicId"));
    if (sp.get("planId")) setPid(sp.get("planId"));
    setDraftId(did);

    if (did) {
      document.title = "编辑稿件 · MOY GEO";
      setLoading(true);
      fetchContentDraftById(did).then((r) => {
        setF({
          title: r.title || "", slug: r.slug || "", contentType: r.contentType || "industry_question",
          targetKeyword: r.targetKeyword || "", targetQuestion: r.targetQuestion || "",
          targetAudience: r.targetAudience || "", platform: r.platform || "",
          status: r.status || "draft", summary: r.summary || "", outline: r.outline || "",
          body: r.body || "", seoTitle: r.seoTitle || "", metaDescription: r.metaDescription || "",
          tags: r.tags || [], complianceChecklist: r.complianceChecklist || [],
          reviewNotes: r.reviewNotes || "",
          plannedPublishDate: r.plannedPublishDate || "", actualPublishDate: r.actualPublishDate || "",
          publishedUrl: r.publishedUrl || "",
        });
        setTagsInput((r.tags || []).join(", "));
        if (r.leadId) setLid(r.leadId);
        if (r.brandAssetId) setBid(r.brandAssetId);
        if (r.reportId) setRid(r.reportId);
        if (r.topicId) setTid(r.topicId);
        if (r.planId) setPid(r.planId);
      }).catch(() => setMsg("无法加载稿件")).finally(() => setLoading(false));
    } else {
      const tid = sp.get("topicId");
      if (tid) {
        setLoading(true);
        fetchTopicById(tid).then((r) => {
          setF((prev) => ({
            ...prev,
            title: r.title || prev.title,
            contentType: r.contentType || prev.contentType,
            targetKeyword: r.targetKeyword || prev.targetKeyword,
            targetQuestion: r.targetQuestion || prev.targetQuestion,
            targetAudience: r.targetAudience || prev.targetAudience,
            outline: r.outline || prev.outline,
            plannedPublishDate: r.plannedPublishDate || prev.plannedPublishDate,
          }));
          setMsg("已从选题带入基本信息");
        }).catch(() => setMsg("无法从选题带入信息")).finally(() => setLoading(false));
      }
    }
  }, []);

  const buildPayload = () => {
    const tags = tagsInput.split(/[,，\n]+/).map((s) => s.trim()).filter(Boolean);
    return {
      ...f, tags,
      leadId: leadId || undefined, brandAssetId: brandAssetId || undefined,
      reportId: reportId || undefined, topicId: topicId || undefined, planId: planId || undefined,
    };
  };

  const handleSave = async () => {
    setLoading(true);
    setMsg("");
    try {
      const payload = buildPayload();
      let result;
      if (draftId) {
        result = await updateContentDraft(draftId, payload);
        setMsg("保存成功");
      } else {
        result = await createContentDraft(payload);
        setDraftId(result.id);
        setMsg("创建成功");
        const url = new URL(window.location.href);
        url.searchParams.set("draftId", result.id);
        window.history.replaceState({}, "", url.toString());
      }
      if (result.id) {
        setLid(result.leadId);
        setBid(result.brandAssetId);
        setRid(result.reportId);
        setTid(result.topicId);
        setPid(result.planId);
      }
    } catch (e: any) { setMsg(e.message || "保存失败"); }
    finally { setLoading(false); }
  };

  const handleSaveAsNew = async () => {
    setLoading(true);
    setMsg("");
    try {
      const payload = buildPayload();
      delete payload.leadId;
      const result = await createContentDraft(payload as any);
      setDraftId(result.id);
      setMsg("已另存为新稿件");
      const url = new URL(window.location.href);
      url.searchParams.set("draftId", result.id);
      window.history.replaceState({}, "", url.toString());
    } catch (e: any) { setMsg(e.message || "保存失败"); }
    finally { setLoading(false); }
  };

  const handleSaveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...buildPayload(), savedAt: new Date().toISOString() }));
    setMsg("草稿已保存到浏览器");
  };

  const handleRestoreDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) { setMsg("没有已保存的草稿"); return; }
    try {
      const saved = JSON.parse(raw);
      const restored = emptyForm();
      for (const k of Object.keys(restored)) {
        if (saved[k] !== undefined) (restored as any)[k] = saved[k];
      }
      setF(restored);
      setTagsInput((restored.tags || []).join(", "));
      setMsg("草稿已恢复");
    } catch { setMsg("草稿格式错误"); }
  };

  const handleClear = () => {
    if (!confirm("确定清空所有字段？")) return;
    setF(emptyForm());
    setTagsInput("");
    setDraftId(null);
  };

  const handleGenerateMd = () => {
    const md = generateDraftMarkdown({ ...f, tags: tagsInput.split(/[,，\n]+/).map((s) => s.trim()).filter(Boolean) });
    navigator.clipboard.writeText(md).then(() => setMsg("Markdown 已复制到剪贴板")).catch(() => setMsg("复制失败"));
    handleSaveDraft();
  };

  const handleDownloadMd = () => {
    const md = generateDraftMarkdown({ ...f, tags: tagsInput.split(/[,，\n]+/).map((s) => s.trim()).filter(Boolean) });
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${f.title || "稿件"}_GEO内容稿件.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg("已下载 .md 文件");
  };

  const set = (key: string, val: string | string[]) => setF((prev) => ({ ...prev, [key]: val }));
  const toggleCompliance = (item: string) => {
    setF((prev) => {
      const list = prev.complianceChecklist.includes(item)
        ? prev.complianceChecklist.filter((i) => i !== item)
        : [...prev.complianceChecklist, item];
      return { ...prev, complianceChecklist: list };
    });
  };

  const showQuickLinks = !!(draftId || topicId || leadId);

  const inputS = { padding: "8px 12px", border: `1px solid ${C.grayLight}`, borderRadius: 6, fontSize: 13, width: "100%", boxSizing: "border-box" as any };
  const textareaS = { ...inputS, minHeight: 80, resize: "vertical" as any };
  const labelS = { fontSize: 12, fontWeight: 600, color: C.gray, marginBottom: 4, display: "block" as any };

  if (loading) {
    return <div style={{ padding: "4rem", textAlign: "center", fontFamily: sans, color: C.gray }}>加载中...</div>;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 960, margin: "0 auto", fontFamily: sans }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, marginBottom: 4 }}>{draftId ? "编辑稿件" : "新建内容稿件"}</h1>
      <p style={{ color: C.gray, margin: "0 0 24px", fontSize: 14 }}>基于内容选题生成、编辑、保存 GEO 内容稿件</p>

      {msg && <div style={{ padding: "8px 12px", borderRadius: 6, marginBottom: 16, fontSize: 13, background: msg.includes("成功") || msg.includes("已") ? "#e6f7e6" : "#fff3cd", color: C.dark }}>{msg}</div>}

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={handleSave} disabled={loading} style={{ padding: "10px 20px", background: C.dark, color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>{draftId ? "保存修改" : "创建稿件"}</button>
        {draftId && <button onClick={handleSaveAsNew} disabled={loading} style={{ padding: "10px 20px", background: "#0055cc", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>另存为新稿件</button>}
        <button onClick={handleSaveDraft} style={{ padding: "10px 20px", background: C.grayLight, color: C.dark, border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>保存本地草稿</button>
        <button onClick={handleRestoreDraft} style={{ padding: "10px 20px", background: C.grayLight, color: C.dark, border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>恢复草稿</button>
        <button onClick={handleGenerateMd} style={{ padding: "10px 20px", background: "#0f7b3a", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>生成 Markdown</button>
        <button onClick={handleDownloadMd} style={{ padding: "10px 20px", background: "#6f42c1", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>下载 .md</button>
        <button onClick={handleClear} style={{ padding: "10px 20px", background: "#dc3545", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", marginLeft: "auto" }}>清空</button>
      </div>

      {showQuickLinks && (
        <div style={{ marginBottom: 24, padding: "12px 16px", background: "#f0f4ff", borderRadius: 8, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.gray }}>快捷入口：</span>
          <a href={`/admin/content-drafts${topicId ? `?topicId=${topicId}` : leadId ? `?leadId=${leadId}` : ""}`} style={{ fontSize: 12, color: "#0055cc" }}>查看稿件列表</a>
          {topicId && <a href={`/admin/content-topics/new?topicId=${topicId}`} style={{ fontSize: 12, color: "#0055cc" }}>编辑关联选题</a>}
          {leadId && <a href={`/admin/leads`} style={{ fontSize: 12, color: "#0055cc" }}>返回线索管理</a>}
          {leadId && <a href={`/admin/workspace?leadId=${leadId}`} style={{ fontSize: 12, color: "#0055cc", fontWeight: 600 }}>返回客户工作台</a>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={labelS}>标题 *</label>
          <input value={f.title} onChange={(e) => set("title", e.target.value)} style={inputS} placeholder="稿件标题" />
        </div>
        <div>
          <label style={labelS}>短链接 slug</label>
          <input value={f.slug} onChange={(e) => set("slug", e.target.value)} style={inputS} placeholder="文章短链接" />
        </div>
        <div>
          <label style={labelS}>内容类型</label>
          <select value={f.contentType} onChange={(e) => set("contentType", e.target.value)} style={inputS}>
            {CT_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>目标关键词</label>
          <input value={f.targetKeyword} onChange={(e) => set("targetKeyword", e.target.value)} style={inputS} placeholder="如：深圳 SaaS 获客" />
        </div>
        <div>
          <label style={labelS}>目标受众</label>
          <input value={f.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} style={inputS} placeholder="如：中小企业老板" />
        </div>
        <div>
          <label style={labelS}>推荐发布平台</label>
          <input value={f.platform} onChange={(e) => set("platform", e.target.value)} style={inputS} placeholder="如：公众号 / 知乎 / 官网" />
        </div>
        <div>
          <label style={labelS}>状态</label>
          <select value={f.status} onChange={(e) => set("status", e.target.value)} style={inputS}>
            <option value="draft">草稿</option>
            <option value="reviewing">审核中</option>
            <option value="approved">已通过</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
        </div>
        <div>
          <label style={labelS}>目标问题</label>
          <textarea value={f.targetQuestion} onChange={(e) => set("targetQuestion", e.target.value)} style={textareaS} placeholder="该稿件要回答什么问题？" />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelS}>摘要</label>
        <textarea value={f.summary} onChange={(e) => set("summary", e.target.value)} style={{ ...textareaS, minHeight: 60 }} placeholder="稿件的简要摘要" />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelS}>大纲</label>
        <textarea value={f.outline} onChange={(e) => set("outline", e.target.value)} style={{ ...textareaS, minHeight: 100 }} placeholder="稿件结构大纲" />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelS}>正文</label>
        <textarea value={f.body} onChange={(e) => set("body", e.target.value)} style={{ ...textareaS, minHeight: 300 }} placeholder="稿件正文内容..." />
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: C.dark, marginBottom: 16, borderTop: `2px solid ${C.grayLight}`, paddingTop: 24 }}>SEO 信息</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={labelS}>SEO 标题</label>
          <input value={f.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} style={inputS} />
        </div>
        <div>
          <label style={labelS}>Meta Description</label>
          <input value={f.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} style={inputS} />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label style={labelS}>标签（逗号或换行分隔）</label>
          <textarea value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} style={{ ...textareaS, minHeight: 50 }} placeholder="SEO标签1, SEO标签2" />
        </div>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: C.dark, marginBottom: 16, borderTop: `2px solid ${C.grayLight}`, paddingTop: 24 }}>审核信息</h2>
      <div style={{ marginBottom: 24 }}>
        <label style={labelS}>审核备注</label>
        <textarea value={f.reviewNotes} onChange={(e) => set("reviewNotes", e.target.value)} style={{ ...textareaS, minHeight: 60 }} placeholder="审核意见或修改建议" />
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: C.dark, marginBottom: 16, borderTop: `2px solid ${C.grayLight}`, paddingTop: 24 }}>合规检查</h2>
      <div style={{ marginBottom: 24, background: "#fafafa", padding: 16, borderRadius: 8 }}>
        {COMPLIANCE_ITEMS.map((item) => (
          <label key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, cursor: "pointer", color: C.dark }}>
            <input type="checkbox" checked={f.complianceChecklist.includes(item)} onChange={() => toggleCompliance(item)} style={{ width: 16, height: 16 }} />
            {item}
          </label>
        ))}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: C.dark, marginBottom: 16, borderTop: `2px solid ${C.grayLight}`, paddingTop: 24 }}>发布信息</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={labelS}>计划发布日期</label>
          <input type="date" value={f.plannedPublishDate} onChange={(e) => set("plannedPublishDate", e.target.value)} style={inputS} />
        </div>
        <div>
          <label style={labelS}>实际发布日期</label>
          <input type="date" value={f.actualPublishDate} onChange={(e) => set("actualPublishDate", e.target.value)} style={inputS} />
        </div>
        <div>
          <label style={labelS}>发布链接</label>
          <input value={f.publishedUrl} onChange={(e) => set("publishedUrl", e.target.value)} style={inputS} placeholder="https://..." />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={handleSave} disabled={loading} style={{ padding: "10px 20px", background: C.dark, color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>{draftId ? "保存修改" : "创建稿件"}</button>
        {draftId && <button onClick={handleSaveAsNew} disabled={loading} style={{ padding: "10px 20px", background: "#0055cc", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>另存为新稿件</button>}
        <button onClick={handleSaveDraft} style={{ padding: "10px 20px", background: C.grayLight, color: C.dark, border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>保存本地草稿</button>
        <button onClick={handleRestoreDraft} style={{ padding: "10px 20px", background: C.grayLight, color: C.dark, border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>恢复草稿</button>
        <button onClick={handleGenerateMd} style={{ padding: "10px 20px", background: "#0f7b3a", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>生成 Markdown</button>
        <button onClick={handleDownloadMd} style={{ padding: "10px 20px", background: "#6f42c1", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>下载 .md</button>
        <button onClick={handleClear} style={{ padding: "10px 20px", background: "#dc3545", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", marginLeft: "auto" }}>清空</button>
      </div>
    </div>
  );
}
