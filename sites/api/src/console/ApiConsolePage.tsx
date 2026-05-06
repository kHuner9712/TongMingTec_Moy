import React, { useState, useEffect, useCallback } from "react";
import { adminApi } from "./apiHubAdminApi";
import { ApiProjectDTO, ApiModelDTO, ApiProjectModelDTO, ApiMonthlyQuotaDTO, ApiKeySafeDTO, ApiProviderConfigDTO, RemainingQuotaDTO } from "./apiConsoleTypes";
import { C } from "../styles";
import ConsoleTokenPanel from "./components/ConsoleTokenPanel";
import ProjectPanel from "./components/ProjectPanel";
import ModelPanel from "./components/ModelPanel";
import ProjectModelPanel from "./components/ProjectModelPanel";
import QuotaPanel from "./components/QuotaPanel";
import ApiKeyPanel from "./components/ApiKeyPanel";
import OpenAiTestPanel from "./components/OpenAiTestPanel";
import ProviderConfigPanel from "./components/ProviderConfigPanel";
import CurlSnippet from "./components/CurlSnippet";

const page: React.CSSProperties = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif',
  color: C.dark, background: C.bg, minHeight: "100vh",
};

const header: React.CSSProperties = {
  background: C.darker, color: C.white, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
};

const container: React.CSSProperties = {
  maxWidth: 1100, margin: "0 auto", padding: "24px",
};

export default function ApiConsolePage() {
  const [projects, setProjects] = useState<ApiProjectDTO[]>([]);
  const [models, setModels] = useState<ApiModelDTO[]>([]);
  const [projectModels, setProjectModels] = useState<ApiProjectModelDTO[]>([]);
  const [quotas, setQuotas] = useState<ApiMonthlyQuotaDTO[]>([]);
  const [keys, setKeys] = useState<ApiKeySafeDTO[]>([]);
  const [providerConfigs, setProviderConfigs] = useState<ApiProviderConfigDTO[]>([]);
  const [remaining, setRemaining] = useState<RemainingQuotaDTO | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");

  const loadProjects = async () => {
    try { const r = await adminApi.projects.list(); setProjects(Array.isArray(r) ? r : r.data || []); } catch {}
  };

  const loadModels = async () => {
    try { const r = await adminApi.models.list(); setModels(Array.isArray(r) ? r : r.data || []); } catch {}
  };

  const loadProjectModels = async () => {
    if (!selectedProjectId) { setProjectModels([]); return; }
    try { const r = await adminApi.projects.listModels(selectedProjectId); setProjectModels(Array.isArray(r) ? r : r.data || r || []); } catch { setProjectModels([]); }
  };

  const loadQuotas = async () => {
    if (!selectedProjectId) { setQuotas([]); setRemaining(null); return; }
    try {
      const r = await adminApi.projects.listQuota(selectedProjectId);
      setQuotas(Array.isArray(r) ? r : r.data || []);
    } catch { setQuotas([]); }
    if (selectedModelId) {
      try { const r = await adminApi.projects.getRemaining(selectedProjectId, selectedModelId); setRemaining(r); } catch { setRemaining(null); }
    } else { setRemaining(null); }
  };

  const loadKeys = async () => {
    if (!selectedProjectId) { setKeys([]); return; }
    try { const r = await adminApi.keys.list(selectedProjectId); setKeys(Array.isArray(r) ? r : r.data || []); } catch { setKeys([]); }
  };

  const loadProviderConfigs = async () => {
    try { const r = await adminApi.providerConfigs.list(); setProviderConfigs(Array.isArray(r) ? r : r.data || []); } catch { setProviderConfigs([]); }
  };

  const loadAll = useCallback(async () => {
    await Promise.all([loadProjects(), loadModels(), loadProjectModels(), loadQuotas(), loadKeys(), loadProviderConfigs()]);
  }, [selectedProjectId, selectedModelId]);

  useEffect(() => { loadAll(); }, [selectedProjectId, selectedModelId]);

  const selModel = models.find(m => m.id === selectedModelId);
  const modelIdStr = selModel?.modelId || "";

  return (
    <div style={page}>
      <div style={header}>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.3px" }}>
          MOY<span style={{ color: C.brand }}>API</span> <span style={{ fontWeight: 500, fontSize: 14, color: "#708ba8" }}>Developer Console</span>
        </h1>
        <a href="/" style={{ color: "#5ba0f5", textDecoration: "none", fontSize: 13 }}>← 返回官网</a>
      </div>

      <div style={container}>
        <p style={{ fontSize: 14, color: C.gray, marginBottom: 24, lineHeight: 1.6 }}>
          用于本地调试 API Hub 项目、模型、额度、API Key、Provider Config 和 OpenAI-compatible 调用。
        </p>

        <ConsoleTokenPanel onTokenChange={loadAll} />
        <ProviderConfigPanel
          providerConfigs={providerConfigs}
          onRefresh={loadProviderConfigs}
        />
        <ProjectPanel
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onRefresh={loadProjects}
        />
        <ModelPanel
          models={models}
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
          onRefresh={loadModels}
        />
        <ProjectModelPanel
          selectedProjectId={selectedProjectId}
          selectedModelId={selectedModelId}
          models={models}
          projectModels={projectModels}
          onRefresh={loadProjectModels}
        />
        <QuotaPanel
          selectedProjectId={selectedProjectId}
          selectedModelId={selectedModelId}
          quotas={quotas}
          remaining={remaining}
          onRefresh={loadQuotas}
        />
        <ApiKeyPanel
          selectedProjectId={selectedProjectId}
          keys={keys}
          onRefresh={loadKeys}
        />
        <OpenAiTestPanel
          selectedModelId={selectedModelId}
          modelIdStr={modelIdStr}
          modelProvider={selModel?.provider}
        />
        <div style={{ background: C.white, borderRadius: 10, border: "1px solid #e4e8ed", padding: "20px 24px", marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px" }}>curl 示例</h2>
          <CurlSnippet model={modelIdStr || "moy-mock-chat"} messages="Hello MOY API" />
        </div>
      </div>
    </div>
  );
}
