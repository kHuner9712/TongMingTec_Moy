import { C, sans } from "../../../styles";

interface Props {
  hints: string[];
}

export default function ProjectRiskHints({ hints }: Props) {
  return (
    <div style={{ padding: "20px 32px" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 12px", fontFamily: sans }}>
        项目风险提示
      </h2>
      {hints.length === 0 ? (
        <div style={{ padding: "12px 16px", borderRadius: 6, background: C.greenBg, fontSize: 13, color: C.green, fontFamily: sans }}>
          该项目运行正常，暂无风险提示。
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {hints.map((hint, i) => (
            <div key={i} style={{ padding: "10px 14px", borderRadius: 6, background: C.amberBg, fontSize: 13, color: C.amber, border: `1px solid #fcd9a5`, fontFamily: sans }}>
              {hint}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
