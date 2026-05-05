import { useState, useEffect } from "react";
import { createPlan, updatePlan, fetchPlanById } from "./geoContentApi";
import { C, sans } from "../styles";
import { getToken } from "./geoAdminApi";

const DRAFT_KEY = "moy_geo_content_plan_draft";

const PLATFORMS = ["官网", "公众号", "知乎", "小红书", "百家号", "头条号", "搜狐号", "B站专栏", "行业媒体"];

function emptyPlan() {
  return { title: "", month: "", goal: "", targetPlatforms: [] as string[], topics: [] as string[], summary: "", status: "draft" as string };
}

export default function ContentPlanEditorPage() {
  const [p, setP] = useState(emptyPlan());
  const [planId, setPlanId] = useState<string | null>(null);
  const [leadId, setLid] = useState<string | null>(null);
  const [brandAssetId, setBid] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const pid = sp.get("planId");
    if (sp.get("leadId")) setLid(sp.get("leadId"));
    if (sp.get("brandAssetId")) setBid(sp.get("brandAssetId"));
    setPlanId(pid);

    if (pid) {
      setLoading(true);
      fetchPlanById(pid).then((r) => {
        setP({ title: r.title || "", month: r.month || "", goal: r.goal || "", targetPlatforms: r.targetPlatforms || [], topics: (r.topics || []).map(String), summary: r.summary || "", status: r.status || "draft" });
        if (r.leadId) setLid(r.leadId);
        if (r.brandAssetId) setBid(r.brandAssetId);
      }).catch(() => setMsg("无法加载计划")).finally(() => setLoading(false));
    }
  }, []);

  const set = (f: string) => (e: any) => setP({ ...p, [f]: e.target.value });
  const buildPayload = () => ({ leadId: leadId || undefined, brandAssetId: brandAssetId || undefined, ...p });

  const save = async (asNew = false) => {
    if (!getToken()) { alert("请先登录"); return; }
    setLoading(true);
    try {
      const pl = buildPayload();
      if (asNew || !planId) {
        const r = await createPlan(pl);
        setPlanId(r.id);
        const u = new URL(window.location.href); u.searchParams.set("planId", r.id); window.history.replaceState({}, "", u.toString());
        setMsg("已保存为新计划");
      } else {
        await updatePlan(planId!, pl);
        setMsg("计划已保存");
      }
    } catch (e: any) { setMsg(`保存失败: ${e.message}`); }
    finally { setLoading(false); }
  };

  const togglePlatform = (v: string) => {
    setP({ ...p, targetPlatforms: p.targetPlatforms.includes(v) ? p.targetPlatforms.filter(x => x !== v) : [...p.targetPlatforms, v] });
  };

  const saveDraft = () => { localStorage.setItem(DRAFT_KEY, JSON.stringify(buildPayload())); alert("草稿已保存"); };
  const loadDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) { alert("无草稿"); return; }
    const d = JSON.parse(raw);
    setP({ ...p, ...d, targetPlatforms: d.targetPlatforms || [], topics: d.topics || [] });
    alert("草稿已恢复");
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
          <a href="/admin/content-plans" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>Content Plans</a>
        </div>
        <a href="/" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>← 返回官网</a>
      </nav>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>{planId ? "编辑计划" : "新建计划"}</h1>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => save(false)} style={actBtn}>{planId ? "保存" : "保存到后端"}</button>
          <button onClick={() => save(true)} style={actBtn}>另存为新计划</button>
          <button onClick={saveDraft} style={actBtn}>本地草稿</button>
          <button onClick={loadDraft} style={actBtn}>恢复草稿</button>
        </div>
        {msg && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 6, fontSize: 13, background: msg.includes("失败") ? "#fff6ea" : "#e6f4ea", color: msg.includes("失败") ? "#b85c00" : "#0f7b3a" }}>{msg}</div>}
        {planId && (
          <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href={`/admin/content-drafts/new?planId=${planId}&leadId=${leadId || ""}&brandAssetId=${brandAssetId || ""}`} style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed", textDecoration: "none", padding: "4px 10px", background: "#ede9fe", borderRadius: 4 }}>+ 新建稿件</a>
            <a href={`/admin/content-drafts?planId=${planId}`} style={{ fontSize: 12, fontWeight: 600, color: "#5a6a7e", textDecoration: "none", padding: "4px 10px", background: "#f0f2f5", borderRadius: 4 }}>查看关联稿件</a>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><div style={lb}>标题</div><input value={p.title} onChange={set("title")} style={inp} /></div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><div style={lb}>月份</div><input value={p.month} onChange={set("month")} style={inp} placeholder="2026-05" /></div>
            <div style={{ flex: 1 }}><div style={lb}>状态</div><select value={p.status} onChange={set("status")} style={inp}><option value="draft">草稿</option><option value="active">进行中</option><option value="completed">已完成</option></select></div>
          </div>
          <div><div style={lb}>目标</div><textarea value={p.goal} onChange={set("goal")} style={area} /></div>
          <div>
            <div style={lb}>目标平台</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PLATFORMS.map((v) => (
                <label key={v} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", border: "1px solid #d0d7de", borderRadius: 6, background: p.targetPlatforms.includes(v) ? "#e6f0ff" : "#fff", cursor: "pointer" }}>
                  <input type="checkbox" checked={p.targetPlatforms.includes(v)} onChange={() => togglePlatform(v)} /> {v}
                </label>
              ))}
            </div>
          </div>
          <div><div style={lb}>关联选题 ID（每行一个）</div><textarea value={p.topics.join("\n")} onChange={(e) => setP({ ...p, topics: e.target.value.split("\n").filter(s => s.trim()) })} style={area} /></div>
          <div><div style={lb}>总结</div><textarea value={p.summary} onChange={set("summary")} style={area} /></div>
        </div>
      </div>
    </div>
  );
}

const lb: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5a6a7e", marginBottom: 4 };
const inp: React.CSSProperties = { width: "100%", padding: "7px 10px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 };
const area: React.CSSProperties = { ...inp, resize: "vertical", minHeight: 80, fontFamily: "inherit" };
const actBtn: React.CSSProperties = { padding: "7px 14px", border: "1px solid #d0d7de", borderRadius: 6, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
