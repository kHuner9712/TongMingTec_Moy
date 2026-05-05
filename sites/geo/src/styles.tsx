/* ============================================================
   MOY GEO — GEO 服务站 样式常量 (geo.moy.com)
   ============================================================ */

export const C = {
  blue: "#0055cc",
  blueLight: "#e8f1ff",
  dark: "#0d1b2a",
  darker: "#060f1a",
  gray: "#5a6a7e",
  grayLight: "#eaeef3",
  bg: "#f7f9fb",
  white: "#fff",
  green: "#0f7b3a",
  greenBg: "#e6f4ea",
  amber: "#b85c00",
  amberBg: "#fff6ea",
} as const;

export const sans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif';

export const h1 = {
  fontSize: "clamp(30px, 5vw, 48px)",
  fontWeight: 800,
  letterSpacing: "-0.5px",
  lineHeight: 1.15,
} as const;

export const h2 = {
  fontSize: "clamp(24px, 3.5vw, 32px)",
  fontWeight: 700,
  letterSpacing: "-0.3px",
  lineHeight: 1.25,
} as const;

export const body = {
  fontSize: "clamp(15px, 2vw, 17px)",
  color: C.gray,
  lineHeight: 1.75,
} as const;

export const small = { fontSize: 14, color: C.gray, lineHeight: 1.7 } as const;

export const section = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "88px 24px",
} as const;

export const sectionNarrow = {
  maxWidth: 760,
  margin: "0 auto",
  padding: "80px 24px",
} as const;

export const sectionWhite = {
  ...section,
  background: C.white,
  maxWidth: "100%",
  padding: "88px calc((100% - 1100px)/2 + 24px)",
} as const;

export const navBar: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 10,
  background: "rgba(247,249,251,0.92)",
  backdropFilter: "blur(12px)",
  borderBottom: "1px solid #e8ecf1",
  padding: "0 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: 56,
};

export const navLink: React.CSSProperties = {
  textDecoration: "none",
  color: C.gray,
  fontSize: 14,
  fontWeight: 500,
};

export const btnPrimary: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 20px",
  background: C.blue,
  color: C.white,
  borderRadius: 6,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 700,
};

export const heroBg: React.CSSProperties = {
  background: `linear-gradient(170deg, ${C.darker} 0%, ${C.dark} 40%, #122744 100%)`,
  color: C.white,
  textAlign: "center",
  padding: "100px 24px 80px",
};

export const painItem: React.CSSProperties = {
  display: "flex",
  gap: 20,
  alignItems: "baseline",
  padding: "20px 0",
  borderBottom: "1px solid #e8ecf1",
};

export const serviceCard: React.CSSProperties = {
  background: C.bg,
  borderRadius: 10,
  border: "1px solid #e8ecf1",
  padding: 28,
};

export const stepItem: React.CSSProperties = {
  display: "flex",
  gap: 24,
  alignItems: "flex-start",
  padding: "24px 0",
  borderBottom: "1px solid #e8ecf1",
};

export const footer: React.CSSProperties = {
  background: C.darker,
  color: "#7a8fa8",
  textAlign: "center",
  padding: "40px 24px",
  fontSize: 13,
  lineHeight: 1.8,
};

export function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1, color: C.blue, marginBottom: 8 }}>
      {text}
    </p>
  );
}
