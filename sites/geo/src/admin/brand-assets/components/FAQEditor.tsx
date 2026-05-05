import { FAQItem } from "../brandAssetTypes";

interface Props {
  value: FAQItem[];
  onChange: (v: FAQItem[]) => void;
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5a6a7e", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "6px 10px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13 };
const areaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical" as const, minHeight: 60, fontFamily: "inherit" };

function emptyItem(): FAQItem {
  return { question: "", answer: "" };
}

export default function FAQEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<FAQItem>) => {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0d1b2a", margin: 0 }}>常见问题 FAQ</h3>
        <button onClick={() => onChange([...value, emptyItem()])} style={btnStyle}>
          + 新增 FAQ
        </button>
      </div>

      {value.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: "#8a9aaa", border: "1px dashed #d0d7de", borderRadius: 8, marginBottom: 12 }}>
          暂无 FAQ，点击上方按钮开始添加
        </div>
      )}

      {value.map((f, i) => (
        <div key={i} style={{ border: "1px solid #e8ecf1", borderRadius: 8, padding: 14, marginBottom: 12, background: "#f7f9fb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5a6a7e" }}>FAQ #{i + 1}</span>
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ ...btnStyle, color: "#c62828", border: "1px solid #ef9a9a" }}>
              删除
            </button>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={labelStyle}>问题</div>
            <input value={f.question} onChange={(e) => update(i, { question: e.target.value })} style={inputStyle} placeholder="如：GEO 和传统 SEO 的区别是什么？" />
          </div>
          <div>
            <div style={labelStyle}>回答</div>
            <textarea value={f.answer} onChange={(e) => update(i, { answer: e.target.value })} style={areaStyle} placeholder="对问题的完整回答..." />
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
