import { Summary } from "../reportTypes";

interface Props {
  value: Summary;
  onChange: (v: Summary) => void;
}

const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5a6a7e", marginBottom: 4 };
const textarea: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14, resize: "vertical", minHeight: 80 };

export default function SummaryForm({ value, onChange }: Props) {
  const set = (k: keyof Summary) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...value, [k]: e.target.value });
  };

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#0d1b2a" }}>初步判断与建议</h3>

      {([
        ["visibilitySummary", "可见度总结", "如：当前品牌在 ChatGPT 和 Kimi 中未被提及，豆包中描述模糊..."],
        ["mainProblems", "主要问题", "如：1. 官网 Schema 标记缺失，AI 无法有效抓取...&#10;2. 竞品 A 在多个平台被优先推荐..."],
        ["opportunities", "优化机会", "如：1. 补充品牌事实资产包可提升 3 个平台的可见度...&#10;2. 目标城市本地相关问题未覆盖..."],
        ["recommendedActions", "建议执行动作", "如：1. 两周内完成官网 Schema 结构化标记...&#10;2. 生产 5 篇 FAQ 内容涵盖核心问题..."],
      ] as [keyof Summary, string, string][]).map(([k, title, placeholder]) => (
        <div key={k} style={{ marginBottom: 14 }}>
          <div style={label}>{title}</div>
          <textarea
            value={value[k]}
            onChange={set(k)}
            placeholder={placeholder}
            style={textarea}
            rows={4}
          />
        </div>
      ))}
    </div>
  );
}
