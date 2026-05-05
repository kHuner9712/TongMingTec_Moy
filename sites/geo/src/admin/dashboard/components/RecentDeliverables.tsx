import {
  GeoReportBrief, GeoBrandAssetBrief, GeoContentDraftBrief, GeoLeadBrief,
} from "../dashboardTypes";
import { C, sans } from "../../../styles";

interface Props {
  leads: GeoLeadBrief[];
  reports: GeoReportBrief[];
  reportsError: string;
  brandAssets: GeoBrandAssetBrief[];
  brandAssetsError: string;
  drafts: GeoContentDraftBrief[];
  draftsError: string;
}

export default function RecentDeliverables({ leads, reports, reportsError, brandAssets, brandAssetsError, drafts, draftsError }: Props) {
  const findBrand = (leadId: string | null) => {
    if (!leadId) return "";
    const l = leads.find((l) => l.id === leadId);
    return l ? l.brandName || l.companyName : "";
  };

  const sort = <T extends { createdAt: string }>(items: T[], n: number) =>
    [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, n);

  return (
    <div style={{ padding: "20px 32px", borderBottom: `1px solid ${C.grayLight}` }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 12px", fontFamily: sans }}>
        最近交付物
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <DeliverableSection label="诊断报告" items={sort(reports, 5)} error={reportsError}
          render={(r) => ({ title: r.title, brand: findBrand(r.leadId), status: r.status, time: r.updatedAt, link: `/admin/reports/new?reportId=${r.id}` })} />
        <DeliverableSection label="品牌资产包" items={sort(brandAssets, 5)} error={brandAssetsError}
          render={(b) => ({ title: b.title, brand: b.brandName || findBrand(b.leadId), status: b.status, time: b.updatedAt, link: `/admin/brand-assets/new?assetId=${b.id}` })} />
        <DeliverableSection label="内容稿件" items={sort(drafts, 5)} error={draftsError}
          render={(d) => ({ title: d.title, brand: findBrand(d.leadId), status: d.status, time: d.createdAt, link: `/admin/content-drafts/new?draftId=${d.id}` })} />
      </div>
    </div>
  );
}

function DeliverableSection<T>({ label, items, error, render }: {
  label: string; items: T[]; error: string;
  render: (item: T) => { title: string; brand: string; status: string; time: string; link: string };
}) {
  return (
    <div>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: C.dark, margin: "0 0 8px" }}>{label}</h3>
      {error ? <p style={{ fontSize: 11, color: "#cc0000" }}>{error}</p> :
        items.length === 0 ? <p style={{ fontSize: 11, color: C.gray }}>暂无</p> :
          items.map((item, i) => {
            const d = render(item);
            return (
              <div key={i} style={{ padding: "6px 10px", background: C.bg, borderRadius: 4, marginBottom: 4, fontSize: 12, fontFamily: sans }}>
                <div style={{ fontWeight: 600, color: C.dark }}>{d.title || "（无标题）"}</div>
                <div style={{ color: C.gray }}>
                  {d.brand && <span>{d.brand} · </span>}
                  <span>{d.status}</span>
                  <span style={{ marginLeft: 6 }}>{new Date(d.time).toLocaleDateString("zh-CN")}</span>
                </div>
                <a href={d.link} style={{ fontSize: 11, color: C.blue, textDecoration: "none" }}>打开</a>
              </div>
            );
          })}
    </div>
  );
}
