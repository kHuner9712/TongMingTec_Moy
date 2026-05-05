import { GeoContentTopicBrief, GeoContentDraftBrief } from "../workspaceTypes";
import { C, sans } from "../../../styles";

interface Props {
  topics: GeoContentTopicBrief[];
  topicsError: string;
  drafts: GeoContentDraftBrief[];
  draftsError: string;
}

export default function ContentProductionSummary({ topics, topicsError, drafts, draftsError }: Props) {
  const topicCounts = countByStatus(topics);
  const draftCounts = countByStatus(drafts);

  const topicStatuses = [
    { k: "idea", l: "idea" }, { k: "planned", l: "planned" },
    { k: "drafting", l: "drafting" }, { k: "reviewing", l: "reviewing" },
    { k: "approved", l: "approved" }, { k: "published", l: "published" },
    { k: "archived", l: "archived" },
  ];
  const draftStatuses = [
    { k: "draft", l: "草稿" }, { k: "reviewing", l: "审核中" },
    { k: "approved", l: "已通过" }, { k: "published", l: "已发布" },
    { k: "archived", l: "已归档" },
  ];

  return (
    <div style={{ padding: "20px 32px", borderBottom: `1px solid ${C.grayLight}` }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 16px", fontFamily: sans }}>
        内容生产概览
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.dark, margin: "0 0 10px" }}>
            内容选题 ({topicsError ? "加载失败" : topics.length})
          </h3>
          {topicsError ? <p style={{ fontSize: 12, color: "#cc0000" }}>{topicsError}</p> :
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {topicStatuses.map((s) => (
                <span key={s.k} style={{ padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 500, background: C.bg, color: C.gray, border: `1px solid ${C.grayLight}` }}>
                  {s.l}: {topicCounts[s.k] || 0}
                </span>
              ))}
            </div>
          }
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.dark, margin: "0 0 10px" }}>
            内容稿件 ({draftsError ? "加载失败" : drafts.length})
          </h3>
          {draftsError ? <p style={{ fontSize: 12, color: "#cc0000" }}>{draftsError}</p> :
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {draftStatuses.map((s) => (
                <span key={s.k} style={{ padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 500, background: C.bg, color: C.gray, border: `1px solid ${C.grayLight}` }}>
                  {s.l}: {draftCounts[s.k] || 0}
                </span>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}

function countByStatus(items: { status: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.status] = (counts[item.status] || 0) + 1;
  }
  return counts;
}
