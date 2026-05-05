import { ServiceItem } from "../brandAssetTypes";

interface Props {
  value: ServiceItem[];
  onChange: (v: ServiceItem[]) => void;
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5a6a7e", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "6px 10px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13 };
const areaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical" as const, minHeight: 60, fontFamily: "inherit" };

function emptyItem(): ServiceItem {
  return { name: "", targetUsers: "", painPoints: "", coreValue: "", deliverables: "", priceRange: "", serviceProcess: "" };
}

export default function ServiceItemsEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<ServiceItem>) => {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0d1b2a", margin: 0 }}>产品与服务</h3>
        <button onClick={() => onChange([...value, emptyItem()])} style={btnStyle}>
          + 新增服务
        </button>
      </div>

      {value.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: "#8a9aaa", border: "1px dashed #d0d7de", borderRadius: 8, marginBottom: 12 }}>
          暂无服务项，点击上方按钮开始添加
        </div>
      )}

      {value.map((s, i) => (
        <div key={i} style={{ border: "1px solid #e8ecf1", borderRadius: 8, padding: 14, marginBottom: 12, background: "#f7f9fb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5a6a7e" }}>服务 #{i + 1}</span>
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ ...btnStyle, color: "#c62828", border: "1px solid #ef9a9a" }}>
              删除
            </button>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={labelStyle}>服务名称</div>
            <input value={s.name} onChange={(e) => update(i, { name: e.target.value })} style={inputStyle} placeholder="如：品牌 AI 可见度诊断" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={labelStyle}>目标用户</div>
              <input value={s.targetUsers} onChange={(e) => update(i, { targetUsers: e.target.value })} style={inputStyle} placeholder="哪些企业/人需要？" />
            </div>
            <div>
              <div style={labelStyle}>解决痛点</div>
              <input value={s.painPoints} onChange={(e) => update(i, { painPoints: e.target.value })} style={inputStyle} placeholder="解决什么问题？" />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={labelStyle}>核心价值</div>
            <textarea value={s.coreValue} onChange={(e) => update(i, { coreValue: e.target.value })} style={areaStyle} placeholder="对客户的核心价值是什么？" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            <div>
              <div style={labelStyle}>交付物</div>
              <input value={s.deliverables} onChange={(e) => update(i, { deliverables: e.target.value })} style={inputStyle} placeholder="如：诊断报告 PDF" />
            </div>
            <div>
              <div style={labelStyle}>价格区间</div>
              <input value={s.priceRange} onChange={(e) => update(i, { priceRange: e.target.value })} style={inputStyle} placeholder="如：¥3,980-¥30,000/月" />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={labelStyle}>服务流程</div>
            <textarea value={s.serviceProcess} onChange={(e) => update(i, { serviceProcess: e.target.value })} style={areaStyle} placeholder="服务开展的步骤..." />
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
