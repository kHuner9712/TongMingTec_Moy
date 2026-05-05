import { GeoLeadStatus, STATUS_LABELS } from "../adminTypes";

const COLORS: Record<GeoLeadStatus, { bg: string; color: string }> = {
  received:    { bg: "#e8f1ff", color: "#0055cc" },
  contacted:   { bg: "#fff3e0", color: "#b85c00" },
  qualified:   { bg: "#e6f4ea", color: "#0f7b3a" },
  proposal_sent: { bg: "#f3e5f5", color: "#7b1fa2" },
  won:         { bg: "#c8e6c9", color: "#1b5e20" },
  lost:        { bg: "#ffebee", color: "#c62828" },
  archived:    { bg: "#eceff1", color: "#546e7a" },
};

export default function StatusBadge({ status }: { status: GeoLeadStatus }) {
  const c = COLORS[status] || COLORS.received;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 10,
      fontSize: 12,
      fontWeight: 600,
      background: c.bg,
      color: c.color,
      whiteSpace: "nowrap",
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
