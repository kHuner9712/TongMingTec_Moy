import { useState } from "react";
import { submitLead } from "../leadStorage";
import type { LeadFormData, FieldDef } from "../types";
import { C, small } from "../styles";

const FIELDS: FieldDef[] = [
  { name: "companyName", label: "公司名称", placeholder: "你的公司全称", required: true, type: "text", span: 1 },
  { name: "brandName", label: "品牌名称", placeholder: "需要诊断的品牌名", required: true, type: "text", span: 1 },
  { name: "website", label: "官网", placeholder: "https://", required: true, type: "url", span: 2 },
  { name: "industry", label: "行业", placeholder: "如 SaaS、制造业、教育等", required: true, type: "text", span: 1 },
  { name: "targetCity", label: "目标城市", placeholder: "主要服务城市或区域", required: false, type: "text", span: 1 },
  { name: "competitors", label: "主要竞品", placeholder: "你最关注的竞品品牌", required: false, type: "text", span: 2 },
  { name: "contactName", label: "联系人", placeholder: "你的姓名", required: true, type: "text", span: 1 },
  { name: "contactMethod", label: "手机/微信", placeholder: "联系方式", required: true, type: "text", span: 1 },
];

const INITIAL: LeadFormData = {
  companyName: "", brandName: "", website: "", industry: "",
  targetCity: "", competitors: "", contactName: "", contactMethod: "", notes: "",
};

function isValidUrl(s: string) {
  if (!/^https?:\/\/.+\..+/.test(s)) return false;
  try { new URL(s); return true; } catch { return false; }
}

export default function LeadForm() {
  /* ---------- state ---------- */
  const [form, setForm] = useState<LeadFormData>({ ...INITIAL });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  /* ---------- helpers ---------- */
  const set = (name: keyof LeadFormData, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof LeadFormData, string>> = {};
    FIELDS.forEach((f) => {
      if (f.required && !form[f.name].trim()) {
        errs[f.name] = `请填写${f.label}`;
      }
    });
    if (!errs.website && form.website.trim() && !isValidUrl(form.website.trim())) {
      errs.website = "请输入正确的网址格式，以 http:// 或 https:// 开头";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setResult(null);
    try {
      await submitLead(form);
      setResult("success");
      setForm({ ...INITIAL });
    } catch {
      setResult("error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- render ---------- */
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 6,
    border: "1px solid #d0d5dd", fontSize: 14, color: C.dark,
    background: C.white, boxSizing: "border-box",
  };

  return (
    <div>
      {result === "success" && (
        <div style={{ background: C.greenBg, border: "1px solid #c8e6d0", borderRadius: 10, padding: 40, textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: C.green, marginBottom: 8 }}>提交成功</h3>
          <p style={{ ...small, color: "#2a5a3a", margin: 0 }}>
            GEO 团队将在 1 个工作日内联系你。如需再次提交，请刷新页面。
          </p>
        </div>
      )}

      {result === "error" && (
        <div style={{ background: C.amberBg, border: "1px solid #f0d090", borderRadius: 10, padding: 16, textAlign: "center", marginBottom: 24 }}>
          <p style={{ ...small, color: C.amber, margin: 0 }}>提交失败，请稍后重试。如持续失败请联系我们。</p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
        {FIELDS.map((f) => (
          <div key={f.name} style={{ gridColumn: `span ${f.span}` }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: C.dark }}>
              {f.label}{f.required && <span style={{ color: "#c04040", marginLeft: 2 }}>*</span>}
            </label>
            <input
              value={form[f.name]}
              onChange={(ev) => set(f.name, ev.target.value)}
              placeholder={f.placeholder}
              style={{ ...inputStyle, borderColor: errors[f.name] ? "#c04040" : "#d0d5dd" }}
            />
            {errors[f.name] && (
              <p style={{ fontSize: 12, color: "#c04040", margin: "4px 0 0" }}>{errors[f.name]}</p>
            )}
          </div>
        ))}

        <div style={{ gridColumn: "span 2" }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: C.dark }}>
            备注（可选）
          </label>
          <textarea
            value={form.notes}
            onChange={(ev) => set("notes", ev.target.value)}
            placeholder="你想了解什么？有什么特别关注的方面？"
            rows={3}
            style={{
              ...inputStyle, resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ gridColumn: "span 2", paddingTop: 8 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "16px 0", background: C.blue, color: C.white,
              borderRadius: 8, border: "none", fontSize: 17, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "提交中..." : "提交预约"}
          </button>
          <p style={{ ...small, marginTop: 12, textAlign: "center" }}>
            提交即表示同意我们的隐私政策，信息仅用于 GEO 诊断沟通。
          </p>
        </div>
      </form>
    </div>
  );
}
