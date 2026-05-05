import { useState, useEffect } from "react";
import { createTopic, updateTopic, fetchTopicById } from "./geoContentApi";
import { C, sans } from "../styles";
import { getToken } from "./geoAdminApi";

const DRAFT_KEY = "moy_geo_content_topic_draft";

const CT_OPTIONS = [
  { v: "industry_question", l: "行业问答" }, { v: "local_service", l: "本地服务" },
  { v: "competitor_comparison", l: "竞品对比" }, { v: "buying_guide", l: "购买决策" },
  { v: "misconception", l: "常见误区" }, { v: "case_study", l: "案例拆解" },
  { v: "pricing_explainer", l: "价格解释" }, { v: "process_explainer", l: "服务流程" },
  { v: "brand_intro", l: "品牌介绍" }, { v: "faq", l: "FAQ" },
];

function emptyTopic() {
  return {
    title: "", contentType: "industry_question" as string, targetKeyword: "",
    targetQuestion: "", targetAudience: "", searchIntent: "", platformSuggestion: "",
    priority: "medium" as string, status: "idea" as string, outline: "",
    keyPoints: [] as string[], referenceMaterials: [] as string[],
    complianceNotes: "", plannedPublishDate: "", actualPublishDate: "", publishedUrl: "",
  };
}

export default function ContentTopicEditorPage() {
  const [t, setT] = useState(emptyTopic());
  const [topicId, setTopicId] = useState<string | null>(null);
  const [leadId, setLid] = useState<string | null>(null);
  const [brandAssetId, setBid] = useState<string | null>(null);
  const [reportId, setRid] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const tid = p.get("topicId");
    if (p.get("leadId")) setLid(p.get("leadId"));
    if (p.get("brandAssetId")) setBid(p.get("brandAssetId"));
    if (p.get("reportId")) setRid(p.get("reportId"));
    if (tid) document.title = "编辑选题 · MOY GEO";
    setTopicId(tid);

    if (tid) {
      setLoading(true);
      fetchTopicById(tid).then((r) => {
        setT({
          title: r.title || "", contentType: r.contentType || "industry_question",
          targetKeyword: r.targetKeyword || "", targetQuestion: r.targetQuestion || "",
          targetAudience: r.targetAudience || "", searchIntent: r.searchIntent || "",
          platformSuggestion: r.platformSuggestion || "", priority: r.priority || "medium",
          status: r.status || "idea", outline: r.outline || "",
          keyPoints: r.keyPoints || [], referenceMaterials: r.referenceMaterials || [],
          complianceNotes: r.complianceNotes || "",
          plannedPublishDate: r.plannedPublishDate || "", actualPublishDate: r.actualPublishDate || "",
          publishedUrl: r.publishedUrl || "",
        });
        if (r.leadId) setLid(r.leadId);
        if (r.brandAssetId) setBid(r.brandAssetId);
        if (r.reportId) setRid(r.reportId);
      }).catch(() => setMsg("无法加载选题")).finally(() => setLoading(false));
    }
  }, []);

  const set = (f: string) => (e: any) => setT({ ...t, [f]: e.target.value });
  const buildPayload = () => ({ leadId: leadId || undefined, brandAssetId: brandAssetId || undefined, reportId: reportId || undefined, ...t });

  const save = async (asNew = false) => {
    if (!getToken()) { alert("请先登录"); return; }
    setLoading(true);
    try {
      const p = buildPayload();
      if (asNew || !topicId) {
        const r = await createTopic(p);
        setTopicId(r.id);
        const u = new URL(window.location.href); u.searchParams.set("topicId", r.id); window.history.replaceState({}, "", u.toString());
        setMsg("已保存为新选题");
      } else {
        await updateTopic(topicId!, p);
        setMsg("选题已保存");
      }
    } catch (e: any) { setMsg(`保存失败: ${e.message}`); }
    finally { setLoading(false); }
  };

  const saveDraft = () => { localStorage.setItem(DRAFT_KEY, JSON.stringify(buildPayload())); alert("草稿已保存"); };
  const loadDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) { alert("无草稿"); return; }
    const d = JSON.parse(raw);
    setT({ ...t, ...d, keyPoints: d.keyPoints || [], referenceMaterials: d.referenceMaterials || [] });
    alert("草稿已恢复");
  };

  const arrSet = (field: "keyPoints" | "referenceMaterials") => (e: any) => {
    setT({ ...t, [field]: e.target.value.split("\n").filter((s: string) => s.trim()) });
  };

  if (loading) return <div style={{ fontFamily: sans, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#8a9aaa" }}>加载中...</div>;

  return (
    <div style={{ fontFamily: sans, color: C.dark, background: C.bg, minHeight: "100vh" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #e8ecf1", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ fontWeight: 800, fontSize: 18, color: C.dark, textDecoration: "none" }}>MOY<span style={{ color: C.blue }}>GEO</span></a>
          <span style={{ fontSize: 13, color: "#8a9aaa" }}>/</span>
          <a href="/admin/leads" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>Leads</a>
          <span style={{ fontSize: 13, color: "#8a9aaa" }}>/</span>
          <a href="/admin/content-topics" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>Content Topics</a>
        </div>
        <a href="/" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>← 返回官网</a>
      </nav>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>{topicId ? "编辑选题" : "新建选题"}</h1>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => save(false)} style={actBtn}>{topicId ? "保存" : "保存到后端"}</button>
          <button onClick={() => save(true)} style={actBtn}>另存为新选题</button>
          <button onClick={saveDraft} style={actBtn}>本地草稿</button>
          <button onClick={loadDraft} style={actBtn}>恢复草稿</button>
        </div>
        {msg && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 6, fontSize: 13, background: msg.includes("失败") ? "#fff6ea" : "#e6f4ea", color: msg.includes("失败") ? "#b85c00" : "#0f7b3a" }}>{msg}</div>}
        
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><div style={lb}>标题</div><input value={t.title} onChange={set("title")} style={inp} /></div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><div style={lb}>类型</div><select value={t.contentType} onChange={set("contentType")} style={inp}>{CT_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
            <div style={{ flex: 1 }}><div style={lb}>优先级</div><select value={t.priority} onChange={set("priority")} style={inp}><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select></div>
            <div style={{ flex: 1 }}><div style={lb}>状态</div><select value={t.status} onChange={set("status")} style={inp}><option value="idea">想法</option><option value="planned">已规划</option><option value="drafting">起草中</option><option value="reviewing">审核中</option><option value="approved">已批准</option><option value="published">已发布</option></select></div>
          </div>
          <div><div style={lb}>目标关键词</div><input value={t.targetKeyword} onChange={set("targetKeyword")} style={inp} /></div>
          <div><div style={lb}>目标问题</div><textarea value={t.targetQuestion} onChange={set("targetQuestion")} style={area} /></div>
          <div><div style={lb}>目标受众</div><input value={t.targetAudience} onChange={set("targetAudience")} style={inp} /></div>
          <div><div style={lb}>搜索意图</div><select value={t.searchIntent} onChange={set("searchIntent")} style={inp}><option value="">-</option><option value="informational">信息了解</option><option value="commercial">商业比较</option><option value="navigational">品牌导航</option><option value="transactional">购买决策</option></select></div>
          <div><div style={lb}>平台建议</div><input value={t.platformSuggestion} onChange={set("platformSuggestion")} style={inp} /></div>
          <div><div style={lb}>大纲</div><textarea value={t.outline} onChange={set("outline")} style={area} /></div>
          <div><div style={lb}>关键要点（每行一个）</div><textarea value={t.keyPoints.join("\n")} onChange={arrSet("keyPoints")} style={area} /></div>
          <div><div style={lb}>参考资料（每行一个）</div><textarea value={t.referenceMaterials.join("\n")} onChange={arrSet("referenceMaterials")} style={area} /></div>
          <div><div style={lb}>合规备注</div><textarea value={t.complianceNotes} onChange={set("complianceNotes")} style={area} /></div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><div style={lb}>计划发布日期</div><input type="date" value={t.plannedPublishDate} onChange={set("plannedPublishDate")} style={inp} /></div>
            <div style={{ flex: 1 }}><div style={lb}>实际发布日期</div><input type="date" value={t.actualPublishDate} onChange={set("actualPublishDate")} style={inp} /></div>
          </div>
          <div><div style={lb}>已发布 URL</div><input value={t.publishedUrl} onChange={set("publishedUrl")} style={inp} /></div>
        </div>
      </div>
    </div>
  );
}

const lb: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5a6a7e", marginBottom: 4 };
const inp: React.CSSProperties = { width: "100%", padding: "7px 10px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 };
const area: React.CSSProperties = { ...inp, resize: "vertical", minHeight: 80, fontFamily: "inherit" };
const actBtn: React.CSSProperties = { padding: "7px 14px", border: "1px solid #d0d7de", borderRadius: 6, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
