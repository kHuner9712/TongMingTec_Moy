import React, { useState } from "react";
import { openaiApi } from "../openaiTestApi";
import { C } from "../../styles";

const panel: React.CSSProperties = { background: C.white, borderRadius: 10, border: "1px solid #e4e8ed", padding: "20px 24px", marginBottom: 16 };
const btn: React.CSSProperties = { padding: "6px 14px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", marginRight: 8 };
const textarea: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 13, border: "1px solid #d0d5dd", borderRadius: 6, outline: "none", boxSizing: "border-box", marginBottom: 8,
  fontFamily: "monospace", minHeight: 60, resize: "vertical",
};
const preStyle: React.CSSProperties = {
  background: C.terminal, borderRadius: 8, padding: "12px 16px", fontFamily: "monospace", fontSize: 12, lineHeight: 1.6, color: C.termFg, overflowX: "auto", maxHeight: 300, overflowY: "auto", marginTop: 8,
};

interface Props {
  selectedModelId: string;
  modelIdStr: string;
}

export default function OpenAiTestPanel({ selectedModelId, modelIdStr }: Props) {
  const [message, setMessage] = useState("Hello MOY API");
  const [modelsResult, setModelsResult] = useState<any>(null);
  const [chatResult, setChatResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  const testModels = async () => {
    setLoading("models"); setError(""); setModelsResult(null);
    try {
      const r = await openaiApi.listModels();
      setModelsResult(r);
    } catch (e: any) {
      setError(`models: ${e?.status} ${e?.data?.error?.code || e?.data?.error?.message || e?.data?.message || ""}`);
    }
    setLoading("");
  };

  const testChat = async () => {
    if (!modelIdStr || !message.trim()) return;
    setLoading("chat"); setError(""); setChatResult(null);
    try {
      const r = await openaiApi.chatCompletions({
        model: modelIdStr,
        messages: [{ role: "user", content: message.trim() }],
      });
      setChatResult(r);
    } catch (e: any) {
      const data = e?.data;
      setError(`chat: ${e?.status} ${data?.error?.code || data?.error?.message || data?.message || ""}`);
    }
    setLoading("");
  };

  return (
    <div style={panel}>
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px" }}>OpenAI-compatible 测试调用</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 280px" }}>
          <button style={{ ...btn, background: C.brand, color: C.white }} onClick={testModels} disabled={loading === "models"}>
            {loading === "models" ? "请求中..." : "GET /v1/models"}
          </button>
          {modelsResult && (
            <pre style={preStyle}>{JSON.stringify(modelsResult, null, 2)}</pre>
          )}
        </div>
        <div style={{ flex: "1 1 350px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Model: {modelIdStr || "(未选择)"}</span>
          </div>
          <textarea
            style={textarea}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="输入消息内容..."
          />
          <button style={{ ...btn, background: C.green, color: C.white }} onClick={testChat} disabled={loading === "chat" || !modelIdStr}>
            {loading === "chat" ? "请求中..." : "POST /v1/chat/completions"}
          </button>
          {chatResult && (
            <div style={{ marginTop: 8 }}>
              <pre style={preStyle}>{JSON.stringify(chatResult, null, 2)}</pre>
              {chatResult.usage && (
                <div style={{ marginTop: 6, padding: "6px 12px", background: C.brandBg, borderRadius: 6, fontSize: 12 }}>
                  prompt: {chatResult.usage.prompt_tokens} · completion: {chatResult.usage.completion_tokens} · total: {chatResult.usage.total_tokens}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {error && (
        <div style={{ marginTop: 8, padding: "8px 12px", background: `${C.red}12`, borderRadius: 6, fontSize: 12, color: C.red, fontFamily: "monospace" }}>
          {error}
        </div>
      )}
    </div>
  );
}
