import React, { useState } from "react";
import { adminApi } from "../apiHubAdminApi";
import { ApiProjectDTO } from "../apiConsoleTypes";
import { C } from "../../styles";

const panel: React.CSSProperties = {
  background: C.white, borderRadius: 10, border: "1px solid #e4e8ed", padding: "20px 24px", marginBottom: 16,
};
const inp: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 13, border: "1px solid #d0d5dd", borderRadius: 6, outline: "none", boxSizing: "border-box", marginBottom: 8,
};
const btn: React.CSSProperties = { padding: "6px 14px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", marginRight: 8 };
const err: React.CSSProperties = { fontSize: 12, color: C.red, marginTop: 4 };

interface Props {
  projects: ApiProjectDTO[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onRefresh: () => void;
}

export default function ProjectPanel({ projects, selectedProjectId, onSelectProject, onRefresh }: Props) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");

  const create = async () => {
    if (!name.trim()) return;
    setError("");
    try {
      await adminApi.projects.create({ name: name.trim(), description: desc.trim() || undefined });
      setName(""); setDesc("");
      onRefresh();
    } catch (e: any) { setError(e?.data?.message || "创建失败"); }
  };

  const archive = async (id: string) => {
    setError("");
    try { await adminApi.projects.archive(id); onRefresh(); } catch (e: any) { setError(e?.data?.message || "归档失败"); }
  };

  const sel = projects.find(p => p.id === selectedProjectId);

  return (
    <div style={panel}>
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px" }}>Project 管理</h2>

      {sel && (
        <div style={{ marginBottom: 12, padding: "8px 12px", background: C.brandBg, borderRadius: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.brand }}>当前: {sel.name}</span>
          <span style={{ fontSize: 11, color: C.gray, marginLeft: 12 }}>ID: {sel.id}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px" }}>
          <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Project 名称" />
          <input style={inp} value={desc} onChange={e => setDesc(e.target.value)} placeholder="描述（可选）" />
          <button style={{ ...btn, background: C.brand, color: C.white }} onClick={create}>创建 Project</button>
        </div>
        <div style={{ flex: "2 1 300px" }}>
          <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #e4e8ed", borderRadius: 6 }}>
            {projects.length === 0 && <p style={{ padding: 12, fontSize: 13, color: C.gray, margin: 0 }}>暂无 Project</p>}
            {projects.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #eaedf2", fontSize: 13 }}>
                <div>
                  <span style={{ fontWeight: 600, cursor: "pointer", color: p.id === selectedProjectId ? C.brand : C.dark }} onClick={() => onSelectProject(p.id)}>{p.name}</span>
                  <span style={{ marginLeft: 8, padding: "1px 6px", borderRadius: 4, fontSize: 11, background: p.status === "active" ? C.greenBg : C.amberBg, color: p.status === "active" ? C.green : C.amber }}>{p.status}</span>
                </div>
                <button style={{ ...btn, background: "transparent", color: C.red, fontSize: 12, padding: "2px 8px" }} onClick={() => archive(p.id)}>归档</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {error && <p style={err}>{error}</p>}
    </div>
  );
}
