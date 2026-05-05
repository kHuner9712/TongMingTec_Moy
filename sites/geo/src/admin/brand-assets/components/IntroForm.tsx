import { CompanyIntro } from "../brandAssetTypes";

interface Props {
  value: CompanyIntro;
  onChange: (v: CompanyIntro) => void;
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5a6a7e", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 };
const areaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical" as const, minHeight: 80, fontFamily: "inherit" };

export default function IntroForm({ value, onChange }: Props) {
  const set = (k: keyof CompanyIntro) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: e.target.value });

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#0d1b2a" }}>公司标准介绍</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={labelStyle}>一句话介绍</div>
          <input
            value={value.oneSentenceIntro}
            onChange={set("oneSentenceIntro")}
            placeholder="如：桐鸣科技是一家专注于 AI 原生企业级系统的科技公司"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={labelStyle}>100 字简介</div>
          <textarea
            value={value.shortIntro}
            onChange={set("shortIntro")}
            placeholder="约 100 字的品牌简介，用于 AI 模型摘要引用..."
            style={areaStyle}
          />
        </div>
        <div>
          <div style={labelStyle}>500 字详细介绍</div>
          <textarea
            value={value.fullIntro}
            onChange={set("fullIntro")}
            placeholder="约 500 字的完整品牌介绍，涵盖成立背景、主营业务、技术优势、服务模式等..."
            style={{ ...areaStyle, minHeight: 140 }}
          />
        </div>
      </div>
    </div>
  );
}
