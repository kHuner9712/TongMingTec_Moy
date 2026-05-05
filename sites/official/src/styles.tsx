/* ============================================================
   MOY Official — 品牌官网 样式常量 (moy.com)
   ============================================================ */

export const C = {
  brand:   "#005bb5",
  brandBg: "#e8f1ff",
  dark:    "#080e1a",
  darker:  "#03060c",
  gray:    "#5f6d80",
  grayLt:  "#e8ecf1",
  bg:      "#f8f9fb",
  white:   "#fff",
  green:   "#0f6e3a",
  greenBg: "#e6f4ea",
} as const;

export const sans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif';

export const wrap = { maxWidth: 1120, margin: "0 auto", padding: "0 24px" } as const;
export const wrapNarrow = { maxWidth: 760, margin: "0 auto", padding: "0 24px" } as const;

export const h1 = (s?: React.CSSProperties): React.CSSProperties => ({
  fontSize: "clamp(30px, 5.5vw, 52px)",
  fontWeight: 800,
  letterSpacing: "-0.7px",
  lineHeight: 1.12,
  ...s,
});

export const h2 = (s?: React.CSSProperties): React.CSSProperties => ({
  fontSize: "clamp(22px, 3.5vw, 30px)",
  fontWeight: 700,
  letterSpacing: "-0.3px",
  lineHeight: 1.22,
  ...s,
});

export const body = {
  fontSize: 15,
  color: C.gray,
  lineHeight: 1.7,
} as const;

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

export const heroBg = (s?: React.CSSProperties): React.CSSProperties => ({
  background: `linear-gradient(175deg, ${C.darker} 0%, ${C.dark} 35%, #0f2040 100%)`,
  color: C.white,
  textAlign: "center",
  padding: "96px 24px 80px",
  ...s,
});

export const sectionPad = { padding: "96px 24px" } as const;
export const sectionWhite = { ...sectionPad, background: C.white } as const;

export const card: React.CSSProperties = {
  background: C.white,
  borderRadius: 14,
  border: "1px solid #e4e8ed",
  padding: "36px 32px 32px",
  transition: "box-shadow 0.2s, transform 0.2s",
};

export const btnPrimary: React.CSSProperties = {
  display: "inline-block",
  padding: "13px 30px",
  borderRadius: 8,
  textDecoration: "none",
  fontSize: 15,
  fontWeight: 700,
  background: C.brand,
  color: C.white,
};

export const btnGhost: React.CSSProperties = {
  ...btnPrimary,
  background: "rgba(255,255,255,0.09)",
};

export const footer: React.CSSProperties = {
  background: C.darker,
  color: "#6a7e94",
  textAlign: "center",
  padding: "44px 24px",
  fontSize: 13,
  lineHeight: 2,
};

export function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1.5, color: C.brand, marginBottom: 8 }}>
      {text}
    </p>
  );
}
