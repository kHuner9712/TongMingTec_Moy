import { useState } from "react";
import {
  GeoReportBrief, GeoBrandAssetBrief, GeoContentTopicBrief,
  GeoContentPlanBrief, GeoContentDraftBrief,
} from "../workspaceTypes";
import { C, sans } from "../../../styles";

interface Props {
  leadId: string;
  reports: GeoReportBrief[];
  reportsError: string;
  brandAssets: GeoBrandAssetBrief[];
  brandAssetsError: string;
  topics: GeoContentTopicBrief[];
  topicsError: string;
  plans: GeoContentPlanBrief[];
  plansError: string;
  drafts: GeoContentDraftBrief[];
  draftsError: string;
}

const TABS = [
  { key: "reports", label: "诊断报告", color: C.blue },
  { key: "brand_assets", label: "品牌资产包", color: C.green },
  { key: "topics", label: "内容选题", color: C.amber },
  { key: "plans", label: "内容计划", color: "#7c3aed" },
  { key: "drafts", label: "内容稿件", color: "#7c3aed" },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function RecentDeliverables(props: Props) {
  const [tab, setTab] = useState<TabKey>("reports");

  const renderSection = () => {
    switch (tab) {
      case "reports": return renderList(props.reports, props.reportsError, "report", `/admin/reports/new?reportId=`);
      case "brand_assets": return renderList(props.brandAssets, props.brandAssetsError, "asset", `/admin/brand-assets/new?assetId=`);
      case "topics": return renderList(props.topics, props.topicsError, "topic", `/admin/content-topics/new?topicId=`);
      case "plans": return renderList(props.plans, props.plansError, "plan", `/admin/content-plans/new?planId=`);
      case "drafts": return renderList(props.drafts, props.draftsError, "draft", `/admin/content-drafts/new?draftId=`);
    }
  };

  return (
    <div style={{ padding: "20px 32px", borderBottom: `1px solid ${C.grayLight}` }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 12px", fontFamily: sans }}>
        最近交付物
      </h2>
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: `2px solid ${C.grayLight}` }}>
        {TABS.map((t) => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 16px", background: "none", border: "none",
              borderBottom: tab === t.key ? `3px solid ${t.color}` : "3px solid transparent",
              color: tab === t.key ? t.color : C.gray, fontSize: 13, fontWeight: 600,
              cursor: "pointer", marginBottom: -2, fontFamily: sans,
            }}>
            {t.label}
          </button>
        ))}
      </div>
      {renderSection()}
    </div>
  );
}

function renderList<T extends { id: string; title: string; status: string; createdAt: string }>(
  items: T[], error: string, prefix: string, editBase: string,
) {
  if (error) return <p style={{ color: "#cc0000", fontSize: 13 }}>加载失败：{error}</p>;
  if (items.length === 0) return <p style={{ color: C.gray, fontSize: 13 }}>暂无数据</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
      {items.slice(0, 20).map((item) => (
        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: C.bg, borderRadius: 6, fontSize: 13 }}>
          <span style={{ fontWeight: 500, color: C.dark, flex: 1 }}>{item.title || "（无标题）"}</span>
          <span style={{ margin: "0 12px", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, color: "#fff", background: item.status === "published" ? C.green : item.status === "archived" ? "#a0a0a0" : C.gray }}>
            {item.status}
          </span>
          <span style={{ color: C.gray, marginRight: 12 }}>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</span>
          <a href={`${editBase}${item.id}`} style={{ color: C.blue, textDecoration: "none", fontWeight: 600, fontSize: 12 }}>编辑</a>
        </div>
      ))}
    </div>
  );
}
