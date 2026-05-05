import { GeoLead } from "../adminTypes";
import StatusBadge from "./StatusBadge";

interface Props {
  leads: GeoLead[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

export default function LeadTable({ leads, selectedId, onSelect, loading }: Props) {
  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#5a6a7e" }}>加载中...</div>;
  }

  if (leads.length === 0) {
    return <div style={{ padding: 40, textAlign: "center", color: "#8a9aaa" }}>暂无线索数据</div>;
  }

  const thStyle: React.CSSProperties = {
    padding: "10px 12px",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 600,
    color: "#5a6a7e",
    borderBottom: "2px solid #e8ecf1",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: 13,
    borderBottom: "1px solid #f0f3f5",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
        <thead>
          <tr>
            <th style={thStyle}>创建时间</th>
            <th style={thStyle}>公司名称</th>
            <th style={thStyle}>品牌</th>
            <th style={thStyle}>官网</th>
            <th style={thStyle}>行业</th>
            <th style={thStyle}>城市</th>
            <th style={thStyle}>联系人</th>
            <th style={thStyle}>状态</th>
            <th style={thStyle}>来源</th>
            <th style={thStyle}>操作</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => onSelect(lead.id)}
              style={{
                cursor: "pointer",
                background: lead.id === selectedId ? "#e8f1ff" : undefined,
              }}
            >
              <td style={tdStyle}>{new Date(lead.createdAt).toLocaleString("zh-CN")}</td>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{lead.companyName}</td>
              <td style={tdStyle}>{lead.brandName}</td>
              <td style={{ ...tdStyle, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>
                <a href={lead.website} target="_blank" rel="noopener" style={{ color: "#0055cc" }}>
                  {lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </td>
              <td style={tdStyle}>{lead.industry}</td>
              <td style={tdStyle}>{lead.targetCity || "-"}</td>
              <td style={tdStyle}>{lead.contactName} / {lead.contactMethod}</td>
              <td style={tdStyle}><StatusBadge status={lead.status} /></td>
              <td style={tdStyle}>{lead.source}</td>
              <td style={tdStyle}>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(lead.id); }}
                  style={{
                    padding: "4px 12px",
                    border: "1px solid #0055cc",
                    borderRadius: 4,
                    background: "#fff",
                    color: "#0055cc",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  详情
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
