import { KpiSnapshot } from "../dashboardTypes";
import { C, sans } from "../../../styles";

interface Props {
  kpis: KpiSnapshot;
}

export default function DashboardKpis({ kpis }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, padding: "20px 32px" }}>
      <KpiCard label="线索总数" value={kpis.leadsTotal} color={C.dark} bg={C.bg} />
      <KpiCard label="待处理线索" value={kpis.leadsReceived} color={C.amber} bg={C.amberBg} />
      <KpiCard label="有效线索" value={kpis.leadsQualified} color="#0055cc" bg={C.blueLight} />
      <KpiCard label="已成交" value={kpis.leadsWon} color={C.green} bg={C.greenBg} />
      <KpiCard label="诊断报告" value={kpis.reportsCount} color="#0055cc" bg={C.blueLight} />
      <KpiCard label="品牌资产包" value={kpis.brandAssetsCount} color={C.green} bg={C.greenBg} />
      <KpiCard label="内容选题" value={kpis.topicsCount} color={C.amber} bg={C.amberBg} />
      <KpiCard label="内容稿件" value={kpis.draftsCount} color="#7c3aed" bg="#ede9fe" />
    </div>
  );
}

function KpiCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{ padding: "16px", borderRadius: 8, background: bg, border: `1px solid ${color}22`, textAlign: "center", fontFamily: sans }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.gray, marginTop: 4 }}>{label}</div>
    </div>
  );
}
