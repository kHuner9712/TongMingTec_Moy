import { useState, useEffect } from "react";
import { C, sans } from "../../styles";
import { getToken } from "../geoAdminApi";
import { WorkspaceData } from "./workspaceTypes";
import { fetchLead, fetchReports, fetchBrandAssets, fetchTopics, fetchPlans, fetchDrafts } from "./workspaceApi";
import { computeStageInfo, computeRiskHints } from "./workspaceUtils";
import WorkspaceHeader from "./components/WorkspaceHeader";
import DeliveryProgress from "./components/DeliveryProgress";
import QuickActions from "./components/QuickActions";
import RecentDeliverables from "./components/RecentDeliverables";
import ContentProductionSummary from "./components/ContentProductionSummary";
import ProjectRiskHints from "./components/ProjectRiskHints";

export default function GeoWorkspacePage() {
  const sp = new URLSearchParams(window.location.search);
  const leadId = sp.get("leadId");

  const [data, setData] = useState<WorkspaceData>({
    lead: null, leadError: "",
    reports: [], reportsError: "",
    brandAssets: [], brandAssetsError: "",
    topics: [], topicsError: "",
    plans: [], plansError: "",
    drafts: [], draftsError: "",
    stageInfo: { currentStage: "", stages: [] },
    riskHints: [],
  });
  const [globalLoading, setGlobalLoading] = useState(true);

  useEffect(() => {
    if (!leadId) { setGlobalLoading(false); return; }
    if (!getToken()) { setGlobalLoading(false); return; }

    Promise.allSettled([
      fetchLead(leadId),
      fetchReports(leadId),
      fetchBrandAssets(leadId),
      fetchTopics(leadId),
      fetchPlans(leadId),
      fetchDrafts(leadId),
    ]).then((results) => {
      const [leadR, reportsR, brandAssetsR, topicsR, plansR, draftsR] = results;

      const leadOk = leadR.status === "fulfilled" ? leadR.value : null;
      const leadErr = leadR.status === "rejected" ? (leadR.reason?.message || "失败") : "";

      const reports = resolveList(reportsR);
      const reportsErr = reportsR.status === "rejected" ? (reportsR.reason?.message || "失败") : "";

      const brandAssets = resolveList(brandAssetsR);
      const brandAssetsErr = brandAssetsR.status === "rejected" ? (brandAssetsR.reason?.message || "失败") : "";

      const topics = resolveList(topicsR);
      const topicsErr = topicsR.status === "rejected" ? (topicsR.reason?.message || "失败") : "";

      const plans = resolveList(plansR);
      const plansErr = plansR.status === "rejected" ? (plansR.reason?.message || "失败") : "";

      const drafts = resolveList(draftsR);
      const draftsErr = draftsR.status === "rejected" ? (draftsR.reason?.message || "失败") : "";

      const stageInfo = computeStageInfo(leadId, reports, brandAssets, topics, plans, drafts);
      const riskHints = computeRiskHints(
        (leadOk as any)?.status || "received", reports, brandAssets, topics, drafts,
      );

      setData({
        lead: leadOk as any, leadError: leadErr,
        reports, reportsError: reportsErr,
        brandAssets, brandAssetsError: brandAssetsErr,
        topics, topicsError: topicsErr,
        plans, plansError: plansErr,
        drafts, draftsError: draftsErr,
        stageInfo, riskHints,
      });
    }).finally(() => setGlobalLoading(false));
  }, []);

  if (!leadId) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center", fontFamily: sans, color: C.gray }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.dark, marginBottom: 12 }}>GEO 客户项目工作台</h1>
        <p style={{ marginBottom: 24 }}>请从线索列表选择一个客户进入工作台</p>
        <a href="/admin/leads" style={{ display: "inline-block", padding: "10px 24px", background: C.blue, color: "#fff", borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          前往线索列表
        </a>
      </div>
    );
  }

  if (!getToken()) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center", fontFamily: sans, color: C.gray }}>
        <p style={{ marginBottom: 16 }}>请先输入管理员访问令牌</p>
        <a href="/admin" style={{ color: C.blue }}>返回管理后台设置令牌</a>
      </div>
    );
  }

  if (globalLoading) {
    return <div style={{ padding: "4rem", textAlign: "center", fontFamily: sans, color: C.gray }}>加载中...</div>;
  }

  if (data.leadError) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center", fontFamily: sans }}>
        <p style={{ color: "#cc0000", marginBottom: 16 }}>无法加载线索：{data.leadError}</p>
        <a href="/admin/leads" style={{ color: C.blue }}>返回线索列表</a>
      </div>
    );
  }

  const lead = data.lead!;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", fontFamily: sans }}>
      <WorkspaceHeader lead={lead} currentStage={data.stageInfo.currentStage} />
      <DeliveryProgress stages={data.stageInfo.stages} />
      <QuickActions leadId={leadId} />
      <RecentDeliverables
        leadId={leadId}
        reports={data.reports} reportsError={data.reportsError}
        brandAssets={data.brandAssets} brandAssetsError={data.brandAssetsError}
        topics={data.topics} topicsError={data.topicsError}
        plans={data.plans} plansError={data.plansError}
        drafts={data.drafts} draftsError={data.draftsError}
      />
      <ContentProductionSummary
        topics={data.topics} topicsError={data.topicsError}
        drafts={data.drafts} draftsError={data.draftsError}
      />
      <ProjectRiskHints hints={data.riskHints} />
    </div>
  );
}

function resolveList(r: any): any[] {
  if (r.status === "rejected") return [];
  return r.value?.data || [];
}
