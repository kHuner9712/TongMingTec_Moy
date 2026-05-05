import { useState, useEffect } from "react";
import { getToken, setToken, clearToken as doClear } from "../geoAdminApi";

export default function AdminTokenPanel() {
  const [value, setValue] = useState(getToken() || "");
  const [saved, setSaved] = useState(!!getToken());

  useEffect(() => {
    setValue(getToken() || "");
    setSaved(!!getToken());
  }, []);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed) {
      setToken(trimmed);
      setSaved(true);
    }
  };

  const handleClear = () => {
    doClear();
    setValue("");
    setSaved(false);
  };

  return (
    <div style={{
      background: "#f7f9fb",
      border: "1px solid #e8ecf1",
      borderRadius: 8,
      padding: "14px 18px",
      marginBottom: 24,
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#5a6a7e", whiteSpace: "nowrap" }}>
        管理员访问令牌
      </span>
      <input
        type="password"
        placeholder="粘贴 JWT Token..."
        value={value}
        onChange={(e) => { setValue(e.target.value); setSaved(false); }}
        style={{
          flex: 1,
          minWidth: 200,
          padding: "6px 12px",
          border: "1px solid #d0d7de",
          borderRadius: 6,
          fontSize: 13,
          fontFamily: "monospace",
        }}
      />
      <button onClick={handleSave} style={btnSmall}>保存</button>
      {saved && (
        <button onClick={handleClear} style={{ ...btnSmall, background: "#ffebee", color: "#c62828", border: "1px solid #ef9a9a" }}>
          清除
        </button>
      )}
      <span style={{ fontSize: 11, color: "#8a9aaa", marginLeft: "auto" }}>
        临时方案，后续接入统一登录
      </span>
    </div>
  );
}

const btnSmall: React.CSSProperties = {
  padding: "6px 14px",
  border: "1px solid #d0d7de",
  borderRadius: 6,
  background: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
