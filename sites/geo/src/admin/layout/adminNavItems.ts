export interface AdminNavItem {
  label: string;
  path: string;
  matchPaths: string[];
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "运营总览", path: "/admin", matchPaths: ["/admin", "/admin/", "/admin/dashboard"] },
  { label: "线索池", path: "/admin/leads", matchPaths: ["/admin/leads"] },
  { label: "客户工作台", path: "/admin/workspace", matchPaths: ["/admin/workspace"] },
  { label: "诊断报告", path: "/admin/reports", matchPaths: ["/admin/reports", "/admin/reports/new"] },
  { label: "品牌资产", path: "/admin/brand-assets", matchPaths: ["/admin/brand-assets", "/admin/brand-assets/new"] },
  { label: "内容选题", path: "/admin/content-topics", matchPaths: ["/admin/content-topics", "/admin/content-topics/new"] },
  { label: "内容计划", path: "/admin/content-plans", matchPaths: ["/admin/content-plans", "/admin/content-plans/new"] },
  { label: "内容稿件", path: "/admin/content-drafts", matchPaths: ["/admin/content-drafts", "/admin/content-drafts/new"] },
];

export function isNavActive(item: AdminNavItem, currentPath: string): boolean {
  return item.matchPaths.some((p) => currentPath.startsWith(p));
}

export function getActiveNavItem(currentPath: string): AdminNavItem | null {
  return ADMIN_NAV_ITEMS.find((item) => isNavActive(item, currentPath)) || null;
}
