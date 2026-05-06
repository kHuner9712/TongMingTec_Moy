import React, { useState } from "react";
import { adminApi } from "../apiHubAdminApi";
import { ApiProviderConfigDTO } from "../apiConsoleTypes";
import { C } from "../../styles";

const panel: React.CSSProperties = { background: C.white, borderRadius: 10, border: "1px solid #e4e8ed", padding: "20px 24px", marginBottom: 16 };
const inp: React.CSSProperties = { width: "100%", padding: "6px 10px", fontSize: 12, border: "1px solid #d0d5dd", borderRadius: 6, outline: "none", boxSizing: "border-box", marginBottom: 6 };
const btn: React.CSSProperties = { padding: "6px 14px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", marginRight: 8 };

interface Props {
  providerConfigs: ApiProviderConfigDTO[];
  onRefresh: () => void;
}

export default function ProviderConfigPanel({ providerConfigs, onRefresh }: Props) {
  const [form, setForm] = useState({ provider: "", displayName: "", baseUrl: "", apiKeyEnvName: "", timeoutMs: "60000" });
  const [error, setError] = useState("");

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const create = async () => {
    if (!form.provider.trim() || !form.displayName.trim() || !form.baseUrl.trim() || !form.apiKeyEnvName.trim()) return;
    setError("");
    try {
      await adminApi.providerConfigs.create({
        provider: form.provider.trim(),
        displayName: form.displayName.trim(),
        baseUrl: form.baseUrl.trim(),
        apiKeyEnvName: form.apiKeyEnvName.trim(),
        timeoutMs: +form.timeoutMs,
      });
      setForm({ provider: "", displayName: "", baseUrl: "", apiKeyEnvName: "", timeoutMs: "60000" });
      onRefresh();
    } catch (e: any) { setError(e?.data?.message || "创建失败"); }
  };

  const remove = async (provider: string) => {
    setError("");
    try { await adminApi.providerConfigs.remove(provider); onRefresh(); } catch (e: any) { setError(e?.data?.message || "删除失败"); }
  };

  return (
    <div style={panel}>
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px" }}>Provider Config 管理</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px" }}>
          <input style={inp} value={form.provider} onChange={e => update("provider", e.target.value)} placeholder="provider (deepseek / openai)" />
          <input style={inp} value={form.displayName} onChange={e => update("displayName", e.target.value)} placeholder="显示名称" />
          <input style={inp} value={form.baseUrl} onChange={e => update("baseUrl", e.target.value)} placeholder="baseUrl" />
          <input style={inp} value={form.apiKeyEnvName} onChange={e => update("apiKeyEnvName", e.target.value)} placeholder="apiKeyEnvName (如 DEEPSEEK_API_KEY)" />
          <input style={inp} value={form.timeoutMs} onChange={e => update("timeoutMs", e.target.value)} placeholder="timeoutMs" />
          <button style={{ ...btn, background: C.brand, color: C.white }} onClick={create}>创建 Provider Config</button>
          {error && <p style={{ fontSize: 12, color: C.red, marginTop: 4 }}>{error}</p>}
        </div>
        <div style={{ flex: "2 1 300px" }}>
          <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #e4e8ed", borderRadius: 6 }}>
            {providerConfigs.length === 0 && <p style={{ padding: 12, fontSize: 13, color: C.gray, margin: 0 }}>暂无 Provider Config</p>}
            {providerConfigs.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #eaedf2", fontSize: 12 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{c.displayName}</span>
                  <code style={{ marginLeft: 8, fontSize: 11, background: C.grayLt, padding: "1px 4px", borderRadius: 3 }}>{c.provider}</code>
                  <span style={{ marginLeft: 8, padding: "1px 6px", borderRadius: 4, fontSize: 10, background: c.status === "active" ? C.greenBg : C.amberBg, color: c.status === "active" ? C.green : C.amber }}>{c.status}</span>
                  <span style={{ marginLeft: 4, fontSize: 10, color: C.gray }}>env: {c.apiKeyEnvName}</span>
                </div>
                <button style={{ ...btn, background: C.red + "15", color: C.red, padding: "3px 8px", fontSize: 11 }} onClick={() => remove(c.provider)}>删除</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
