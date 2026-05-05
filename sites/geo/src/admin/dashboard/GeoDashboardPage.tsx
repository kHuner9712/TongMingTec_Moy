import { useState, useEffect } from "react";
import { C, sans } from "../../styles";
import { getToken } from "../geoAdminApi";
import { DashboardData } from "./dashboardTypes";
import { fetchLeads, fetchReports, fetchBrandAssets, fetchContentTopics, fetchContentPlans, fetchContentDrafts } from "./dashboardApi";
import { computeKpis, generateTodos, generateRisks } from "./dashboardUtils";
import DashboardKpis from "./components/DashboardKpis";
import TodoList from "./components/TodoList";
import LeadFunnel from "./components/LeadFunnel";
import ContentStatusSummary from "./components/ContentStatusSummary";
import RecentLeads from "./components/RecentLeads";
import RecentDeliverables from "./components/RecentDeliverables";
import ProjectRiskList from "./components/ProjectRiskList";

export default function GeoDashboardPage() {
  const [data, setData] = useState<DashboardData>({
    leads: [], leadsError: "",
    reports: [], reportsError: "",
    brandAssets: [], brandAssetsError: "",
    topics: [], topicsError: "",
    plans: [], plansError: "",
    drafts: [], draftsError: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }

    Promise.allSettled([
      fetchLeads(), fetchReports(), fetchBrandAssets(),
      fetchContentTopics(), fetchContentPlans(), fetchContentDrafts(),
    ]).then((results) => {
      const [leadsR, reportsR, brandAssetsR, topicsR, plansR, draftsR] = results;
      const leads = resolve(leadsR); const leadsErr = errMsg(leadsR);
      const reports = resolve(reportsR); const reportsErr = errMsg(reportsR);
      const brandAssets = resolve(brandAssetsR); const brandAssetsErr = errMsg(brandAssetsR);
      const topics = resolve(topicsR); const topicsErr = errMsg(topicsR);
      const plans = resolve(plansR); const plansErr = errMsg(plansR);
      const drafts = resolve(draftsR); const draftsErr = errMsg(draftsR);
      setData({
        leads, leadsError: leadsErr,
        reports, reportsError: reportsErr,
        brandAssets, brandAssetsError: brandAssetsErr,
        topics, topicsError: topicsErr,
        plans, plansError: plansErr,
        drafts, draftsError: draftsErr,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (!getToken()) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center", fontFamily: sans }}>
        <p style={{ color: C.gray, marginBottom: 16 }}>请输入管理员访问令牌以查看 GEO 运营总览</p>
        <a href="/admin" style={{ color: C.blue }}>返回并设置令牌</a>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: "4rem", textAlign: "center", fontFamily: sans, color: C.gray }}>加载中...</div>;
  }

  const allEmpty = data.leads.length === 0 && data.reports.length === 0 && data.drafts.length === 0;
  if (allEmpty && !data.leadsError && !data.reportsError) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center", fontFamily: sans }}>
        <p style={{ color: C.gray, marginBottom: 16, fontSize: 16 }}>暂无 GEO 运营数据</p>
        <p style={{ color: C.gray, marginBottom: 24, fontSize: 14 }}>
          请先通过 geo.moy.com 表单提交测试线索。
        </p>
        <a href="/" style={{ display: "inline-block", padding: "10px 24px", background: C.blue, color: "#fff", borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          前往表单
        </a>
      </div>
    );
  }

  const kpis = computeKpis(data.leads, data.reports, data.brandAssets, data.topics, data.drafts);
  const todos = generateTodos(data.leads, data.reports, data.brandAssets, data.topics, data.drafts);
  const risks = generateRisks(data.leads, data.reports, data.brandAssets, data.topics, data.drafts);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", fontFamily: sans }}>
      <div style={{ padding: "24px 32px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.dark, margin: 0 }}>MOY GEO 运营总览</h1>
            <p style={{ fontSize: 13, color: C.gray, margin: "4px 0 0" }}>
              汇总 GEO 线索、交付资产、内容生产和项目风险，帮助团队快速判断今日应该处理什么。
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/admin/leads" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>线索管理</a>
            <a href="/admin/workspace" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 600 }}>客户工作台</a>
          </div>
        </div>
      </div>
      <DashboardKpis kpis={kpis} />
      <TodoList todos={todos} />
      <LeadFunnel leads={data.leads} />
      <ContentStatusSummary
        topics={data.topics} topicsError={data.topicsError}
        drafts={data.drafts} draftsError={data.draftsError}
      />
      <RecentLeads leads={data.leads} />
      <RecentDeliverables
        leads={data.leads}
        reports={data.reports} reportsError={data.reportsError}
        brandAssets={data.brandAssets} brandAssetsError={data.brandAssetsError}
        drafts={data.drafts} draftsError={data.draftsError}
      />
      <ProjectRiskList risks={risks} />
    </div>
  );
}

function resolve(r: any): any[] {
  if (r.status === "rejected") return [];
  return r.value?.data || [];
}

function errMsg(r: any): string {
  return r.status === "rejected" ? (r.reason?.message || "请求失败") : "";
}
