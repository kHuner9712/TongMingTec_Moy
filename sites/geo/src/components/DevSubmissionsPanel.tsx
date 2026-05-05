import { useState, useEffect } from "react";
import { loadSubmissions } from "../leadStorage";
import type { LeadSubmission } from "../types";
import { C } from "../styles";

export default function DevSubmissionsPanel() {
  const [open, setOpen] = useState(false);
  const [submissions, setSubmissions] = useState<LeadSubmission[]>([]);

  const refresh = () => setSubmissions(loadSubmissions());

  useEffect(() => {
    refresh();
  }, [open]);

  /* 仅在开发环境渲染 */
  if (!import.meta.env.DEV) return null;

  return (
    <div
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        fontFamily: "monospace",
      }}
    >
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid #ccc",
            background: "#333", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}
        >
          Debug: 提交记录 ({submissions.length})
        </button>
      )}

      {open && (
        <div
          style={{
            width: 420, maxHeight: "60vh", background: "#1a1a2e",
            borderRadius: 10, border: "1px solid #444", color: "#c0d8f0",
            fontSize: 12, overflow: "auto", padding: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
            <strong style={{ color: "#fff" }}>提交记录 ({submissions.length})</strong>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={refresh} style={{ background: "#333", color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: 11 }}>
                刷新
              </button>
              <button onClick={() => setOpen(false)} style={{ background: "#333", color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: 11 }}>
                ✕
              </button>
            </div>
          </div>

          {submissions.length === 0 && <p style={{ color: "#777" }}>暂无提交记录</p>}

          {submissions.map((s, i) => (
            <div
              key={i}
              style={{
                borderTop: "1px solid #333", padding: "8px 0",
                display: "flex", flexDirection: "column", gap: 2,
              }}
            >
              <span style={{ color: C.blue }}>{s.companyName} · {s.brandName}</span>
              <span style={{ color: "#777" }}>{s.website}</span>
              <span style={{ color: "#555" }}>
                {s.contactName} · {s.contactMethod} &nbsp;|&nbsp; {new Date(s.submittedAt).toLocaleString("zh-CN")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
