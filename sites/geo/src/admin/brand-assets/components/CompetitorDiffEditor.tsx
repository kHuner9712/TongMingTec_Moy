import { CompetitorDiff } from "../brandAssetTypes";

interface Props {
  value: CompetitorDiff[];
  onChange: (v: CompetitorDiff[]) => void;
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5a6a7e", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "6px 10px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13 };
const areaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical" as const, minHeight: 60, fontFamily: "inherit" };

function emptyItem(): CompetitorDiff {
  return { competitor: "", difference: "", ourAdvantage: "", evidence: "" };
}

export default function CompetitorDiffEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<CompetitorDiff>) => {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0d1b2a", margin: 0 }}>竞品差异</h3>
        <button onClick={() => onChange([...value, emptyItem()])} style={btnStyle}>
          + 新增竞品
        </button>
      </div>

      {value.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: "#8a9aaa", border: "1px dashed #d0d7de", borderRadius: 8, marginBottom: 12 }}>
          暂无竞品对比，点击上方按钮开始添加
        </div>
      )}

      {value.map((d, i) => (
        <div key={i} style={{ border: "1px solid #e8ecf1", borderRadius: 8, padding: 14, marginBottom: 12, background: "#f7f9fb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5a6a7e" }}>竞品 #{i + 1}</span>
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ ...btnStyle, color: "#c62828", border: "1px solid #ef9a9a" }}>
              删除
            </button>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={labelStyle}>竞品名称</div>
            <input value={d.competitor} onChange={(e) => update(i, { competitor: e.target.value })} style={inputStyle} placeholder="竞品公司/品牌名称" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={labelStyle}>差异点</div>
            <textarea value={d.difference} onChange={(e) => update(i, { difference: e.target.value })} style={areaStyle} placeholder="我们和竞品的主要差异..." />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={labelStyle}>我方优势</div>
            <input value={d.ourAdvantage} onChange={(e) => update(i, { ourAdvantage: e.target.value })} style={inputStyle} placeholder="相比之下我们的优势..." />
          </div>
          <div>
            <div style={labelStyle}>佐证</div>
            <input value={d.evidence} onChange={(e) => update(i, { evidence: e.target.value })} style={inputStyle} placeholder="支持上述优势的证据..." />
          </div>
        </div>
      ))}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "6px 14px", border: "1px solid #0055cc", borderRadius: 6,
  background: "#fff", color: "#0055cc", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
