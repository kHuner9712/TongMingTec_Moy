/* ============================================================
   MOY API — API 平台站 样式常量 (api.moy.com)
   ============================================================ */

export const C = {
  brand:   "#0066e0",
  brandBg: "#edf4ff",
  dark:    "#0a1628",
  darker:  "#040d18",
  gray:    "#5f6d80",
  grayLt:  "#eaedf2",
  bg:      "#f8f9fb",
  white:   "#fff",
  green:   "#0f7b3a",
  greenBg: "#e6f4ea",
  amber:   "#b85c00",
  amberBg: "#fff6ea",
  red:     "#c04040",
  terminal:"#0d1b2a",
  termFg:  "#c0d8f0",
  termAc:  "#5bc0de",
} as const;

export const sans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif';

export const mono =
  '"Fira Code", "Cascadia Code", "JetBrains Mono", "Consolas", "Menlo", monospace';

export function h1(s?: React.CSSProperties): React.CSSProperties {
  return { fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.15, ...s };
}

export function h2(s?: React.CSSProperties): React.CSSProperties {
  return { fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: 700, letterSpacing: "-0.3px", lineHeight: 1.25, ...s };
}

export const section = { maxWidth: 1080, margin: "0 auto", padding: "88px 24px" } as const;
export const sectionWhite = { ...section, background: C.white } as const;

export const navBar: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 10,
  background: "rgba(248,249,251,0.94)",
  backdropFilter: "blur(12px)",
  borderBottom: "1px solid #e4e8ed",
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
  background: C.brand,
  color: C.white,
  borderRadius: 6,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 700,
};

export const heroBg: React.CSSProperties = {
  background: `linear-gradient(175deg, ${C.darker} 0%, ${C.dark} 40%, #142c4a 100%)`,
  color: C.white,
  textAlign: "center",
  padding: "90px 24px 72px",
};

export const card: React.CSSProperties = {
  background: C.white,
  borderRadius: 10,
  border: "1px solid #e4e8ed",
  padding: "22px 24px",
  position: "relative",
};

export const footer: React.CSSProperties = {
  background: C.darker,
  color: "#708ba8",
  textAlign: "center",
  padding: "40px 24px",
  fontSize: 13,
  lineHeight: 1.8,
};

export function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1.2, color: C.brand, marginBottom: 8 }}>
      {text}
    </p>
  );
}
