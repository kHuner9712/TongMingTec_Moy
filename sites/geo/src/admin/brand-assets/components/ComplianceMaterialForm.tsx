import { ComplianceMaterials } from "../brandAssetTypes";

interface Props {
  value: ComplianceMaterials;
  onChange: (v: ComplianceMaterials) => void;
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5a6a7e", marginBottom: 4 };
const areaStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14,
  resize: "vertical" as const, minHeight: 100, fontFamily: "inherit",
};

export default function ComplianceMaterialForm({ value, onChange }: Props) {
  const set = (k: keyof ComplianceMaterials) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: e.target.value });

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#0d1b2a" }}>合规材料</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={labelStyle}>可公开引用材料</div>
          <textarea
            value={value.publicMaterials}
            onChange={set("publicMaterials")}
            placeholder={"每行一个：\n- 官网链接\n- 公众号文章\n- 新闻稿\n- 案例链接\n- 客户评价授权材料"}
            style={areaStyle}
          />
        </div>
        <div>
          <div style={labelStyle}>禁止使用材料</div>
          <textarea
            value={value.forbiddenMaterials}
            onChange={set("forbiddenMaterials")}
            placeholder={"每行一个：\n- 未公开客户名称\n- 未授权案例\n- 不允许宣传的效果\n- 敏感数据"}
            style={{ ...areaStyle, borderColor: "#ef9a9a" }}
          />
        </div>
      </div>
    </div>
  );
}
