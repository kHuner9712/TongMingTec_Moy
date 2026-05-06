import AdminHeader from "./AdminHeader";
import AdminNav from "./AdminNav";
import { C, sans } from "../../styles";

interface Props {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function AdminLayout({ title, description, children }: Props) {
  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      fontFamily: sans, background: "#f5f7fa",
    }}>
      <AdminNav />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 24px", background: "#fff", borderBottom: `1px solid ${C.grayLight}`,
          flexWrap: "wrap", gap: 8, minHeight: 52,
        }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>{title}</span>
            {description && <span style={{ fontSize: 12, color: C.gray, marginLeft: 12 }}>{description}</span>}
          </div>
          <AdminHeader />
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
