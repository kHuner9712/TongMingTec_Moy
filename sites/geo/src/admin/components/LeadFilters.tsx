import { ALL_STATUSES, STATUS_LABELS } from "../adminTypes";

interface Props {
  status: string;
  keyword: string;
  onStatusChange: (v: string) => void;
  onKeywordChange: (v: string) => void;
  onRefresh: () => void;
}

export default function LeadFilters({ status, keyword, onStatusChange, onKeywordChange, onRefresh }: Props) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        style={selectStyle}
      >
        <option value="">全部状态</option>
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="搜索公司 / 品牌 / 官网 / 联系方式..."
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        style={{
          flex: 1,
          minWidth: 200,
          padding: "6px 12px",
          border: "1px solid #d0d7de",
          borderRadius: 6,
          fontSize: 13,
        }}
      />

      <button onClick={onRefresh} style={{
        padding: "6px 14px",
        border: "1px solid #d0d7de",
        borderRadius: 6,
        background: "#fff",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}>
        刷新
      </button>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid #d0d7de",
  borderRadius: 6,
  fontSize: 13,
  background: "#fff",
  minWidth: 120,
};
