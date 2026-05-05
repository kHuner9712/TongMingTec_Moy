import { C, sans } from "../../../styles";

interface Props {
  leadId: string;
}

export default function QuickActions({ leadId }: Props) {
  const btn = (label: string, href: string, color: string, bg: string) => (
    <a href={href}
      style={{ display: "inline-block", padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", color, background: bg, border: `1px solid ${color}22` }}>
      {label}
    </a>
  );

  return (
    <div style={{ padding: "20px 32px", borderBottom: `1px solid ${C.grayLight}` }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 16px", fontFamily: sans }}>
        快捷操作
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {btn("+ 新建诊断报告", `/admin/reports/new?leadId=${leadId}`, C.blue, C.blueLight)}
        {btn("查看诊断报告", `/admin/reports?leadId=${leadId}`, C.gray, C.bg)}
        {btn("+ 新建品牌资产包", `/admin/brand-assets/new?leadId=${leadId}`, C.green, C.greenBg)}
        {btn("查看品牌资产包", `/admin/brand-assets?leadId=${leadId}`, C.gray, C.bg)}
        {btn("+ 新建内容选题", `/admin/content-topics/new?leadId=${leadId}`, C.amber, C.amberBg)}
        {btn("查看内容选题", `/admin/content-topics?leadId=${leadId}`, C.gray, C.bg)}
        {btn("+ 新建内容计划", `/admin/content-plans/new?leadId=${leadId}`, "#7c3aed", "#ede9fe")}
        {btn("查看内容计划", `/admin/content-plans?leadId=${leadId}`, C.gray, C.bg)}
        {btn("+ 新建内容稿件", `/admin/content-drafts/new?leadId=${leadId}`, "#7c3aed", "#ede9fe")}
        {btn("查看内容稿件", `/admin/content-drafts?leadId=${leadId}`, C.gray, C.bg)}
      </div>
    </div>
  );
}
