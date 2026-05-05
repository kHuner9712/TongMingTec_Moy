# GEO 客户项目工作台

## 概述

`/admin/workspace` 是 GEO 客户项目工作台，将某个 GEO lead 相关的所有交付物聚合到一个页面，形成真正的项目视图。

**纯前端聚合页**，不新增后端实体或接口，复用现有 6 个 API。

## 页面定位

聚合单个客户的 GEO 线索、诊断报告、品牌事实资产包、内容选题、内容计划和内容稿件，帮助交付团队按流程推进项目。

## 数据来源

| 数据 | API |
|------|-----|
| 线索详情 | GET /api/v1/geo-leads/:id |
| 诊断报告 | GET /api/v1/geo-reports?leadId=&pageSize=100 |
| 品牌资产包 | GET /api/v1/geo-brand-assets?leadId=&pageSize=100 |
| 内容选题 | GET /api/v1/geo-content-topics?leadId=&pageSize=100 |
| 内容计划 | GET /api/v1/geo-content-plans?leadId=&pageSize=100 |
| 内容稿件 | GET /api/v1/geo-content-drafts?leadId=&pageSize=100 |

全部使用 localStorage `moy_geo_admin_token` 鉴权。

## 页面结构

### 1. WorkspaceHeader（顶部项目摘要）
- 公司名称、品牌名称
- 当前项目阶段
- Lead 状态 Badge
- 官网、行业、目标城市、联系人、联系方式、创建时间、来源、竞品

### 2. DeliveryProgress（交付进度条）
6 个阶段，每个显示状态（已完成/进行中/待开始）、数量、快捷入口：
1. 线索收集
2. 诊断报告
3. 品牌事实资产
4. 内容选题
5. 内容计划
6. 内容稿件

### 3. QuickActions（快捷操作区）
10 个按钮，直接跳转到各新建/列表页并带上 leadId。

### 4. RecentDeliverables（最近交付物）
5 个 Tab 切换，展示最近 20 条记录，含标题、状态、创建时间、编辑链接。

### 5. ContentProductionSummary（内容生产概览）
选题和稿件按 status 分组统计数量（纯文本卡片，不需要图表库）。

### 6. ProjectRiskHints（项目风险提示）
6 条自动判断规则，显示警告或无风险绿条。

## 阶段判断规则

| 条件 | 当前阶段 |
|------|----------|
| 没有报告 | 待诊断 |
| 有报告但没有品牌资产包 | 待建设品牌资产 |
| 有品牌资产包但没有内容选题 | 待规划选题 |
| 有选题但没有内容计划 | 待制定内容计划 |
| 有计划但没有稿件 | 待撰写稿件 |
| 有稿件但没有 published | 内容生产中 |
| 有 published 稿件 | 持续运营中 |

## 风险提示规则

| 条件 | 提示 |
|------|------|
| lead 状态 received 但没有报告 | 线索尚未开始诊断 |
| 有报告但没有品牌资产包 | 建议基于诊断报告整理品牌资产 |
| 有品牌资产包但没有选题 | 建议规划 GEO 内容选题 |
| 有选题但稿件为 0 | 已有选题尚未进入稿件生产 |
| 有稿件但 approved/published 为 0 | 稿件未进入可交付状态 |
| 全部为空 | 暂无交付资产 |

## 容错设计

- 使用 `Promise.allSettled` 并行请求 6 个接口
- 部分接口失败不影响其他接口数据展示
- 失败区块显示错误信息
- token 不存在时提示返回管理后台
- leadId 不存在时显示空状态引导

## 与现有模块的关系

```
geo_leads ────────┐
geo_reports ──────┤
geo_brand_assets ─┤──→ GeoWorkspacePage（聚合视图）
geo_content_topics─┤
geo_content_plans ─┤
geo_content_drafts─┘
```

## 不新增后端实体的原因

- 工作台是纯读+跳转的聚合视图
- 不需要独立持久化工作台状态
- 所有数据实时拉取，始终反映最新状态
- 后续如需项目管理功能（如任务分配、截止日期），再考虑后端表

## 后续扩展

- S3：项目截止日期、任务分配、交付节点管理
- S3：客户视角工作台（受限只读）
- S4：自动生成项目周报/月报
- S4：内容效果数据回传显示
