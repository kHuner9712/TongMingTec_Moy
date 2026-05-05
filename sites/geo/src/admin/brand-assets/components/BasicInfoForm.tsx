import { BasicInfo } from "../brandAssetTypes";

interface Props {
  value: BasicInfo;
  onChange: (v: BasicInfo) => void;
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5a6a7e", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 };

const FIELDS: { key: keyof BasicInfo; label: string; placeholder: string; wide?: boolean }[] = [
  { key: "companyName", label: "公司名称", placeholder: "如：桐鸣科技" },
  { key: "brandName", label: "品牌名称", placeholder: "如：MOY" },
  { key: "website", label: "官网", placeholder: "https://...", wide: true },
  { key: "industry", label: "行业", placeholder: "如：SaaS" },
  { key: "targetCity", label: "目标城市", placeholder: "如：深圳" },
  { key: "foundedYear", label: "成立年份", placeholder: "如：2020" },
  { key: "headquarters", label: "总部", placeholder: "如：广东省深圳市" },
  { key: "contactInfo", label: "联系信息", placeholder: "对接人 / 联系方式" },
];

export default function BasicInfoForm({ value, onChange }: Props) {
  const set = (k: keyof BasicInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.value });

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#0d1b2a" }}>基础信息</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {FIELDS.map((f) => (
          <div key={f.key} style={f.wide ? { gridColumn: "1 / -1" } : undefined}>
            <div style={labelStyle}>{f.label}</div>
            <input
              type={f.key === "website" ? "url" : "text"}
              value={value[f.key]}
              onChange={set(f.key)}
              placeholder={f.placeholder}
              style={inputStyle}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
