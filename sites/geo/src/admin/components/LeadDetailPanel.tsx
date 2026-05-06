import { useState, useEffect } from "react";
import { GeoLead, ALL_STATUSES, STATUS_LABELS } from "../adminTypes";
import { fetchLeadById, updateLeadStatus, getToken } from "../geoAdminApi";
import StatusBadge from "./StatusBadge";
import { C } from "../../styles";

interface Props {
  leadId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function LeadDetailPanel({ leadId, onClose, onUpdated }: Props) {
  const [lead, setLead] = useState<GeoLead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  useEffect(() => {
    if (!leadId) { setLead(null); setError(""); return; }
    setLoading(true);
    setError("");
    setNewStatus("");
    setUpdateNotes("");
    setUpdateError("");
    setUpdateSuccess("");

    if (!getToken()) {
      setError("请先输入管理员访问令牌");
      setLoading(false);
      return;
    }

    fetchLeadById(leadId)
      .then((data) => { setLead(data); setNewStatus(data.status); })
      .catch((err) => setError(err.message || "加载失败"))
      .finally(() => setLoading(false));
  }, [leadId]);

  if (!leadId) return null;

  const handleUpdate = async () => {
    if (!newStatus || newStatus === lead?.status) {
      setUpdateError("请选择新状态");
      return;
    }
    setUpdating(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      await updateLeadStatus(leadId, { status: newStatus as any, notes: updateNotes || undefined });
      setUpdateSuccess("状态更新成功");
      setLead((prev) => prev ? { ...prev, status: newStatus as any } : prev);
      setUpdateNotes("");
      onUpdated();
    } catch (err: any) {
      setUpdateError(err.message || "更新失败");
    } finally {
      setUpdating(false);
    }
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: "#8a9aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4,
  };

  return (
    <div style={{
      position: "fixed", right: 0, top: 0, bottom: 0, width: "min(480px, 90vw)",
      background: "#fff", boxShadow: "-4px 0 20px rgba(0,0,0,0.08)", zIndex: 100,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8ecf1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>线索详情</span>
        <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#5a6a7e" }}>✕</button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {loading && <div style={{ textAlign: "center", color: "#5a6a7e", padding: 40 }}>加载中...</div>}

        {error && <div style={{ color: "#c62828", fontSize: 13, marginBottom: 16, padding: 12, background: "#ffebee", borderRadius: 6 }}>{error}</div>}

        {lead && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={sectionLabel}>基本信息</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="公司名称" value={lead.companyName} />
                <Field label="品牌名称" value={lead.brandName} />
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="官网" value={<a href={lead.website} target="_blank" rel="noopener" style={{ color: "#0055cc" }}>{lead.website}</a>} />
                </div>
                <Field label="行业" value={lead.industry} />
                <Field label="目标城市" value={lead.targetCity || "-"} />
                {lead.competitors && <div style={{ gridColumn: "1 / -1" }}><Field label="主要竞品" value={lead.competitors} /></div>}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={sectionLabel}>联系信息</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="联系人" value={lead.contactName} />
                <Field label="联系方式" value={lead.contactMethod} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={sectionLabel}>快捷操作</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a href={`/admin/reports/new?leadId=${lead.id}`}
                  style={{ display: "inline-block", padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#e6f0ff", color: "#0055cc", border: "1px solid #b3d4ff" }}>
                  + 新建诊断报告
                </a>
                <a href={`/admin/brand-assets/new?leadId=${lead.id}`}
                  style={{ display: "inline-block", padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#e6f4ea", color: "#0f7b3a", border: "1px solid #b3e0c0" }}>
                  + 新建品牌事实资产包
                </a>
                <a href={`/admin/reports?leadId=${lead.id}`}
                  style={{ display: "inline-block", padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#f7f9fb", color: "#5a6a7e", border: "1px solid #d0d7de" }}>
                  查看关联报告
                </a>
                <a href={`/admin/brand-assets?leadId=${lead.id}`}
                  style={{ display: "inline-block", padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#f7f9fb", color: "#5a6a7e", border: "1px solid #d0d7de" }}>
                  查看关联资产包
                </a>
                <a href={`/admin/content-topics/new?leadId=${lead.id}`}
                  style={{ display: "inline-block", padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#fff6ea", color: "#b85c00", border: "1px solid #fcd9a5" }}>
                  + 新建内容选题
                </a>
                <a href={`/admin/content-topics?leadId=${lead.id}`}
                  style={{ display: "inline-block", padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#f7f9fb", color: "#5a6a7e", border: "1px solid #d0d7de" }}>
                  查看内容选题
                </a>
                <a href={`/admin/content-plans/new?leadId=${lead.id}`}
                  style={{ display: "inline-block", padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#ede9fe", color: "#7c3aed", border: "1px solid #c4b5fd" }}>
                  + 新建内容计划
                </a>
                <a href={`/admin/content-plans?leadId=${lead.id}`}
                  style={{ display: "inline-block", padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#f7f9fb", color: "#5a6a7e", border: "1px solid #d0d7de" }}>
                  查看内容计划
                </a>
                <a href={`/admin/content-drafts/new?leadId=${lead.id}`}
                  style={{ display: "inline-block", padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#ede9fe", color: "#7c3aed", border: "1px solid #c4b5fd" }}>
                  + 新建内容稿件
                </a>
                <a href={`/admin/content-drafts?leadId=${lead.id}`}
                  style={{ display: "inline-block", padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#f7f9fb", color: "#5a6a7e", border: "1px solid #d0d7de" }}>
                  查看内容稿件
                </a>
                <a href={`/admin/workspace?leadId=${lead.id}`}
                  style={{ display: "inline-block", padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#e6f0ff", color: C.blue, border: "1px solid #b3d4ff" }}>
                  进入客户工作台 &rarr;
                </a>
                <a href={`/admin/export?leadId=${lead.id}`}
                  style={{ display: "inline-block", padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#fef0e8", color: "#d4470f", border: "1px solid #fcd9a5" }}>
                  📦 导出 GEO 交付包
                </a>
              </div>
            </div>

            {lead.notes && (
              <div style={{ marginBottom: 20 }}>
                <div style={sectionLabel}>备注</div>
                <div style={{ fontSize: 13, whiteSpace: "pre-wrap", color: "#5a6a7e", background: "#f7f9fb", padding: 12, borderRadius: 6 }}>{lead.notes}</div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={sectionLabel}>线索状态</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <StatusBadge status={lead.status} />
                <span style={{ fontSize: 13, color: "#8a9aaa" }}>来源: {lead.source}</span>
              </div>
              {lead.firstContactedAt && <div style={{ fontSize: 12, color: "#8a9aaa", marginTop: 6 }}>首次联系: {new Date(lead.firstContactedAt).toLocaleString("zh-CN")}</div>}
              {lead.convertedToCustomerId && <div style={{ fontSize: 12, color: "#8a9aaa", marginTop: 2 }}>已转为客户: {lead.convertedToCustomerId}</div>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={sectionLabel}>系统信息</div>
              <Field label="IP 地址" value={lead.ipAddress || "-"} />
              <Field label="User-Agent" value={lead.userAgent || "-"} />
              <Field label="创建时间" value={new Date(lead.createdAt).toLocaleString("zh-CN")} />
              <Field label="更新时间" value={new Date(lead.updatedAt).toLocaleString("zh-CN")} />
            </div>

            <div style={{ borderTop: "1px solid #e8ecf1", paddingTop: 20 }}>
              <div style={sectionLabel}>状态更新</div>
              <div style={{ fontSize: 12, color: "#8a9aaa", marginBottom: 10 }}>
                状态流转受后端规则限制，非法流转会被拒绝。
              </div>

              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14, marginBottom: 10 }}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s} disabled={s === lead.status}>{STATUS_LABELS[s]}{s === lead.status ? "（当前）" : ""}</option>
                ))}
              </select>

              <textarea
                placeholder="更新备注（可选）"
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                maxLength={2000}
                rows={3}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13, resize: "vertical", marginBottom: 10 }}
              />

              <button
                onClick={handleUpdate}
                disabled={updating || newStatus === lead.status}
                style={{
                  width: "100%", padding: "10px 0", border: "none", borderRadius: 6,
                  background: updating ? "#d0d7de" : "#0055cc", color: "#fff",
                  fontSize: 14, fontWeight: 700, cursor: updating ? "not-allowed" : "pointer",
                }}
              >
                {updating ? "更新中..." : "更新状态"}
              </button>

              {updateError && <div style={{ color: "#c62828", fontSize: 13, marginTop: 8 }}>{updateError}</div>}
              {updateSuccess && <div style={{ color: "#0f7b3a", fontSize: 13, marginTop: 8 }}>{updateSuccess}</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#8a9aaa", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#0d1b2a", wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}
