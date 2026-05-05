import { GeoLeadBrief } from "../dashboardTypes";
import { C, sans } from "../../../styles";

interface Props {
  leads: GeoLeadBrief[];
}

const STATUS_LABELS: Record<string, string> = {
  received: "待处理", contacted: "已联系", qualified: "有效线索",
  proposal_sent: "已发方案", won: "已成交", lost: "已丢失", archived: "已归档",
};

export default function RecentLeads({ leads }: Props) {
  const recent = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  return (
    <div style={{ padding: "20px 32px", borderBottom: `1px solid ${C.grayLight}` }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 12px", fontFamily: sans }}>
        最近线索
      </h2>
      {recent.length === 0 ? (
        <p style={{ fontSize: 13, color: C.gray }}>暂无线索数据</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {recent.map((l) => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: C.bg, borderRadius: 6, fontSize: 13, fontFamily: sans }}>
              <span style={{ color: C.gray, fontSize: 12, width: 80 }}>
                {new Date(l.createdAt).toLocaleDateString("zh-CN")}
              </span>
              <span style={{ fontWeight: 600, color: C.dark, flex: 1 }}>
                {l.companyName}{l.brandName ? ` (${l.brandName})` : ""}
              </span>
              <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, color: "#fff", background: "#8a9aaa" }}>
                {STATUS_LABELS[l.status] || l.status}
              </span>
              <span style={{ color: C.gray }}>{l.contactName}</span>
              <a href={`/admin/workspace?leadId=${l.id}`} style={{ color: C.blue, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>工作台 &rarr;</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
