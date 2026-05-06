# GEO 后台导航与体验收口

## 概述

为所有 `/admin` 路径下的页面建立统一的 Admin Layout，提供左侧导航、顶部标题栏、统一的 Token 管理入口，形成真正的后台体验而非分散工具页。

**纯前端改造**，不新增后端接口或实体。

## Admin 信息架构

```
/admin                      → 运营总览 Dashboard
/admin/dashboard            → 运营总览 Dashboard（别名）
/admin/leads                → 线索池
/admin/workspace            → 客户工作台（?leadId=xxx）
/admin/reports              → 诊断报告列表
/admin/reports/new          → 新建诊断报告
/admin/brand-assets         → 品牌事实资产包列表
/admin/brand-assets/new     → 新建品牌事实资产包
/admin/content-topics       → 内容选题列表
/admin/content-topics/new   → 编辑内容选题
/admin/content-plans        → 内容计划列表
/admin/content-plans/new    → 编辑内容计划
/admin/content-drafts       → 内容稿件列表
/admin/content-drafts/new   → 编辑内容稿件
```

## AdminLayout 结构

### 组件树

```
AdminLayout
├── AdminNav（左侧 200px 固定宽度）
│   ├── 8 个导航项
│   ├── 当前路径高亮（含 /new 子路径匹配）
│   └── 返回官网入口
└── 右侧内容区（flex: 1）
    ├── 顶部标题栏
    │   ├── 页面标题 + 描述
    │   └── AdminHeader（Token 状态 + 设置/清除）
    └── 页面内容（scrollable）
        └── 各页面组件
```

### 文件清单

| 文件 | 说明 |
|------|------|
| `layout/AdminLayout.tsx` | 主布局（左侧导航 + 顶部标题 + 内容区） |
| `layout/AdminNav.tsx` | 左侧导航组件（路径高亮） |
| `layout/AdminHeader.tsx` | 顶部 Token 管理组件 |
| `layout/adminNavItems.ts` | 导航项定义 + 匹配逻辑 |

### 通用组件

| 文件 | 说明 |
|------|------|
| `components/AdminEmptyState.tsx` | 空状态展示组件 |
| `components/AdminErrorState.tsx` | 错误状态展示组件 |

## 导航项定义

| # | 导航项 | 路径 | 匹配路径（高亮条件） |
|---|--------|------|---------------------|
| 1 | 运营总览 | /admin | /admin, /admin/, /admin/dashboard |
| 2 | 线索池 | /admin/leads | /admin/leads |
| 3 | 客户工作台 | /admin/workspace | /admin/workspace |
| 4 | 诊断报告 | /admin/reports | /admin/reports, /admin/reports/new |
| 5 | 品牌资产 | /admin/brand-assets | /admin/brand-assets, /admin/brand-assets/new |
| 6 | 内容选题 | /admin/content-topics | /admin/content-topics, /admin/content-topics/new |
| 7 | 内容计划 | /admin/content-plans | /admin/content-plans, /admin/content-plans/new |
| 8 | 内容稿件 | /admin/content-drafts | /admin/content-drafts, /admin/content-drafts/new |

## Token 临时机制

### 当前方案

- Token 存储在 `localStorage` key `moy_geo_admin_token`
- 所有 API 请求通过 `Authorization: Bearer <token>` 发送
- AdminHeader 实时读取 localStorage 判断是否有 Token
- 提供设置/更新/清除 Token 的简易界面

### 状态显示

| Token 状态 | 显示 |
|-----------|------|
| 有 Token | 绿色标签 "已设置管理员令牌" |
| 无 Token | 琥珀色标签 "未设置管理员令牌" |

### 为什么暂不接统一登录

1. GEO Admin 是运营/交付团队的内部工具
2. 当前用户量少（< 10 人），Token 临时方案足够
3. 统一登录需后端 Auth 模块重构，属于 S3 范围
4. 不阻塞 GEO 交付链路的核心功能开发
5. 后续接入 MOY App 统一认证时，只需替换 auth interceptor

### 后续统一登录计划（S3）

- 接入 MOY App 的 JWT 认证体系
- 基于角色的权限控制（管理员/编辑只读）
- 操作审计日志
- Session 管理和 Token 刷新

## 已接入 AdminLayout 的页面（13 个）

| 页面 | title | description |
|------|-------|-------------|
| GeoDashboardPage | 运营总览 | 汇总 GEO 线索、交付资产、内容生产和项目风险 |
| AdminLeadsPage | 线索池 | 管理 GEO 销售线索 |
| GeoWorkspacePage | 客户工作台 | 查看客户项目的完整交付进度 |
| ReportsListPage | 诊断报告 | 管理客户的 GEO 诊断报告 |
| ReportBuilderPage | 新建诊断报告 | 为客户生成 GEO 诊断报告 |
| BrandAssetsListPage | 品牌事实资产包 | 管理客户的品牌事实资产库 |
| BrandAssetBuilderPage | 新建品牌事实资产包 | 为客户建设品牌事实资产库 |
| ContentTopicsListPage | 内容选题 | 为客户规划 GEO 内容选题和文章方向 |
| ContentTopicEditorPage | 编辑内容选题 | 为客户规划 GEO 内容选题和文章方向 |
| ContentPlansListPage | 内容计划 | 规划月度/周期内容发布计划并关联选题 |
| ContentPlanEditorPage | 编辑内容计划 | 规划月度/周期内容发布计划并关联选题 |
| ContentDraftsListPage | 内容稿件 | 管理 GEO 内容稿件的创建、编辑、审核与发布状态 |
| ContentDraftEditorPage | 新建内容稿件 | 基于内容选题生成、编辑 GEO 内容稿件 |

## 重要边界

| 约束 | 说明 |
|------|------|
| 不改后端 | 无新表/新接口 |
| 不新增后端接口 | 复用现有 API |
| 不接统一登录 | Token 机制不变 |
| 不影响 GEO 官网首页 | 仅 /admin 路径 |
| 不影响 MOY App | 独立站点 sites/geo |
| 不引入复杂 UI 框架 | 纯 inline styles |
| 不做权限系统 | 沿用 moy_geo_admin_token |

## 移动端适配

- 左侧导航 200px 固定宽度
- 小屏幕可考虑折叠为顶部汉堡菜单（S3）
- 当前各页面内容区有独立 maxWidth 控制
