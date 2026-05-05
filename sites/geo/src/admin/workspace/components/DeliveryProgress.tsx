import { StageItem } from "../workspaceTypes";
import { C, sans } from "../../../styles";

interface Props {
  stages: StageItem[];
}

const STATUS_COLORS: Record<string, string> = {
  done: C.green, active: C.amber, pending: C.grayLight,
};
const STATUS_BG: Record<string, string> = {
  done: C.greenBg, active: C.amberBg, pending: "#f0f2f5",
};
const STATUS_LABELS: Record<string, string> = {
  done: "已完成", active: "进行中", pending: "待开始",
};

export default function DeliveryProgress({ stages }: Props) {
  return (
    <div style={{ padding: "20px 32px", borderBottom: `1px solid ${C.grayLight}` }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 16px", fontFamily: sans }}>
        交付进度
      </h2>
      <div style={{ display: "flex", gap: 0, alignItems: "flex-start", flexWrap: "wrap" }}>
        {stages.map((s, i) => (
          <div key={s.key} style={{ flex: "1 1 140px", minWidth: 120, padding: "0 8px", textAlign: "center" }}>
            {i > 0 && (
              <div style={{ height: 2, margin: "20px 0 16px", background: s.status === "done" ? C.green : s.status === "active" ? C.amber : C.grayLight, borderRadius: 1 }} />
            )}
            <div style={{ padding: "6px 8px", borderRadius: 6, background: STATUS_BG[s.status], marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[s.status], textTransform: "uppercase" }}>
                {STATUS_LABELS[s.status]}
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.dark, fontFamily: sans }}>{s.count}</div>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 6 }}>{s.label}</div>
            <a href={s.link} style={{ fontSize: 11, color: C.blue, textDecoration: "none" }}>查看 &rarr;</a>
          </div>
        ))}
      </div>
    </div>
  );
}
