import React, { useState } from "react";
import { getAdminToken, setAdminToken, clearAdminToken, getTestKey, setTestKey, clearTestKey } from "../consoleStorage";
import { C } from "../../styles";

const panel: React.CSSProperties = {
  background: C.white,
  borderRadius: 10,
  border: "1px solid #e4e8ed",
  padding: "20px 24px",
  marginBottom: 16,
};

const label: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: C.gray,
  marginBottom: 6,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  fontSize: 13,
  fontFamily: "monospace",
  border: "1px solid #d0d5dd",
  borderRadius: 6,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 8,
};

const btn: React.CSSProperties = {
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 600,
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  marginRight: 8,
};

const hint: React.CSSProperties = {
  fontSize: 12,
  color: C.amber,
  marginTop: 8,
  padding: "8px 12px",
  background: C.amberBg,
  borderRadius: 6,
};

interface Props {
  onTokenChange: () => void;
}

export default function ConsoleTokenPanel({ onTokenChange }: Props) {
  const [adminToken, setAdminTokenLocal] = useState(getAdminToken());
  const [testKey, setTestKeyLocal] = useState(getTestKey());

  return (
    <div style={panel}>
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 4px" }}>Token 设置</h2>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <p style={label}>MOY Admin JWT</p>
          <input
            style={input}
            value={adminToken}
            onChange={e => setAdminTokenLocal(e.target.value)}
            placeholder="输入 MOY JWT Token..."
          />
          <div>
            <button style={{ ...btn, background: C.brand, color: C.white }} onClick={() => { setAdminToken(adminToken); onTokenChange(); }}>保存</button>
            <button style={{ ...btn, background: C.grayLt, color: C.dark }} onClick={() => { clearAdminToken(); setAdminTokenLocal(""); onTokenChange(); }}>清除</button>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <p style={label}>API Key (用于测试调用)</p>
          <input
            style={input}
            value={testKey}
            onChange={e => setTestKeyLocal(e.target.value)}
            placeholder="输入 API Key: moy_sk_..."
          />
          <div>
            <button style={{ ...btn, background: C.green, color: C.white }} onClick={() => setTestKey(testKey)}>保存</button>
            <button style={{ ...btn, background: C.grayLt, color: C.dark }} onClick={() => { clearTestKey(); setTestKeyLocal(""); }}>清除</button>
          </div>
        </div>
      </div>

      <p style={hint}>当前为内部调试控制台，后续接入统一登录。</p>
    </div>
  );
}
