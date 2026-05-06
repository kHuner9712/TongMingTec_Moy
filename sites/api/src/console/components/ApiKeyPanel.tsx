import React, { useState } from "react";
import { adminApi } from "../apiHubAdminApi";
import { ApiKeySafeDTO, ApiKeyCreatedDTO } from "../apiConsoleTypes";
import { setTestKey } from "../consoleStorage";
import { C } from "../../styles";

const panel: React.CSSProperties = { background: C.white, borderRadius: 10, border: "1px solid #e4e8ed", padding: "20px 24px", marginBottom: 16 };
const inp: React.CSSProperties = { width: "100%", padding: "6px 10px", fontSize: 12, border: "1px solid #d0d5dd", borderRadius: 6, outline: "none", boxSizing: "border-box", marginBottom: 6 };
const btn: React.CSSProperties = { padding: "6px 14px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", marginRight: 8 };

interface Props {
  selectedProjectId: string;
  keys: ApiKeySafeDTO[];
  onRefresh: () => void;
}

export default function ApiKeyPanel({ selectedProjectId, keys, onRefresh }: Props) {
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<ApiKeyCreatedDTO | null>(null);
  const [error, setError] = useState("");

  const create = async () => {
    if (!selectedProjectId || !keyName.trim()) return;
    setError(""); setNewKey(null);
    try {
      const r = await adminApi.keys.create(selectedProjectId, { name: keyName.trim() }) as ApiKeyCreatedDTO;
      setNewKey(r);
      setKeyName("");
      onRefresh();
    } catch (e: any) { setError(e?.data?.message || "创建 Key 失败"); }
  };

  const revoke = async (keyId: string) => {
    setError("");
    try { await adminApi.keys.revoke(selectedProjectId, keyId); onRefresh(); } catch (e: any) { setError(e?.data?.message || "吊销失败"); }
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text).catch(() => {}); };

  return (
    <div style={panel}>
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px" }}>API Key 管理</h2>
      {!selectedProjectId ? (
        <p style={{ fontSize: 13, color: C.gray, margin: 0 }}>请先选择一个 Project</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <input style={{ ...inp, flex: 1, minWidth: 150 }} value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="Key 名称" />
            <button style={{ ...btn, background: C.brand, color: C.white }} onClick={create}>创建 API Key</button>
          </div>

          {newKey && (
            <div style={{ marginBottom: 12, padding: "12px", background: C.greenBg, borderRadius: 8, border: "1px solid #c8e6d0" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.green, margin: "0 0 6px" }}>Key 创建成功！（仅显示一次）</p>
              <code style={{ display: "block", padding: "8px 12px", background: "#fff", borderRadius: 4, fontSize: 12, fontFamily: "monospace", wordBreak: "break-all", marginBottom: 8 }}>{newKey.key}</code>
              <button style={{ ...btn, background: C.green, color: C.white, padding: "4px 10px", fontSize: 12 }} onClick={() => copyText(newKey.key)}>复制 Key</button>
              <button style={{ ...btn, background: C.brand, color: C.white, padding: "4px 10px", fontSize: 12 }} onClick={() => { setTestKey(newKey.key); setNewKey(null); }}>一键用于测试调用</button>
            </div>
          )}

          <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e4e8ed", borderRadius: 6 }}>
            {keys.length === 0 && <p style={{ padding: 12, fontSize: 13, color: C.gray, margin: 0 }}>暂无 API Key</p>}
            {keys.map(k => (
              <div key={k.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #eaedf2", fontSize: 12 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{k.name}</span>
                  <code style={{ marginLeft: 8, fontSize: 11, background: C.grayLt, padding: "1px 4px", borderRadius: 3 }}>{k.keyPrefix}...</code>
                  <span style={{ marginLeft: 8, padding: "1px 6px", borderRadius: 4, fontSize: 10, background: k.status === "active" ? C.greenBg : C.amberBg, color: k.status === "active" ? C.green : C.amber }}>{k.status}</span>
                </div>
                <span>
                  {k.lastUsedAt && <span style={{ fontSize: 10, color: C.gray, marginRight: 8 }}>{new Date(k.lastUsedAt).toLocaleDateString()}</span>}
                  {k.status === "active" && <button style={{ ...btn, background: C.red + "15", color: C.red, padding: "3px 8px", fontSize: 11 }} onClick={() => revoke(k.id)}>吊销</button>}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      {error && <p style={{ fontSize: 12, color: C.red, marginTop: 4 }}>{error}</p>}
    </div>
  );
}
