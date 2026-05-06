import { C, sans } from "../../styles";

interface Props {
  title?: string;
  description?: string;
  action?: { label: string; href: string };
  children?: React.ReactNode;
}

export default function AdminEmptyState({ title, description, action, children }: Props) {
  return (
    <div style={{ padding: "4rem 2rem", textAlign: "center", fontFamily: sans }}>
      {title && <h2 style={{ fontSize: 18, fontWeight: 700, color: C.dark, margin: "0 0 8px" }}>{title}</h2>}
      {description && <p style={{ fontSize: 14, color: C.gray, margin: "0 0 20px", lineHeight: 1.7 }}>{description}</p>}
      {action && (
        <a href={action.href}
          style={{ display: "inline-block", padding: "10px 24px", background: C.blue, color: "#fff", borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          {action.label}
        </a>
      )}
      {children}
    </div>
  );
}
