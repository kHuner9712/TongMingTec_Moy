import { useState, useEffect, useCallback } from "react";
import { C, sans } from "../../styles";
import { getToken } from "../geoAdminApi";
import { fetchLead, fetchReports, fetchBrandAssets, fetchTopics, fetchPlans, fetchDrafts } from "../workspace/workspaceApi";
import { fetchReportById, GeoReportFull } from "../reports/geoReportsApi";
import { fetchBrandAssetById, GeoBrandAssetFull } from "../brand-assets/geoBrandAssetsApi";
import { fetchContentDraftById, GeoContentDraftFull } from "../geoContentDraftsApi";
import { GeoContentTopicBrief, GeoContentPlanBrief } from "../geoContentApi";
import { generateExportMarkdown, ExportOptions, DEFAULT_OPTIONS } from "./exportMarkdown";
import { GeoLead } from "../adminTypes";

const OPTION_LABELS: { key: keyof ExportOptions; label: string }[] = [
  { key: "includeCustomerInfo", label: "包含客户基础信息" },
  { key: "includeReports", label: "包含诊断报告" },
  { key: "includeBrandAssets", label: "包含品牌事实资产包" },
  { key: "includeTopics", label: "包含内容选题" },
  { key: "includePlans", label: "包含内容计划" },
  { key: "includeDrafts", label: "包含内容稿件" },
  { key: "includeCompliance", label: "包含合规说明" },
  { key: "includeSummary", label: "包含交付摘要" },
];

export default function ExportPage() {
  const sp = new URLSearchParams(window.location.search);
  const leadId = sp.get("leadId");

  const [lead, setLead] = useState<GeoLead | null>(null);
  const [reports, setReports] = useState<GeoReportFull[]>([]);
  const [brandAssets, setBrandAssets] = useState<GeoBrandAssetFull[]>([]);
  const [topics, setTopics] = useState<GeoContentTopicBrief[]>([]);
  const [plans, setPlans] = useState<GeoContentPlanBrief[]>([]);
  const [drafts, setDrafts] = useState<GeoContentDraftFull[]>([]);
  const [options, setOptions] = useState<ExportOptions>({ ...DEFAULT_OPTIONS });
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadAll = useCallback(async () => {
    if (!leadId || !getToken()) return;
    setLoading(true);
    setError("");
    setGenerated(false);

    try {
      const results = await Promise.allSettled([
        fetchLead(leadId),
        fetchReports(leadId),
        fetchBrandAssets(leadId),
        fetchTopics(leadId),
        fetchPlans(leadId),
        fetchDrafts(leadId),
      ]);

      const [leadR, reportsR, brandAssetsR, topicsR, plansR, draftsR] = results;

      const leadOk = leadR.status === "fulfilled" ? leadR.value : null;
      if (leadR.status === "rejected") {
        setError("无法加载线索：" + ((leadR.reason as any)?.message || "失败"));
        setLoading(false);
        return;
      }
      setLead(leadOk as GeoLead);

      const reportBriefs = resolveList(reportsR) as any[];
      const brandAssetBriefs = resolveList(brandAssetsR) as any[];
      const draftBriefs = resolveList(draftsR) as any[];

      setTopics(resolveList(topicsR) as GeoContentTopicBrief[]);
      setPlans(resolveList(plansR) as GeoContentPlanBrief[]);

      if (reportBriefs.length > 0 || brandAssetBriefs.length > 0 || draftBriefs.length > 0) {
        setLoadingDetails(true);
        const detailResults = await Promise.allSettled([
          ...reportBriefs.map((r) => fetchReportById(r.id)),
          ...brandAssetBriefs.map((a) => fetchBrandAssetById(a.id)),
          ...draftBriefs.map((d) => fetchContentDraftById(d.id)),
        ]);

        const reportCount = reportBriefs.length;
        const brandAssetCount = brandAssetBriefs.length;

        const reportDetails = detailResults.slice(0, reportCount)
          .map((r) => r.status === "fulfilled" ? r.value : null)
          .filter(Boolean) as GeoReportFull[];
        const brandAssetDetails = detailResults.slice(reportCount, reportCount + brandAssetCount)
          .map((r) => r.status === "fulfilled" ? r.value : null)
          .filter(Boolean) as GeoBrandAssetFull[];
        const draftDetails = detailResults.slice(reportCount + brandAssetCount)
          .map((r) => r.status === "fulfilled" ? r.value : null)
          .filter(Boolean) as GeoContentDraftFull[];

        setReports(reportDetails);
        setBrandAssets(brandAssetDetails);
        setDrafts(draftDetails);
        setLoadingDetails(false);
      } else {
        setReports([]);
        setBrandAssets([]);
        setDrafts([]);
      }
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleGenerate = () => {
    const md = generateExportMarkdown({ lead, reports, brandAssets, topics, plans, drafts }, options);
    setMarkdown(md);
    setGenerated(true);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = markdown;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const brandName = lead?.brandName || "客户";
    const date = new Date().toISOString().split("T")[0];
    const filename = `${brandName}-GEO交付包-${date}.md`;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleOption = (key: keyof ExportOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
    if (generated) setGenerated(false);
  };

  if (!leadId) {
    return (
      <div style={centerWrap}>
        <h1 style={titleStyle}>GEO 客户交付导出包</h1>
        <p style={{ ...descStyle, marginBottom: 24 }}>请从线索池或客户工作台选择一个客户，进入导出页面</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <a href="/admin/leads" style={btnPrimary}>前往线索池</a>
          <a href="/admin/workspace" style={btnSecondary}>前往客户工作台</a>
        </div>
      </div>
    );
  }

  if (!getToken()) {
    return (
      <div style={centerWrap}>
        <p style={{ marginBottom: 16, color: C.gray }}>请先输入管理员访问令牌</p>
        <a href="/admin" style={{ color: C.blue }}>返回管理后台设置令牌</a>
      </div>
    );
  }

  if (loading) {
    return <div style={centerWrap}><p style={{ color: C.gray }}>加载中...</p></div>;
  }

  if (error && !lead) {
    return (
      <div style={centerWrap}>
        <p style={{ color: "#cc0000", marginBottom: 16 }}>{error}</p>
        <a href="/admin/leads" style={{ color: C.blue }}>返回线索列表</a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", fontFamily: sans }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.dark, margin: 0 }}>
            {lead?.brandName || "客户"} GEO 交付导出包
          </h1>
          <p style={{ fontSize: 13, color: C.gray, margin: "4px 0 0" }}>
            将客户相关的诊断报告、品牌资产包、内容选题、计划、稿件汇总为一个 Markdown 交付包
          </p>
        </div>
        {leadId && (
          <a href={`/admin/workspace?leadId=${leadId}`} style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
            ← 返回客户工作台
          </a>
        )}
      </div>

      {error && <div style={{ padding: 12, background: "#ffebee", borderRadius: 6, color: "#c62828", fontSize: 13, marginBottom: 16 }}>{error}</div>}

      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8ecf1", padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginTop: 0, marginBottom: 16 }}>导出内容选项</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          {OPTION_LABELS.map(({ key, label }) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.gray, cursor: "pointer" }}>
              <input type="checkbox" checked={options[key]} onChange={() => toggleOption(key)}
                style={{ width: 16, height: 16, cursor: "pointer", accentColor: C.blue }} />
              {label}
            </label>
          ))}
        </div>

        <button onClick={handleGenerate}
          disabled={loadingDetails}
          style={{
            marginTop: 20, padding: "10px 28px", background: loadingDetails ? "#d0d7de" : C.blue,
            color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 700,
            cursor: loadingDetails ? "not-allowed" : "pointer",
          }}>
          {loadingDetails ? "正在加载详细内容..." : "生成 Markdown"}
        </button>
      </div>

      {generated && markdown && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8ecf1", padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.dark, margin: 0 }}>预览</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCopy} style={copied ? btnCopied : btnAction}>
                {copied ? "✓ 已复制" : "复制 Markdown"}
              </button>
              <button onClick={handleDownload} style={btnAction}>下载 .md 文件</button>
            </div>
          </div>
          <pre style={{
            background: "#f7f9fb", borderRadius: 8, border: "1px solid #e8ecf1",
            padding: 20, fontSize: 13, lineHeight: 1.7, overflow: "auto",
            maxHeight: "calc(100vh - 400px)", whiteSpace: "pre-wrap", wordBreak: "break-word",
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace", color: C.dark,
          }}>
            {markdown}
          </pre>
        </div>
      )}
    </div>
  );
}

function resolveList(r: any): any[] {
  if (r.status === "rejected") return [];
  return r.value?.data || [];
}

const centerWrap: React.CSSProperties = {
  padding: "4rem 2rem", textAlign: "center", fontFamily: sans, color: C.gray,
};

const titleStyle: React.CSSProperties = {
  fontSize: 24, fontWeight: 700, color: C.dark, marginBottom: 12,
};

const descStyle: React.CSSProperties = {
  fontSize: 14, lineHeight: 1.7, color: C.gray,
};

const btnPrimary: React.CSSProperties = {
  display: "inline-block", padding: "10px 24px", background: C.blue, color: "#fff",
  borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: 14,
};

const btnSecondary: React.CSSProperties = {
  display: "inline-block", padding: "10px 24px", background: "#f0f2f5", color: C.gray,
  borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: 14, border: "1px solid #d0d7de",
};

const btnAction: React.CSSProperties = {
  padding: "8px 16px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13,
  fontWeight: 600, cursor: "pointer", background: "#f7f9fb", color: C.gray, fontFamily: sans,
};

const btnCopied: React.CSSProperties = {
  ...btnAction, background: C.greenBg, color: C.green, border: `1px solid #b3e0c0`,
};
