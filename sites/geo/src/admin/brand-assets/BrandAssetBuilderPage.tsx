import { useState, useEffect, useCallback } from "react";
import BasicInfoForm from "./components/BasicInfoForm";
import IntroForm from "./components/IntroForm";
import ServiceItemsEditor from "./components/ServiceItemsEditor";
import AdvantagesEditor from "./components/AdvantagesEditor";
import CasesEditor from "./components/CasesEditor";
import FAQEditor from "./components/FAQEditor";
import CompetitorDiffEditor from "./components/CompetitorDiffEditor";
import ComplianceMaterialForm from "./components/ComplianceMaterialForm";
import BrandAssetPreview from "./components/BrandAssetPreview";
import { generateMarkdown } from "./brandAssetMarkdown";
import { saveDraft, loadDraft, clearDraft } from "./brandAssetStorage";
import { createBrandAsset, updateBrandAsset, fetchBrandAssetById } from "./geoBrandAssetsApi";
import {
  BasicInfo, CompanyIntro, ServiceItem, Advantage, CaseItem,
  FAQItem, CompetitorDiff, ComplianceMaterials, BrandAssetDraft,
} from "./brandAssetTypes";
import { C, sans } from "../../styles";
import { getToken } from "../geoAdminApi";

function emptyBasicInfo(): BasicInfo {
  return { companyName: "", brandName: "", website: "", industry: "", targetCity: "", foundedYear: "", headquarters: "", contactInfo: "" };
}

function emptyIntro(): CompanyIntro {
  return { oneSentenceIntro: "", shortIntro: "", fullIntro: "" };
}

function emptyCompliance(): ComplianceMaterials {
  return { publicMaterials: "", forbiddenMaterials: "" };
}

export default function BrandAssetBuilderPage() {
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(emptyBasicInfo());
  const [intro, setIntro] = useState<CompanyIntro>(emptyIntro());
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [advantages, setAdvantages] = useState<Advantage[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [competitorDiffs, setCompetitorDiffs] = useState<CompetitorDiff[]>([]);
  const [compliance, setCompliance] = useState<ComplianceMaterials>(emptyCompliance());
  const [markdown, setMarkdown] = useState("");
  const [copied, setCopied] = useState(false);
  const [leadMsg, setLeadMsg] = useState("");
  const [assetId, setAssetId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const draft: BrandAssetDraft = { basicInfo, intro, serviceItems, advantages, cases, faqs, competitorDiffs, compliance };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const aid = params.get("assetId");
    const lid = params.get("leadId");
    if (lid) setLeadId(lid);

    if (aid) {
      setLoading(true);
      fetchBrandAssetById(aid)
        .then((a) => {
          setAssetId(a.id);
          if (a.leadId) setLeadId(a.leadId);
          setBasicInfo(a.basicInfo || emptyBasicInfo());
          setIntro(a.companyIntro || emptyIntro());
          setServiceItems((a.serviceItems || []) as ServiceItem[]);
          setAdvantages((a.advantages || []) as Advantage[]);
          setCases((a.cases || []) as CaseItem[]);
          setFaqs((a.faqs || []) as FAQItem[]);
          setCompetitorDiffs((a.competitorDiffs || []) as CompetitorDiff[]);
          setCompliance(a.complianceMaterials || emptyCompliance());
          setMarkdown(a.markdown || "");
          setLeadMsg(`已加载资产包 ${a.id}`);
        })
        .catch(() => {
          setLeadMsg("无法加载资产包，请检查 ID 是否正确");
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
          setBasicInfo({
            companyName: lead.companyName || "",
            brandName: lead.brandName || "",
            website: lead.website || "",
            industry: lead.industry || "",
            targetCity: lead.targetCity || "",
            foundedYear: "",
            headquarters: "",
            contactInfo: lead.contactName || "",
          });
          setLeadMsg(`已从线索 ${lid} 带入基础信息`);
        })
        .catch(() => {
          setLeadMsg("无法自动读取 lead，请手动填写客户信息。");
        });
    }
  }, []);

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
      title: `${basicInfo.brandName} 品牌事实资产包`,
      companyName: basicInfo.companyName,
      brandName: basicInfo.brandName,
      website: basicInfo.website,
      industry: basicInfo.industry,
      targetCity: basicInfo.targetCity || undefined,
      basicInfo,
      companyIntro: intro,
      serviceItems: serviceItems as any[],
      advantages: advantages as any[],
      cases: cases as any[],
      faqs: faqs as any[],
      competitorDiffs: competitorDiffs as any[],
      complianceMaterials: compliance,
      markdown: md,
    };
  }, [basicInfo, intro, serviceItems, advantages, cases, faqs, competitorDiffs, compliance, markdown, leadId, currentMarkdown]);

  const handleSaveToBackend = async () => {
    if (!getToken()) {
      alert("需要管理员 Token 才能保存到后端。请在 Leads 管理页面输入 Token。");
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayload();
      if (assetId) {
        await updateBrandAsset(assetId, payload);
        setSaveMsg("品牌事实资产包已保存");
      } else {
        const created = await createBrandAsset(payload);
        setAssetId(created.id);
        setSaveMsg("品牌事实资产包已保存");
        const url = new URL(window.location.href);
        url.searchParams.set("assetId", created.id);
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
      const created = await createBrandAsset(payload);
      setAssetId(created.id);
      setSaveMsg("已另存为新资产包");
      const url = new URL(window.location.href);
      url.searchParams.set("assetId", created.id);
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
    a.download = `${basicInfo.brandName || "brand"}_品牌事实资产包.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (!confirm("确定清空所有已填写内容？未保存的草稿将丢失。")) return;
    setBasicInfo(emptyBasicInfo());
    setIntro(emptyIntro());
    setServiceItems([]);
    setAdvantages([]);
    setCases([]);
    setFaqs([]);
    setCompetitorDiffs([]);
    setCompliance(emptyCompliance());
    setMarkdown("");
    setAssetId(null);
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
    setBasicInfo(loaded.basicInfo);
    setIntro(loaded.intro);
    setServiceItems(loaded.serviceItems);
    setAdvantages(loaded.advantages);
    setCases(loaded.cases);
    setFaqs(loaded.faqs);
    setCompetitorDiffs(loaded.competitorDiffs);
    setCompliance(loaded.compliance);
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
          <a href="/admin/brand-assets" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>Brand Assets</a>
          <span style={{ fontSize: 13, color: "#8a9aaa", fontFamily: "monospace" }}>{assetId ? "编辑" : "新建"}</span>
        </div>
        <a href="/" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>← 返回官网</a>
      </nav>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>MOY GEO 品牌事实资产包生成器</h1>
            <p style={{ fontSize: 13, color: "#8a9aaa", maxWidth: 600 }}>
              把客户真实资料整理为 AI 可读、可复用、可审核的品牌事实资产。所有内容必须基于客户真实信息，不得编造。
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={handleSaveDraft} style={actionBtn}>本地草稿</button>
            <button onClick={handleLoadDraft} style={actionBtn}>恢复草稿</button>
            <button onClick={handleGenerate} style={{ ...actionBtn, background: "#0055cc", color: "#fff", borderColor: "#0055cc" }}>生成资产包</button>
            <button onClick={handleSaveToBackend} style={{ ...actionBtn, background: "#0f7b3a", color: "#fff", borderColor: "#0f7b3a" }} disabled={loading}>
              {assetId ? "更新到后端" : "保存到后端"}
            </button>
            {assetId && (
              <button onClick={handleSaveAsNew} style={{ ...actionBtn, background: "#0f7b3a", color: "#fff", borderColor: "#0f7b3a" }} disabled={loading}>
                另存为新资产包
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

        {assetId && (
          <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#5a6a7e" }}>快捷入口：</span>
            <a href={`/admin/content-topics/new?brandAssetId=${assetId}&leadId=${leadId || ""}`}
              style={{ fontSize: 12, fontWeight: 600, textDecoration: "none", color: "#b85c00", background: "#fff6ea", padding: "4px 10px", borderRadius: 4, border: "1px solid #fcd9a5" }}>
              + 建选题
            </a>
            <a href={`/admin/content-topics?brandAssetId=${assetId}`}
              style={{ fontSize: 12, fontWeight: 600, textDecoration: "none", color: "#5a6a7e", background: "#f7f9fb", padding: "4px 10px", borderRadius: 4, border: "1px solid #d0d7de" }}>
              查看选题
            </a>
            <a href={`/admin/content-plans/new?brandAssetId=${assetId}&leadId=${leadId || ""}`}
              style={{ fontSize: 12, fontWeight: 600, textDecoration: "none", color: "#7c3aed", background: "#ede9fe", padding: "4px 10px", borderRadius: 4, border: "1px solid #c4b5fd" }}>
              + 建计划
            </a>
            <a href={`/admin/content-plans?brandAssetId=${assetId}`}
              style={{ fontSize: 12, fontWeight: 600, textDecoration: "none", color: "#5a6a7e", background: "#f7f9fb", padding: "4px 10px", borderRadius: 4, border: "1px solid #d0d7de" }}>
              查看计划
            </a>
            {leadId && (
              <a href={`/admin/workspace?leadId=${leadId}`}
                style={{ fontSize: 12, fontWeight: 600, textDecoration: "none", color: "#0055cc", background: "#e8f1ff", padding: "4px 10px", borderRadius: 4, border: "1px solid #b3d4ff" }}>
                返回客户工作台
              </a>
            )}
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
              <BasicInfoForm value={basicInfo} onChange={setBasicInfo} />
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8ecf1", padding: 24, marginBottom: 20 }}>
              <IntroForm value={intro} onChange={setIntro} />
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8ecf1", padding: 24, marginBottom: 20 }}>
              <ServiceItemsEditor value={serviceItems} onChange={setServiceItems} />
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8ecf1", padding: 24, marginBottom: 20 }}>
              <AdvantagesEditor value={advantages} onChange={setAdvantages} />
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8ecf1", padding: 24, marginBottom: 20 }}>
              <CasesEditor value={cases} onChange={setCases} />
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8ecf1", padding: 24, marginBottom: 20 }}>
              <FAQEditor value={faqs} onChange={setFaqs} />
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8ecf1", padding: 24, marginBottom: 20 }}>
              <CompetitorDiffEditor value={competitorDiffs} onChange={setCompetitorDiffs} />
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8ecf1", padding: 24 }}>
              <ComplianceMaterialForm value={compliance} onChange={setCompliance} />
            </div>
          </div>
          <div style={{ paddingTop: 0 }}>
            <div style={{ position: "sticky", top: 72 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#5a6a7e" }}>资产包预览</h3>
              <BrandAssetPreview
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
