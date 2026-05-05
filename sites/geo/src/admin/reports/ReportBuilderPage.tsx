import { useState, useEffect, useCallback } from "react";
import CustomerInfoForm from "./components/CustomerInfoForm";
import DiagnosisScopeForm from "./components/DiagnosisScopeForm";
import TestResultEditor from "./components/TestResultEditor";
import SummaryForm from "./components/SummaryForm";
import MarkdownPreview from "./components/MarkdownPreview";
import { generateMarkdown } from "./reportMarkdown";
import { saveDraft, loadDraft, clearDraft } from "./reportStorage";
import { CustomerInfo, DiagnosisScope, TestRecord, Summary, ReportDraft } from "./reportTypes";
import { createReport, updateReport, fetchReportById } from "./geoReportsApi";
import { C, sans } from "../../styles";
import { getToken } from "../geoAdminApi";

function emptyCustomer(): CustomerInfo {
  return { companyName: "", brandName: "", website: "", industry: "", targetCity: "", contactName: "" };
}

function emptyScope(): DiagnosisScope {
  return { diagnosisDate: new Date().toISOString().slice(0, 10), platforms: [], competitors: "", targetQuestions: "" };
}

function emptySummary(): Summary {
  return { visibilitySummary: "", mainProblems: "", opportunities: "", recommendedActions: "" };
}

export default function ReportBuilderPage() {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(emptyCustomer());
  const [scope, setScope] = useState<DiagnosisScope>(emptyScope());
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary());
  const [markdown, setMarkdown] = useState("");
  const [copied, setCopied] = useState(false);
  const [leadMsg, setLeadMsg] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rid = params.get("reportId");
    const lid = params.get("leadId");
    if (lid) setLeadId(lid);

    if (rid) {
      setLoading(true);
      fetchReportById(rid)
        .then((r) => {
          setReportId(r.id);
          if (r.leadId) setLeadId(r.leadId);
          setCustomerInfo({
            companyName: r.companyName || "",
            brandName: r.brandName || "",
            website: r.website || "",
            industry: r.industry || "",
            targetCity: r.targetCity || "",
            contactName: r.contactName || "",
          });
          setScope({
            diagnosisDate: r.diagnosisDate || new Date().toISOString().slice(0, 10),
            platforms: (r.platforms || []) as any[],
            competitors: r.competitors || "",
            targetQuestions: r.targetQuestions || "",
          });
          setTestRecords((r.testResults || []) as TestRecord[]);
          setSummary({
            visibilitySummary: r.visibilitySummary || "",
            mainProblems: r.mainProblems || "",
            opportunities: r.opportunities || "",
            recommendedActions: r.recommendedActions || "",
          });
          setMarkdown(r.markdown || "");
          setLeadMsg(r.leadId ? `已加载报告 ${r.id}` : `已加载报告`);
        })
        .catch(() => {
          setLeadMsg("无法加载报告，请检查报告 ID 是否正确");
        })
        .finally(() => setLoading(false));
    } else if (lid) {
      const token = getToken();
      if (!token) {
        setLeadMsg("无法自动读取 lead（未登录），请手动填写客户信息。");
        return;
      }

      const baseUrl = import.meta.env.VITE_GEO_ADMIN_API_BASE_URL || "http://localhost:3001/api/v1";
      fetch(`${baseUrl}/geo-leads/${lid}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
        .then((res) => {
          if (!res.ok) throw new Error("读取失败");
          return res.json();
        })
        .then((lead) => {
          setCustomerInfo({
            companyName: lead.companyName || "",
            brandName: lead.brandName || "",
            website: lead.website || "",
            industry: lead.industry || "",
            targetCity: lead.targetCity || "",
            contactName: lead.contactName || "",
          });
          setLeadMsg(`已从线索 ${lid} 带入客户信息`);
        })
        .catch(() => {
          setLeadMsg("无法自动读取 lead，请手动填写客户信息。");
        });
    }
  }, []);

  const draft: ReportDraft = { customerInfo, scope, testRecords, summary };

  const currentMarkdown = useCallback(() => {
    return generateMarkdown(draft);
  }, [draft]);

  const handleGenerate = useCallback(() => {
    const md = currentMarkdown();
    setMarkdown(md);
  }, [currentMarkdown]);

  const buildPayload = useCallback(() => {
    const md = markdown || currentMarkdown();
    return {
      leadId: leadId || undefined,
      title: `${customerInfo.brandName} AI 可见度诊断报告`,
      companyName: customerInfo.companyName,
      brandName: customerInfo.brandName,
      website: customerInfo.website,
      industry: customerInfo.industry,
      targetCity: customerInfo.targetCity || undefined,
      contactName: customerInfo.contactName || undefined,
      diagnosisDate: scope.diagnosisDate,
      platforms: scope.platforms,
      competitors: scope.competitors,
      targetQuestions: scope.targetQuestions,
      testResults: testRecords as any[],
      visibilitySummary: summary.visibilitySummary,
      mainProblems: summary.mainProblems,
      opportunities: summary.opportunities,
      recommendedActions: summary.recommendedActions,
      markdown: md,
    };
  }, [customerInfo, scope, testRecords, summary, markdown, leadId, currentMarkdown]);

  const handleSaveToBackend = async () => {
    if (!getToken()) {
      alert("需要管理员 Token 才能保存到后端。请在 Leads 管理页面输入 Token。");
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayload();
      if (reportId) {
        await updateReport(reportId, payload);
        setSaveMsg("报告已保存");
      } else {
        const created = await createReport(payload);
        setReportId(created.id);
        setSaveMsg("报告已保存");
        const url = new URL(window.location.href);
        url.searchParams.set("reportId", created.id);
        window.history.replaceState({}, "", url.toString());
      }
    } catch (e: any) {
      setSaveMsg(`保存失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsNew = async () => {
    if (!getToken()) {
      alert("需要管理员 Token 才能保存到后端。请在 Leads 管理页面输入 Token。");
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayload();
      const created = await createReport(payload);
      setReportId(created.id);
      setSaveMsg("已另存为新报告");
      const url = new URL(window.location.href);
      url.searchParams.set("reportId", created.id);
      window.history.replaceState({}, "", url.toString());
    } catch (e: any) {
      setSaveMsg(`保存失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = markdown;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${customerInfo.brandName || "brand"}_AI可见度诊断报告.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (!confirm("确定清空所有已填写内容？未保存的草稿将丢失。")) return;
    setCustomerInfo(emptyCustomer());
    setScope(emptyScope());
    setTestRecords([]);
    setSummary(emptySummary());
    setMarkdown("");
    setReportId(null);
    clearDraft();
  };

  const handleSaveDraft = () => {
    saveDraft(draft);
    alert("草稿已保存到浏览器本地存储");
  };

  const handleLoadDraft = () => {
    const loaded = loadDraft();
    if (!loaded) { alert("未找到已保存的草稿"); return; }
    if (!confirm("恢复草稿将覆盖当前内容，是否继续？")) return;
    setCustomerInfo(loaded.customerInfo);
    setScope(loaded.scope);
    setTestRecords(loaded.testRecords);
    setSummary(loaded.summary);
    setMarkdown("");
    alert("草稿已恢复");
  };

  if (loading) {
    return (
      <div style={{ fontFamily: sans, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: C.gray, fontSize: 16 }}>
        加载中...
      </div>
    );
  }

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
          <span style={{ fontSize: 13, color: "#8a9aaa" }}>/</span>
          <a href="/admin/reports" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>Reports</a>
          <span style={{ fontSize: 13, color: "#8a9aaa", fontFamily: "monospace" }}>{reportId ? "编辑" : "新建"}</span>
        </div>
        <a href="/" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>← 返回官网</a>
      </nav>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>MOY GEO 诊断报告生成器</h1>
            <p style={{ fontSize: 13, color: "#8a9aaa", maxWidth: 600 }}>
              基于客户资料、目标问题、竞品信息和人工测试结果，生成可交付给客户的 AI 搜索可见度诊断报告。当前版本为人工录入 + 模板生成，不自动调用 AI 模型。
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={handleSaveDraft} style={actionBtn}>本地草稿</button>
            <button onClick={handleLoadDraft} style={actionBtn}>恢复草稿</button>
            <button onClick={handleGenerate} style={{ ...actionBtn, background: "#0055cc", color: "#fff", borderColor: "#0055cc" }}>生成报告</button>
            <button onClick={handleSaveToBackend} style={{ ...actionBtn, background: "#0f7b3a", color: "#fff", borderColor: "#0f7b3a" }} disabled={loading}>
              {reportId ? "更新到后端" : "保存到后端"}
            </button>
            {reportId && (
              <button onClick={handleSaveAsNew} style={{ ...actionBtn, background: "#0f7b3a", color: "#fff", borderColor: "#0f7b3a" }} disabled={loading}>
                另存为新报告
              </button>
            )}
            <button onClick={handleClear} style={{ ...actionBtn, color: "#c62828", borderColor: "#ef9a9a" }}>清空</button>
          </div>
        </div>

        {saveMsg && (
          <div style={{ marginBottom: 8, padding: "10px 14px", background: saveMsg.includes("失败") ? "#fff6ea" : "#e6f4ea", borderRadius: 6, fontSize: 13, color: saveMsg.includes("失败") ? "#b85c00" : "#0f7b3a" }}>
            {saveMsg}
          </div>
        )}

        {leadMsg && (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: leadMsg.startsWith("已从") || leadMsg.startsWith("已加载") ? "#e6f4ea" : "#fff6ea", borderRadius: 6, fontSize: 13, color: leadMsg.startsWith("已从") || leadMsg.startsWith("已加载") ? "#0f7b3a" : "#b85c00" }}>
            {leadMsg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8ecf1", padding: 24, marginBottom: 20 }}>
              <CustomerInfoForm value={customerInfo} onChange={setCustomerInfo} />
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8ecf1", padding: 24, marginBottom: 20 }}>
              <DiagnosisScopeForm value={scope} onChange={setScope} />
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8ecf1", padding: 24, marginBottom: 20 }}>
              <TestResultEditor records={testRecords} onChange={setTestRecords} />
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8ecf1", padding: 24 }}>
              <SummaryForm value={summary} onChange={setSummary} />
            </div>
          </div>
          <div style={{ paddingTop: 0 }}>
            <div style={{ position: "sticky", top: 72 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#5a6a7e" }}>报告预览</h3>
              <MarkdownPreview
                markdown={markdown}
                onCopy={handleCopy}
                onDownload={handleDownload}
                copied={copied}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  padding: "7px 16px", border: "1px solid #d0d7de", borderRadius: 6,
  background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
