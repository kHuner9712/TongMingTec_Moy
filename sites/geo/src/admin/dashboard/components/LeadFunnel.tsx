import { GeoLeadBrief } from "../dashboardTypes";
import { C, sans } from "../../../styles";

interface Props {
  leads: GeoLeadBrief[];
}

const STATUS_LABELS: Record<string, string> = {
  received: "待处理", contacted: "已联系", qualified: "有效线索",
  proposal_sent: "已发方案", won: "已成交", lost: "已丢失", archived: "已归档",
};
const STATUS_COLORS: Record<string, string> = {
  received: "#8a9aaa", contacted: "#ef4444", qualified: C.blue,
  proposal_sent: "#0ea5e9", won: C.green, lost: "#dc3545", archived: "#a0a0a0",
};

export default function LeadFunnel({ leads }: Props) {
  const counts = countByStatus(leads);
  const order = ["received", "contacted", "qualified", "proposal_sent", "won", "lost", "archived"];
  const maxCount = Math.max(...order.map((k) => counts[k] || 0), 1);

  return (
    <div style={{ padding: "20px 32px", borderBottom: `1px solid ${C.grayLight}` }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 12px", fontFamily: sans }}>
        线索漏斗
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {order.map((k) => {
          const count = counts[k] || 0;
          const pct = Math.round((count / maxCount) * 100);
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: sans }}>
              <span style={{ width: 80, fontSize: 12, fontWeight: 600, color: C.gray, textAlign: "right" }}>
                {STATUS_LABELS[k] || k}
              </span>
              <div style={{ flex: 1, height: 24, background: C.bg, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: STATUS_COLORS[k] || C.gray, borderRadius: 4, minWidth: count > 0 ? 4 : 0 }} />
              </div>
              <span style={{ width: 40, fontSize: 14, fontWeight: 700, color: C.dark }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function countByStatus(items: { status: string }[]): Record<string, number> {
  const c: Record<string, number> = {};
  for (const i of items) c[i.status] = (c[i.status] || 0) + 1;
  return c;
}
