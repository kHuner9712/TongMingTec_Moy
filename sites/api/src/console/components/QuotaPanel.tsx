import React, { useState } from "react";
import { adminApi } from "../apiHubAdminApi";
import { ApiMonthlyQuotaDTO, RemainingQuotaDTO } from "../apiConsoleTypes";
import { C } from "../../styles";

const panel: React.CSSProperties = { background: C.white, borderRadius: 10, border: "1px solid #e4e8ed", padding: "20px 24px", marginBottom: 16 };
const inp: React.CSSProperties = { width: "100%", padding: "6px 10px", fontSize: 12, border: "1px solid #d0d5dd", borderRadius: 6, outline: "none", boxSizing: "border-box", marginBottom: 6 };
const btn: React.CSSProperties = { padding: "6px 14px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", marginRight: 8 };

interface Props {
  selectedProjectId: string;
  selectedModelId: string;
  quotas: ApiMonthlyQuotaDTO[];
  remaining: RemainingQuotaDTO | null;
  onRefresh: () => void;
}

export default function QuotaPanel({ selectedProjectId, selectedModelId, quotas, remaining, onRefresh }: Props) {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [quotaLimit, setQuotaLimit] = useState("10000");
  const [quotaEdit, setQuotaEdit] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const setQuota = async () => {
    if (!selectedProjectId || !selectedModelId || !quotaLimit) return;
    setError("");
    try {
      await adminApi.projects.setQuota(selectedProjectId, {
        modelId: selectedModelId,
        quotaLimit: +quotaLimit,
        quotaUnit: "token",
        period,
      });
      onRefresh();
    } catch (e: any) { setError(e?.data?.message || "设置额度失败"); }
  };

  const updateQuota = async (quotaId: string) => {
    const v = quotaEdit[quotaId];
    if (!v) return;
    setError("");
    try { await adminApi.projects.updateQuota(selectedProjectId, quotaId, { quotaLimit: +v }); onRefresh(); } catch (e: any) { setError(e?.data?.message || "更新额度失败"); }
  };

  return (
    <div style={panel}>
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px" }}>Quota 配置</h2>
      {!selectedProjectId || !selectedModelId ? (
        <p style={{ fontSize: 13, color: C.gray, margin: 0 }}>请先选择 Project 和 Model</p>
      ) : (
        <>
          {remaining && (
            <div style={{ marginBottom: 12, padding: "8px 12px", background: C.brandBg, borderRadius: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>剩余额度: {remaining.remaining.toLocaleString()}</span>
              <span style={{ fontSize: 12, color: C.gray, marginLeft: 12 }}>已用 {remaining.used.toLocaleString()} / 总量 {remaining.limit.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <input style={{ ...inp, flex: 1, minWidth: 120 }} value={period} readOnly title="当月周期" />
            <input style={{ ...inp, flex: 1, minWidth: 100 }} value={quotaLimit} onChange={e => setQuotaLimit(e.target.value)} placeholder="quotaLimit" />
            <button style={{ ...btn, background: C.brand, color: C.white }} onClick={setQuota}>设置额度</button>
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e4e8ed", borderRadius: 6 }}>
            {quotas.length === 0 && <p style={{ padding: 12, fontSize: 13, color: C.gray, margin: 0 }}>暂无额度记录</p>}
            {quotas.map(q => (
              <div key={q.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #eaedf2", fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>{q.period}</span>
                <span>{q.quotaUsed.toLocaleString()} / {q.quotaLimit.toLocaleString()} ({q.usagePercent}%)</span>
                <span>
                  <input style={{ ...inp, width: 80, margin: 0, display: "inline-block", marginRight: 4 }} value={quotaEdit[q.id] || ""} onChange={e => setQuotaEdit(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder="新上限" />
                  <button style={{ ...btn, background: C.grayLt, color: C.dark, padding: "4px 8px", fontSize: 11 }} onClick={() => updateQuota(q.id)}>更新</button>
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
