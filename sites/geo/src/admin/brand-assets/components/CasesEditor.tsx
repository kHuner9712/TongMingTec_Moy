import { CaseItem } from "../brandAssetTypes";

interface Props {
  value: CaseItem[];
  onChange: (v: CaseItem[]) => void;
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5a6a7e", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "6px 10px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13 };
const areaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical" as const, minHeight: 60, fontFamily: "inherit" };

function emptyItem(): CaseItem {
  return { customerName: "", industry: "", problem: "", solution: "", result: "", canPublicize: false };
}

export default function CasesEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<CaseItem>) => {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0d1b2a", margin: 0 }}>成功案例</h3>
        <button onClick={() => onChange([...value, emptyItem()])} style={btnStyle}>
          + 新增案例
        </button>
      </div>

      {value.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: "#8a9aaa", border: "1px dashed #d0d7de", borderRadius: 8, marginBottom: 12 }}>
          暂无成功案例，点击上方按钮开始添加
        </div>
      )}

      {value.map((c, i) => (
        <div key={i} style={{ border: "1px solid #e8ecf1", borderRadius: 8, padding: 14, marginBottom: 12, background: "#f7f9fb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5a6a7e" }}>案例 #{i + 1}</span>
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ ...btnStyle, color: "#c62828", border: "1px solid #ef9a9a" }}>
              删除
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={labelStyle}>客户名称</div>
              <input value={c.customerName} onChange={(e) => update(i, { customerName: e.target.value })} style={inputStyle} placeholder="客户公司/品牌名" />
            </div>
            <div>
              <div style={labelStyle}>行业</div>
              <input value={c.industry} onChange={(e) => update(i, { industry: e.target.value })} style={inputStyle} placeholder="客户所属行业" />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <input type="checkbox" checked={c.canPublicize} onChange={(e) => update(i, { canPublicize: e.target.checked })} />
              可公开
            </label>
            <span style={{ fontSize: 11, color: "#8a9aaa" }}>{c.canPublicize ? "此案例可用于对外展示" : "仅用于内部，不可对外公开"}</span>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={labelStyle}>问题</div>
            <textarea value={c.problem} onChange={(e) => update(i, { problem: e.target.value })} style={areaStyle} placeholder="客户遇到了什么问题？" />
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={labelStyle}>方案</div>
            <textarea value={c.solution} onChange={(e) => update(i, { solution: e.target.value })} style={areaStyle} placeholder="我们如何解决？" />
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={labelStyle}>效果</div>
            <textarea value={c.result} onChange={(e) => update(i, { result: e.target.value })} style={areaStyle} placeholder="取得了什么效果？" />
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
