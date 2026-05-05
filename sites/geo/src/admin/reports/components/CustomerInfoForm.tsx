import { CustomerInfo } from "../reportTypes";

interface Props {
  value: CustomerInfo;
  onChange: (v: CustomerInfo) => void;
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5a6a7e", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 };

export default function CustomerInfoForm({ value, onChange }: Props) {
  const set = (k: keyof CustomerInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.value });

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#0d1b2a" }}>客户基础信息</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {(["companyName", "brandName", "website", "industry", "targetCity", "contactName"] as (keyof CustomerInfo)[]).map((k) => (
          <div key={k} style={k === "website" ? { gridColumn: "1 / -1" } : undefined}>
            <div style={labelStyle}>{LABELS[k]}</div>
            <input
              type={k === "website" ? "url" : "text"}
              value={value[k]}
              onChange={set(k)}
              placeholder={PLACEHOLDERS[k]}
              style={inputStyle}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const LABELS: Record<keyof CustomerInfo, string> = {
  companyName: "公司名称",
  brandName: "品牌名称",
  website: "官网",
  industry: "行业",
  targetCity: "目标城市",
  contactName: "联系人",
};

const PLACEHOLDERS: Record<keyof CustomerInfo, string> = {
  companyName: "如：桐鸣科技",
  brandName: "如：MOY",
  website: "https://...",
  industry: "如：SaaS",
  targetCity: "如：深圳",
  contactName: "客户联系人",
};
