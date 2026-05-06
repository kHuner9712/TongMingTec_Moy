import { C, sans } from "../../styles";

interface Props {
  message?: string;
  action?: { label: string; href: string };
}

export default function AdminErrorState({ message, action }: Props) {
  return (
    <div style={{ padding: "4rem 2rem", textAlign: "center", fontFamily: sans }}>
      <p style={{ fontSize: 14, color: "#cc0000", margin: "0 0 20px" }}>
        {message || "加载失败，请稍后重试。"}
      </p>
      {action && (
        <a href={action.href}
          style={{ display: "inline-block", padding: "10px 24px", background: C.blue, color: "#fff", borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          {action.label}
        </a>
      )}
    </div>
  );
}
