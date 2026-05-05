import { TodoItem } from "../dashboardTypes";
import { C, sans } from "../../../styles";

interface Props {
  todos: TodoItem[];
}

const TYPE_COLORS: Record<string, string> = { 线索: C.amber, 交付: C.blue, 内容: "#7c3aed" };
const TYPE_BG: Record<string, string> = { 线索: C.amberBg, 交付: C.blueLight, 内容: "#ede9fe" };

export default function TodoList({ todos }: Props) {
  return (
    <div style={{ padding: "20px 32px", borderBottom: `1px solid ${C.grayLight}` }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 12px", fontFamily: sans }}>
        近期待办 ({todos.length})
      </h2>
      {todos.length === 0 ? (
        <p style={{ fontSize: 13, color: C.gray }}>暂无待办，一切进展顺利。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 400, overflowY: "auto" }}>
          {todos.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: C.bg, borderRadius: 6, fontSize: 13, fontFamily: sans }}>
              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, color: TYPE_COLORS[t.type] || C.gray, background: TYPE_BG[t.type] || C.bg }}>
                {t.type}
              </span>
              <span style={{ fontWeight: 500, color: C.dark, flex: 1 }}>{t.title}</span>
              <span style={{ color: C.gray, flex: 2 }}>{t.label}</span>
              <a href={t.link} style={{ color: C.blue, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>&rarr;</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
