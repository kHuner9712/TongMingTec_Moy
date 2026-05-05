import { RiskItem } from "../dashboardTypes";
import { C, sans } from "../../../styles";

interface Props {
  risks: RiskItem[];
}

export default function ProjectRiskList({ risks }: Props) {
  return (
    <div style={{ padding: "20px 32px" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 12px", fontFamily: sans }}>
        项目风险 ({risks.length})
      </h2>
      {risks.length === 0 ? (
        <div style={{ padding: "12px 16px", borderRadius: 6, background: C.greenBg, color: C.green, fontSize: 13, fontFamily: sans }}>
          所有项目运行正常，暂无风险。
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {risks.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 6, background: C.amberBg, border: `1px solid #fcd9a5`, fontSize: 13, fontFamily: sans }}>
              <span style={{ fontWeight: 600, color: C.dark, flex: 1 }}>
                {r.companyName}{r.brandName ? ` (${r.brandName})` : ""}
              </span>
              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: "#ffedd5", color: C.amber }}>
                {r.riskType}
              </span>
              <span style={{ color: C.gray, flex: 1 }}>{r.action}</span>
              <a href={`/admin/workspace?leadId=${r.leadId}`} style={{ color: C.blue, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>工作台 &rarr;</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
