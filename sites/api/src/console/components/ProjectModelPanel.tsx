import React, { useState } from "react";
import { adminApi } from "../apiHubAdminApi";
import { ApiModelDTO, ApiProjectModelDTO } from "../apiConsoleTypes";
import { C } from "../../styles";

const panel: React.CSSProperties = { background: C.white, borderRadius: 10, border: "1px solid #e4e8ed", padding: "20px 24px", marginBottom: 16 };
const btn: React.CSSProperties = { padding: "4px 10px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 4, cursor: "pointer", marginLeft: 6 };

interface Props {
  selectedProjectId: string;
  selectedModelId: string;
  models: ApiModelDTO[];
  projectModels: ApiProjectModelDTO[];
  onRefresh: () => void;
}

export default function ProjectModelPanel({ selectedProjectId, selectedModelId, models, projectModels, onRefresh }: Props) {
  const [error, setError] = useState("");

  const enable = async () => {
    if (!selectedProjectId || !selectedModelId) return;
    try { await adminApi.projects.addModel(selectedProjectId, { modelId: selectedModelId }); onRefresh(); } catch (e: any) { setError(e?.data?.message || "启用失败"); }
  };
  const disable = async (pmId: string) => {
    try { await adminApi.projects.updateModel(selectedProjectId, pmId, { enabled: false }); onRefresh(); } catch (e: any) { setError(e?.data?.message || "禁用失败"); }
  };
  const remove = async (pmId: string) => {
    try { await adminApi.projects.removeModel(selectedProjectId, pmId); onRefresh(); } catch (e: any) { setError(e?.data?.message || "移除失败"); }
  };

  const selModel = models.find(m => m.id === selectedModelId);

  return (
    <div style={panel}>
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px" }}>Project Model 启用</h2>
      {!selectedProjectId ? (
        <p style={{ fontSize: 13, color: C.gray, margin: 0 }}>请先选择一个 Project</p>
      ) : (
        <>
          {selModel && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>当前 Model: {selModel.name} ({selModel.modelId})</span>
              <button style={{ ...btn, background: C.brand, color: C.white, marginLeft: 12 }} onClick={enable}>启用到此 Project</button>
            </div>
          )}
          <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e4e8ed", borderRadius: 6 }}>
            {projectModels.length === 0 && <p style={{ padding: 12, fontSize: 13, color: C.gray, margin: 0 }}>暂无已启用模型</p>}
            {projectModels.map(pm => (
              <div key={pm.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #eaedf2", fontSize: 12 }}>
                <span>
                  <span style={{ fontWeight: 600 }}>{pm.model?.name || pm.modelId}</span>
                  <span style={{ marginLeft: 8, color: C.gray }}>{pm.model?.modelId || ""}</span>
                  <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 4, fontSize: 10, background: pm.enabled ? C.greenBg : C.amberBg, color: pm.enabled ? C.green : C.amber }}>{pm.enabled ? "enabled" : "disabled"}</span>
                </span>
                <span>
                  <button style={{ ...btn, background: C.amberBg, color: C.amber }} onClick={() => disable(pm.id)}>禁用</button>
                  <button style={{ ...btn, background: C.red + "15", color: C.red }} onClick={() => remove(pm.id)}>移除</button>
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
