import React, { useState } from "react";
import { adminApi } from "../apiHubAdminApi";
import { ApiModelDTO } from "../apiConsoleTypes";
import { C } from "../../styles";

const panel: React.CSSProperties = { background: C.white, borderRadius: 10, border: "1px solid #e4e8ed", padding: "20px 24px", marginBottom: 16 };
const inp: React.CSSProperties = { width: "100%", padding: "6px 10px", fontSize: 12, border: "1px solid #d0d5dd", borderRadius: 6, outline: "none", boxSizing: "border-box", marginBottom: 6 };
const btn: React.CSSProperties = { padding: "6px 14px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", marginRight: 8 };
const chk: React.CSSProperties = { marginRight: 4 };

interface Props {
  models: ApiModelDTO[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  onRefresh: () => void;
}

export default function ModelPanel({ models, selectedModelId, onSelectModel, onRefresh }: Props) {
  const [form, setForm] = useState({ name: "", modelId: "moy-mock-chat", provider: "moy", status: "public", category: "text", maxInputTokens: "", maxOutputTokens: "", upstreamModel: "", supportsStreaming: false, supportsVision: false, supportsFunctionCalling: false });
  const [error, setError] = useState("");

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const create = async () => {
    if (!form.name.trim() || !form.modelId.trim()) return;
    setError("");
    try {
      await adminApi.models.create({
        name: form.name.trim(),
        modelId: form.modelId.trim(),
        provider: form.provider.trim() || "moy",
        status: form.status,
        category: form.category,
        maxInputTokens: form.maxInputTokens ? +form.maxInputTokens : null,
        maxOutputTokens: form.maxOutputTokens ? +form.maxOutputTokens : null,
        supportsStreaming: form.supportsStreaming,
        supportsVision: form.supportsVision,
        supportsFunctionCalling: form.supportsFunctionCalling,
        upstreamModel: form.upstreamModel.trim() || null,
      });
      setForm({ name: "", modelId: "moy-mock-chat", provider: "moy", status: "public", category: "text", maxInputTokens: "", maxOutputTokens: "", upstreamModel: "", supportsStreaming: false, supportsVision: false, supportsFunctionCalling: false });
      onRefresh();
    } catch (e: any) { setError(e?.data?.message || "创建失败"); }
  };

  return (
    <div style={panel}>
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px" }}>Model 管理</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px" }}>
          <input style={inp} value={form.name} onChange={e => update("name", e.target.value)} placeholder="名称" />
          <input style={inp} value={form.modelId} onChange={e => update("modelId", e.target.value)} placeholder="modelId" />
          <input style={inp} value={form.provider} onChange={e => update("provider", e.target.value)} placeholder="provider (推荐: __mock__ / deepseek)" />
          <div style={{ fontSize: 11, color: C.gray, marginBottom: 6 }}>
            mock: <code>__mock__</code> · <code>mock</code> · <code>moy</code> &nbsp;|&nbsp; 真实: <code>deepseek</code>
          </div>
          <select style={inp} value={form.status} onChange={e => update("status", e.target.value)}>
            <option value="public">public</option>
            <option value="internal">internal</option>
            <option value="deprecated">deprecated</option>
          </select>
          <input style={{ ...inp, width: "48%", marginRight: "4%" }} value={form.maxInputTokens} onChange={e => update("maxInputTokens", e.target.value)} placeholder="maxInputTokens" />
          <input style={{ ...inp, width: "48%" }} value={form.maxOutputTokens} onChange={e => update("maxOutputTokens", e.target.value)} placeholder="maxOutputTokens" />
          <input style={inp} value={form.upstreamModel} onChange={e => update("upstreamModel", e.target.value)} placeholder="upstreamModel (真实 provider 模型名)" />
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            <label><input type="checkbox" style={chk} checked={form.supportsStreaming} onChange={e => update("supportsStreaming", e.target.checked)} />Streaming</label>
            <label style={{ marginLeft: 8 }}><input type="checkbox" style={chk} checked={form.supportsVision} onChange={e => update("supportsVision", e.target.checked)} />Vision</label>
            <label style={{ marginLeft: 8 }}><input type="checkbox" style={chk} checked={form.supportsFunctionCalling} onChange={e => update("supportsFunctionCalling", e.target.checked)} />FuncCall</label>
          </div>
          <button style={{ ...btn, background: C.brand, color: C.white }} onClick={create}>创建 Model</button>
          {error && <p style={{ fontSize: 12, color: C.red, marginTop: 4 }}>{error}</p>}
        </div>
        <div style={{ flex: "2 1 300px" }}>
          <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #e4e8ed", borderRadius: 6 }}>
            {models.length === 0 && <p style={{ padding: 12, fontSize: 13, color: C.gray, margin: 0 }}>暂无 Model</p>}
            {models.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #eaedf2", fontSize: 12 }}>
                <div>
                  <span style={{ fontWeight: 600, cursor: "pointer", color: m.id === selectedModelId ? C.brand : C.dark }} onClick={() => onSelectModel(m.id)}>{m.name}</span>
                  <span style={{ marginLeft: 6, color: C.gray }}>{m.modelId}</span>
                  <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 4, fontSize: 10, background: C.brandBg, color: C.brand }}>{m.provider}</span>
                  {m.upstreamModel && <span style={{ marginLeft: 4, fontSize: 10, color: C.gray }}>→ {m.upstreamModel}</span>}
                </div>
                <span style={{ fontSize: 10, color: C.gray }}>{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
