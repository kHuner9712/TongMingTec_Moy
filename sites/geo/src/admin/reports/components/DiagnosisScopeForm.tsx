import { DiagnosisScope, ALL_PLATFORMS, Platform } from "../reportTypes";

interface Props {
  value: DiagnosisScope;
  onChange: (v: DiagnosisScope) => void;
}

const section: React.CSSProperties = { marginBottom: 24 };
const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5a6a7e", marginBottom: 4 };
const input: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 };
const textarea: React.CSSProperties = { ...input, resize: "vertical", minHeight: 80 };

export default function DiagnosisScopeForm({ value, onChange }: Props) {
  const togglePlatform = (p: Platform) => {
    const next = value.platforms.includes(p)
      ? value.platforms.filter((x) => x !== p)
      : [...value.platforms, p];
    onChange({ ...value, platforms: next });
  };

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#0d1b2a" }}>诊断范围</h3>

      <div style={section}>
        <div style={label}>诊断日期</div>
        <input
          type="date"
          value={value.diagnosisDate}
          onChange={(e) => onChange({ ...value, diagnosisDate: e.target.value })}
          style={{ ...input, width: "auto" }}
        />
      </div>

      <div style={section}>
        <div style={label}>测试平台</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALL_PLATFORMS.map((p) => (
            <label key={p} style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px",
              borderRadius: 6, border: `1px solid ${value.platforms.includes(p) ? "#0055cc" : "#d0d7de"}`,
              background: value.platforms.includes(p) ? "#e8f1ff" : "#fff",
              fontSize: 13, cursor: "pointer", fontWeight: value.platforms.includes(p) ? 600 : 400,
            }}>
              <input
                type="checkbox"
                checked={value.platforms.includes(p)}
                onChange={() => togglePlatform(p)}
                style={{ display: "none" }}
              />
              {p}
            </label>
          ))}
        </div>
      </div>

      <div style={section}>
        <div style={label}>主要竞品（每行一个）</div>
        <textarea
          value={value.competitors}
          onChange={(e) => onChange({ ...value, competitors: e.target.value })}
          placeholder="如：&#10;竞品A&#10;竞品B&#10;竞品C"
          style={textarea}
          rows={4}
        />
      </div>

      <div style={section}>
        <div style={label}>目标问题（每行一个）</div>
        <textarea
          value={value.targetQuestions}
          onChange={(e) => onChange({ ...value, targetQuestions: e.target.value })}
          placeholder={'如：&#10;"XX行业有哪些好的服务商？"&#10;"XX品牌怎么样？"&#10;"哪个XX比较好？"'}
          style={textarea}
          rows={5}
        />
      </div>
    </div>
  );
}
