import { useState } from "react";
import { C, sans } from "../../styles";
import { getToken, setToken } from "../geoAdminApi";

export default function AdminHeader() {
  const [hasToken, setHasToken] = useState(!!getToken());
  const [showForm, setShowForm] = useState(false);
  const [input, setInput] = useState("");

  const handleSet = () => {
    setToken(input.trim());
    setHasToken(true);
    setShowForm(false);
    setInput("");
  };

  const handleClear = () => {
    setToken("");
    setHasToken(false);
    setShowForm(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{
        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 10,
        color: hasToken ? C.green : C.amber,
        background: hasToken ? C.greenBg : C.amberBg,
        fontFamily: sans,
      }}>
        {hasToken ? "已设置管理员令牌" : "未设置管理员令牌"}
      </span>

      {hasToken ? (
        <button onClick={handleClear} style={btnStyle}>
          清除 Token
        </button>
      ) : (
        <button onClick={() => setShowForm(!showForm)} style={btnStyle}>
          设置 Token
        </button>
      )}

      <button onClick={() => setShowForm(!showForm)} style={{ ...btnStyle, background: "#f0f2f5", color: C.gray }}>
        {showForm ? "收起" : hasToken ? "更新 Token" : ""}
      </button>

      {showForm && (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴管理员令牌..."
            style={{
              padding: "6px 10px", border: `1px solid ${C.grayLight}`, borderRadius: 4,
              fontSize: 12, width: 200, fontFamily: sans,
            }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSet(); }}
          />
          <button onClick={handleSet} style={{ ...btnStyle, background: C.blue, color: "#fff" }}>
            确定
          </button>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "5px 12px",
  border: "none",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: sans,
  background: C.grayLight,
  color: C.gray,
};
