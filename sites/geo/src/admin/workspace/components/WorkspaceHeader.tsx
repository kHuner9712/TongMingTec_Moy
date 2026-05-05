import { GeoLead } from "../../adminTypes";
import { C, sans } from "../../../styles";
import StatusBadge from "../../components/StatusBadge";

interface Props {
  lead: GeoLead;
  currentStage: string;
}

export default function WorkspaceHeader({ lead, currentStage }: Props) {
  return (
    <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.grayLight}`, background: C.bg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.dark, margin: "0 0 4px", fontFamily: sans }}>
            {lead.companyName}
            {lead.brandName && <span style={{ fontSize: 16, fontWeight: 400, color: C.gray, marginLeft: 12 }}>{lead.brandName}</span>}
          </h1>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
            <span style={{ fontSize: 13, color: C.gray }}>
              当前阶段：<strong style={{ color: C.blue }}>{currentStage}</strong>
            </span>
            <StatusBadge status={lead.status} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px 24px", marginTop: 20, fontSize: 13 }}>
        <Meta label="官网" value={<a href={lead.website} target="_blank" rel="noopener" style={{ color: C.blue }}>{lead.website}</a>} />
        <Meta label="行业" value={lead.industry} />
        <Meta label="目标城市" value={lead.targetCity || "-"} />
        <Meta label="联系人" value={lead.contactName} />
        <Meta label="联系方式" value={lead.contactMethod} />
        <Meta label="创建时间" value={new Date(lead.createdAt).toLocaleDateString("zh-CN")} />
        <Meta label="来源" value={lead.source} />
        <Meta label="竞品" value={lead.competitors || "-"} />
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
      <span style={{ color: C.gray, whiteSpace: "nowrap" }}>{label}:</span>
      <span style={{ fontWeight: 500, color: C.dark, wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}
