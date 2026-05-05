import { Advantage } from "../brandAssetTypes";

interface Props {
  value: Advantage[];
  onChange: (v: Advantage[]) => void;
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5a6a7e", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "6px 10px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13 };
const areaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical" as const, minHeight: 60, fontFamily: "inherit" };

function emptyItem(): Advantage {
  return { title: "", description: "", proof: "" };
}

export default function AdvantagesEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<Advantage>) => {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0d1b2a", margin: 0 }}>核心优势</h3>
        <button onClick={() => onChange([...value, emptyItem()])} style={btnStyle}>
          + 新增优势
        </button>
      </div>

      {value.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: "#8a9aaa", border: "1px dashed #d0d7de", borderRadius: 8, marginBottom: 12 }}>
          暂无核心优势，点击上方按钮开始添加
        </div>
      )}

      {value.map((a, i) => (
        <div key={i} style={{ border: "1px solid #e8ecf1", borderRadius: 8, padding: 14, marginBottom: 12, background: "#f7f9fb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5a6a7e" }}>优势 #{i + 1}</span>
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ ...btnStyle, color: "#c62828", border: "1px solid #ef9a9a" }}>
              删除
            </button>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={labelStyle}>标题</div>
            <input value={a.title} onChange={(e) => update(i, { title: e.target.value })} style={inputStyle} placeholder="如：全平台覆盖" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={labelStyle}>说明</div>
            <textarea value={a.description} onChange={(e) => update(i, { description: e.target.value })} style={areaStyle} placeholder="这个优势的具体含义..." />
          </div>
          <div>
            <div style={labelStyle}>佐证</div>
            <input value={a.proof} onChange={(e) => update(i, { proof: e.target.value })} style={inputStyle} placeholder="数据、案例、资质等佐证..." />
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
