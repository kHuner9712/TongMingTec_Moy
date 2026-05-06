import { ADMIN_NAV_ITEMS, isNavActive } from "./adminNavItems";
import { C, sans } from "../../styles";

export default function AdminNav() {
  const currentPath = window.location.pathname;

  return (
    <nav style={{
      width: 200, minWidth: 200, background: "#f0f3f8", borderRight: `1px solid ${C.grayLight}`,
      padding: "16px 0", display: "flex", flexDirection: "column", gap: 2,
      fontFamily: sans, overflowY: "auto",
    }}>
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = isNavActive(item, currentPath);
        return (
          <a key={item.path}
            href={item.path}
            style={{
              display: "block", padding: "8px 20px", fontSize: 13, fontWeight: active ? 700 : 500,
              color: active ? C.blue : C.gray, textDecoration: "none",
              background: active ? "#e0e8f5" : "transparent",
              borderLeft: active ? `3px solid ${C.blue}` : "3px solid transparent",
              transition: "background 0.15s",
            }}>
            {item.label}
          </a>
        );
      })}

      <div style={{ marginTop: "auto", padding: "8px 20px" }}>
        <a href="/"
          style={{
            fontSize: 12, fontWeight: 500, color: C.gray, textDecoration: "none",
            display: "block", padding: "6px 0",
          }}>
          ← 返回官网
        </a>
      </div>
    </nav>
  );
}
