import { TestRecord, Sentiment, Accuracy, Platform, ALL_PLATFORMS } from "../reportTypes";

interface Props {
  records: TestRecord[];
  onChange: (v: TestRecord[]) => void;
}

const sentOptions: Sentiment[] = ["正向", "中性", "负向", "未提及"];
const accOptions: Accuracy[] = ["准确", "部分准确", "不准确", "无法判断"];
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5a6a7e", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "6px 10px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13 };

function emptyRecord(): TestRecord {
  return {
    question: "", platform: "", brandMentioned: false, brandDescription: "",
    competitorsMentioned: "", sentiment: "未提及", accuracy: "无法判断", notes: "",
  };
}

export default function TestResultEditor({ records, onChange }: Props) {
  const update = (i: number, patch: Partial<TestRecord>) => {
    const next = [...records];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0d1b2a", margin: 0 }}>AI 回答测试结果</h3>
        <button onClick={() => onChange([...records, emptyRecord()])} style={btnStyle}>
          + 新增测试记录
        </button>
      </div>

      {records.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: "#8a9aaa", border: "1px dashed #d0d7de", borderRadius: 8, marginBottom: 12 }}>
          暂无测试记录，点击上方按钮开始添加
        </div>
      )}

      {records.map((r, i) => (
        <div key={i} style={{ border: "1px solid #e8ecf1", borderRadius: 8, padding: 14, marginBottom: 12, background: "#f7f9fb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5a6a7e" }}>记录 #{i + 1}</span>
            <button onClick={() => onChange(records.filter((_, j) => j !== i))} style={{ ...btnStyle, color: "#c62828", border: "1px solid #ef9a9a" }}>
              删除
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={labelStyle}>问题</div>
              <input value={r.question} onChange={(e) => update(i, { question: e.target.value })} style={inputStyle} placeholder="如：哪个CRM好用？" />
            </div>
            <div>
              <div style={labelStyle}>平台</div>
              <select value={r.platform} onChange={(e) => update(i, { platform: e.target.value as Platform | "" })} style={inputStyle}>
                <option value="">选择平台</option>
                {ALL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
            <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <input type="checkbox" checked={r.brandMentioned} onChange={(e) => update(i, { brandMentioned: e.target.checked })} />
              提及本品牌
            </label>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={labelStyle}>品牌描述</div>
            <input value={r.brandDescription} onChange={(e) => update(i, { brandDescription: e.target.value })} style={inputStyle} placeholder="AI 如何描述该品牌？" />
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={labelStyle}>提及的竞品</div>
            <input value={r.competitorsMentioned} onChange={(e) => update(i, { competitorsMentioned: e.target.value })} style={inputStyle} placeholder="AI 同时提到了哪些竞品？" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            <div>
              <div style={labelStyle}>情感倾向</div>
              <select value={r.sentiment} onChange={(e) => update(i, { sentiment: e.target.value as Sentiment })} style={inputStyle}>
                {sentOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div style={labelStyle}>准确性</div>
              <select value={r.accuracy} onChange={(e) => update(i, { accuracy: e.target.value as Accuracy })} style={inputStyle}>
                {accOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={labelStyle}>备注</div>
            <input value={r.notes} onChange={(e) => update(i, { notes: e.target.value })} style={inputStyle} placeholder="补充说明（可选）" />
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
