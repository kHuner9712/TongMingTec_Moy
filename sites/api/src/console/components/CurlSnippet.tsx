import React from "react";
import { getTestKey } from "../consoleStorage";
import { C } from "../../styles";

const terminal: React.CSSProperties = {
  background: C.terminal, borderRadius: 8, padding: "16px 20px", fontFamily: "monospace", fontSize: 13, lineHeight: 1.7, color: C.termFg, overflowX: "auto", position: "relative",
};

interface Props {
  model?: string;
  messages?: string;
}

export default function CurlSnippet({ model = "moy-mock-chat", messages = "Hello MOY API" }: Props) {
  const key = getTestKey() || "$MOY_API_KEY";
  const body = JSON.stringify({ model, messages: [{ role: "user", content: messages }] });
  const curl = `curl http://localhost:3001/v1/chat/completions \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '${body}'`;

  const copy = () => { navigator.clipboard.writeText(curl).catch(() => {}); };

  return (
    <div style={{ position: "relative" }}>
      <pre style={terminal}>
        <span style={{ color: "#8899aa" }}>$</span> curl <span style={{ color: C.termAc }}>http://localhost:3001/v1/chat/completions</span> \
        {"\n"}  -H <span style={{ color: "#c0a060" }}>"Authorization: Bearer {key}"</span> \
        {"\n"}  -H <span style={{ color: "#c0a060" }}>"Content-Type: application/json"</span> \
        {"\n"}  -d <span style={{ color: "#c0a060" }}>'{body}'</span>
      </pre>
      <button
        onClick={copy}
        style={{ position: "absolute", top: 8, right: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, border: "none", borderRadius: 4, background: C.brand, color: C.white, cursor: "pointer" }}
      >复制</button>
    </div>
  );
}
