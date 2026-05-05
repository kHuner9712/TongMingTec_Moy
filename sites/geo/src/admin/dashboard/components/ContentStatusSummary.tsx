import { GeoContentTopicBrief, GeoContentDraftBrief } from "../dashboardTypes";
import { C, sans } from "../../../styles";

interface Props {
  topics: GeoContentTopicBrief[];
  topicsError: string;
  drafts: GeoContentDraftBrief[];
  draftsError: string;
}

const TOPIC_LABELS: Record<string, string> = {
  idea: "idea", planned: "planned", drafting: "drafting",
  reviewing: "reviewing", approved: "approved", published: "published", archived: "archived",
};
const DRAFT_LABELS: Record<string, string> = {
  draft: "草稿", reviewing: "审核中", approved: "已通过", published: "已发布", archived: "已归档",
};

export default function ContentStatusSummary({ topics, topicsError, drafts, draftsError }: Props) {
  const topicCounts = countByStatus(topics);
  const draftCounts = countByStatus(drafts);

  const allTopicKeys = ["idea", "planned", "drafting", "reviewing", "approved", "published", "archived"];
  const allDraftKeys = ["draft", "reviewing", "approved", "published", "archived"];

  return (
    <div style={{ padding: "20px 32px", borderBottom: `1px solid ${C.grayLight}` }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 12px", fontFamily: sans }}>
        内容生产状态
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.dark, margin: "0 0 8px" }}>
            选题状态 ({topicsError ? "加载失败" : topics.length})
          </h3>
          {topicsError ? <p style={{ fontSize: 12, color: "#cc0000" }}>{topicsError}</p> :
            <SimpleBar items={allTopicKeys.map((k) => ({ key: k, label: TOPIC_LABELS[k] || k, count: topicCounts[k] || 0, color: C.amber }))} />}
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.dark, margin: "0 0 8px" }}>
            稿件状态 ({draftsError ? "加载失败" : drafts.length})
          </h3>
          {draftsError ? <p style={{ fontSize: 12, color: "#cc0000" }}>{draftsError}</p> :
            <SimpleBar items={allDraftKeys.map((k) => ({ key: k, label: DRAFT_LABELS[k] || k, count: draftCounts[k] || 0, color: "#7c3aed" }))} />}
        </div>
      </div>
    </div>
  );
}

function SimpleBar({ items }: { items: { key: string; label: string; count: number; color: string }[] }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((i) => (
        <div key={i.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 70, fontSize: 11, color: C.gray, textAlign: "right", fontFamily: sans }}>{i.label}</span>
          <div style={{ flex: 1, height: 16, background: C.bg, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.round((i.count / max) * 100)}%`, background: i.color, borderRadius: 3, minWidth: i.count > 0 ? 2 : 0 }} />
          </div>
          <span style={{ width: 24, fontSize: 12, fontWeight: 600, color: C.dark, textAlign: "center" }}>{i.count}</span>
        </div>
      ))}
    </div>
  );
}

function countByStatus(items: { status: string }[]): Record<string, number> {
  const c: Record<string, number> = {};
  for (const i of items) c[i.status] = (c[i.status] || 0) + 1;
  return c;
}
