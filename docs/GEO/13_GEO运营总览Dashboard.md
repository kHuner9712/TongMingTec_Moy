# GEO 运营总览 Dashboard

## 概述

`/admin` 和 `/admin/dashboard` 是 GEO 运营总览 Dashboard（仪表盘），聚合全部 GEO 线索、交付物与内容生产状态，帮助交付团队快速判断今日应该优先处理什么。

**纯前端聚合页**，不新增后端接口或实体。复用现有 6 个 API 获取全量数据。

## 页面入口

| 路径 | 说明 |
|------|------|
| `/admin` | 管理员入口（默认跳转 Dashboard） |
| `/admin/dashboard` | Dashboard 专用路径 |

## 使用的接口

| API | 用途 | pageSize |
|-----|------|----------|
| GET `/api/v1/geo-leads?page=1&pageSize=100` | 所有线索 | 100 |
| GET `/api/v1/geo-reports?page=1&pageSize=100` | 所有报告 | 100 |
| GET `/api/v1/geo-brand-assets?page=1&pageSize=100` | 所有资产包 | 100 |
| GET `/api/v1/geo-content-topics?page=1&pageSize=100` | 所有选题 | 100 |
| GET `/api/v1/geo-content-plans?page=1&pageSize=100` | 所有计划 | 100 |
| GET `/api/v1/geo-content-drafts?page=1&pageSize=100` | 所有稿件 | 100 |

全部并行请求（`Promise.allSettled`），部分接口失败不影响整体。

## 页面布局

| # | 区块 | 组件 | 说明 |
|---|------|------|------|
| 1 | 页面标题 | 内联 | "MOY GEO 运营总览" + 副标题 + 导航链接 |
| 2 | KPI 指标卡 | DashboardKpis | 8 个指标卡片（线索/待处理/有效/成交/报告/资产包/选题/稿件） |
| 3 | 近期待办 | TodoList | 12 条规则自动生成待办，按类型分类（线索/交付/内容） |
| 4 | 线索漏斗 | LeadFunnel | 7 级状态条形图（received→won/lost） |
| 5 | 内容生产状态 | ContentStatusSummary | 选题 7 状态 + 稿件 5 状态条形图 |
| 6 | 最近线索 | RecentLeads | 最近 10 条线索 |
| 7 | 最近交付物 | RecentDeliverables | 报告/资产包/稿件各 top 5 |
| 8 | 项目风险 | ProjectRiskList | 风险列表或正常绿条 |

## KPI 指标定义

| 指标 | 计算方式 |
|------|----------|
| 线索总数 | leads.length |
| 待处理线索 | leads 中 status=received 的数量 |
| 有效线索 | leads 中 status=qualified 的数量 |
| 已成交 | leads 中 status=won 的数量 |
| 诊断报告 | reports.length |
| 品牌资产包 | brandAssets.length |
| 内容选题 | topics.length |
| 内容稿件 | drafts.length |

## 待办生成规则（12 条）

| # | 触发条件 | 类型 | 行动 |
|---|----------|------|------|
| 1 | lead received | 线索 | 需要首次联系 → 进入工作台 |
| 2 | lead contacted | 线索 | 已联系但未判定有效 → 判断线索质量 |
| 3 | lead qualified | 线索 | 有效线索待发方案或推进 → 制定方案 |
| 4 | report 无对应的 brand_asset | 交付 | 有报告但缺品牌资产包 → 建设资产包 |
| 5 | brand_asset 无对应的 topic | 交付 | 有品牌资产包但无选题 → 规划选题 |
| 6 | topic 无对应的 draft | 内容 | 有选题但无稿件 → 开始撰写 |
| 7 | draft status=reviewing | 内容 | 稿件待审核 → 审核 |
| 8 | draft status=approved | 内容 | 稿件已通过审核 → 安排发布 |
| 9 | topic status=planned | 内容 | 已规划但未开始撰写 → 进入编辑 |

## 风险生成规则（9 条）

| # | 触发条件 | 风险类型 | 行动 |
|---|----------|----------|------|
| 1 | lead received 且无报告 | 未启动诊断 | 建议生成诊断报告 |
| 2 | 有报告但无资产包 | 交付卡在资产建设 | 建议建设品牌资产包 |
| 3 | 有资产包但无选题 | 内容规划未开始 | 建议规划内容选题 |
| 4 | 有选题但无稿件 | 选题未转化为稿件 | 建议撰写内容稿件 |
| 5 | 有稿件但无 approved/published | 稿件未交付 | 稿件未进入可交付状态 |
| 6 | lead contacted 且 updatedAt > 7 天 | 跟进停滞 | 已联系超过 7 天未推进 |
| 7 | lead proposal_sent 且 updatedAt > 7 天 | 成交跟进停滞 | 已发方案超过 7 天未 win/lost |

## 容错设计

- `Promise.allSettled` 并行 6 请求，部分失败不影响其他
- 全部数据为空 + 无错误 → 显示引导页面
- 无 token → 提示设置令牌
- 错误区域显示失败信息

## 不新增后端实体的原因

- Dashboard 是纯读 + 跳转的聚合视图
- 不需要独立持久化状态
- 所有数据实时从各实体表拉取
- 后续如需 Dashboard 配置（如自定义指标），再考虑后端表

## 后续扩展

- S3：按时间范围筛选（今日/本周/本月）
- S3：交付量趋势折线图（需图表库）
- S4：客户可查看的轻量 Dashboard
- S4：自动生成运营周报
