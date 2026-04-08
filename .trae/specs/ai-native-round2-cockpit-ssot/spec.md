# AI 原生架构第二轮重构 — 驾驶舱/工作台/SSOT 回写 Spec

## 文档元信息

| 属性 | 内容 |
|------|------|
| 文档名称 | AI 原生架构第二轮重构 |
| change-id | ai-native-round2-cockpit-ssot |
| 版本号 | v1.0 |
| 状态 | 待审批 |
| 日期 | 2026-04-08 |
| 前置依赖 | ai-native-architecture-refactor（第一轮已完成 Task 1-7,9-17） |

---

## Why

第一轮重构已完成 AI Runtime（ART）、客户经营记录（COR）、客户记忆（CMEM）三大核心后端模块和前端骨架页面。但系统主叙事仍是传统菜单式后台，前端路由仍是 `/customers`、`/leads` 等扁平 CRUD 页面，缺少经营驾驶舱、工作台分组、AI 执行流可视化。同时存在 React Query 依赖混用、CORS 未对齐、SSOT 未回写等工程基线问题。本轮必须把系统主叙事从"传统 CRM 菜单"切换到"AI 运行时驱动的客户经营系统"，并回写 SSOT。

---

## What Changes

### 1. 系统主叙事重构

- 前端路由体系从扁平 CRUD 菜单改为工作台分组：
  - `/cockpit` — 经营驾驶舱（全局 AI 洞察 + 风险预警 + 关键指标）
  - `/workbench/customer` — 客户经营工作台（客户列表 + AI 建议 + 下一步行动）
  - `/workbench/conversation` — 会话与跟进工作台（会话列表 + 智能回复 + 跟进任务）
  - `/workbench/ai-runs` — AI 执行流工作台（Agent 执行记录 + 审批 + 接管 + 回滚）
  - `/workbench/approvals` — 审批流工作台（待审批 + 已审批 + 已过期）
  - `/customer-360/:id` — 客户 360 视图（时间线 + 经营记忆 + AI 建议 + 关联资源）
  - `/risk-signals` — 风险/机会/续费/服务预警台
- 保留原有路由作为兼容别名（`/customers` → `/workbench/customer`，`/conversations` → `/workbench/conversation`）
- 侧边栏菜单重构为工作台分组

### 2. 后端新增模块

- `backend/src/modules/approval-center/` — 审批中心（独立模块，从 ART 中拆出审批相关逻辑为独立服务）
- `backend/src/modules/takeover-center/` — 接管中心（独立模块，从 ART 中拆出接管相关逻辑）
- `backend/src/modules/rollback-center/` — 回滚中心（独立模块，从 ART 中拆出回滚相关逻辑）

### 3. 完成第一轮遗留任务

- Task 8: 为 LM/OM/CNV/TK/TSK/ORG/USR 7 个业务模块添加状态机校验 + 事件发布
- Task 18: 创建 Agent/PromptTemplate/Tool 初始化种子数据

### 4. 工程基线修复

- 统一前端数据请求层：React Query 统一封装，消除直接 fetch 和 axios 混用
- CORS 配置对齐：后端 `main.ts` 明确允许前端开发端口
- 关键开发说明写入仓库文档

### 5. SSOT 回写

- 回写 `00_README_唯一执行入口.md` — 新增模块索引
- 回写 `01_产品范围与阶段地图.md` — 新增驾驶舱/工作台/预警台
- 回写 `02_业务域与模块树.md` — 新增 COR/CMEM/ART/Approval-Center/Takeover-Center/Rollback-Center 模块码
- 回写 `10_AI_Agent_自动化与集成执行规范.md` — 从文档定义到代码实现的对齐说明

### **BREAKING** 变更

- 前端路由新增 `/cockpit`、`/workbench/*`、`/customer-360/:id`、`/risk-signals`
- 侧边栏菜单结构变更
- 后端新增 3 个独立模块（approval-center / takeover-center / rollback-center）

---

## Impact

### Affected specs
- SSOT 00 — 新增模块索引和架构说明
- SSOT 01 — 新增驾驶舱/工作台/预警台产品范围
- SSOT 02 — 新增模块码
- SSOT 10 — AI Agent 代码实现对齐

### Affected code
- `frontend/src/App.tsx` — 路由重构
- `frontend/src/components/Layout.tsx` — 侧边栏重构
- `frontend/src/pages/` — 新增 6 个页面
- `frontend/src/services/` — 统一数据请求层
- `backend/src/main.ts` — CORS 配置
- `backend/src/modules/` — 新增 3 个模块 + 7 个模块状态机/事件改造
- `docs/SSOT/` — 4 个文档回写

---

## ADDED Requirements

### Requirement: 经营驾驶舱

系统 SHALL 提供经营驾驶舱页面，作为系统首页，展示全局 AI 洞察、风险预警、关键经营指标。

#### Scenario: 驾驶舱首页
- **WHEN** 用户登录后进入系统
- **THEN** 首页展示经营驾驶舱，包含：全局 AI 洞察摘要、风险预警列表、关键经营指标（客户总数/活跃客户/待审批/待跟进）、AI Agent 最近执行摘要
- **AND** 首页根路径 `/` 重定向到 `/cockpit`

### Requirement: 工作台分组路由

系统 SHALL 提供工作台分组路由体系，取代传统扁平菜单。

#### Scenario: 客户经营工作台
- **WHEN** 用户进入 `/workbench/customer`
- **THEN** 展示客户列表 + AI 建议的下一步行动 + 风险标记 + 快速跳转客户 360

#### Scenario: 会话与跟进工作台
- **WHEN** 用户进入 `/workbench/conversation`
- **THEN** 展示会话列表 + 智能回复建议 + 跟进任务 + AI 执行状态

#### Scenario: AI 执行流工作台
- **WHEN** 用户进入 `/workbench/ai-runs`
- **THEN** 展示 Agent 执行记录列表 + 执行详情 + 审批/接管/回滚操作

#### Scenario: 审批流工作台
- **WHEN** 用户进入 `/workbench/approvals`
- **THEN** 展示待审批/已审批/已过期审批列表 + 审批操作

### Requirement: 客户 360 视图

系统 SHALL 提供客户 360 视图页面，路径为 `/customer-360/:id`。

#### Scenario: 客户 360 完整视图
- **WHEN** 用户进入 `/customer-360/:id`
- **THEN** 展示客户全维度信息 + 时间线 + 经营记忆（上下文/意图/风险）+ AI 建议 + 关联资源

### Requirement: 风险预警台

系统 SHALL 提供风险/机会/续费/服务预警台页面。

#### Scenario: 预警台展示
- **WHEN** 用户进入 `/risk-signals`
- **THEN** 展示风险信号列表 + 机会信号列表 + 续费预警 + 服务预警，按严重程度排序

### Requirement: 独立审批/接管/回滚中心

系统 SHALL 将审批、接管、回滚逻辑从 ART 模块拆分为独立模块，便于独立演进和权限控制。

#### Scenario: 审批中心独立模块
- **WHEN** 审批相关 API 被调用
- **THEN** 请求路由到独立的 approval-center 模块处理

### Requirement: 工程基线修复

系统 SHALL 统一前端数据请求层，消除 React Query 和直接 fetch/axios 混用问题。

#### Scenario: 统一数据请求
- **WHEN** 前端发起 API 请求
- **THEN** 所有请求通过统一的 api 工具函数，使用一致的错误处理和认证头

#### Scenario: CORS 对齐
- **WHEN** 前端开发服务器（端口 5173）请求后端 API（端口 3000）
- **THEN** 后端 CORS 配置明确允许该端口，请求正常通过

### Requirement: SSOT 回写

系统 SHALL 将本轮架构变更回写到 SSOT 文档。

#### Scenario: SSOT 00 回写
- **WHEN** 新增模块（COR/CMEM/ART/Approval-Center/Takeover-Center/Rollback-Center）
- **THEN** 00_README 更新模块索引

#### Scenario: SSOT 01 回写
- **WHEN** 新增驾驶舱/工作台/预警台页面
- **THEN** 01_产品范围与阶段地图 更新 S1 页面范围

#### Scenario: SSOT 02 回写
- **WHEN** 新增后端模块
- **THEN** 02_业务域与模块树 更新模块码

#### Scenario: SSOT 10 回写
- **WHEN** AI Agent 代码实现完成
- **THEN** 10_AI_Agent_自动化与集成执行规范 更新实现状态

---

## MODIFIED Requirements

### Requirement: 前端路由体系

前端路由从扁平菜单改为工作台分组：
- `/` 重定向到 `/cockpit`（原 `/workbench`）
- `/workbench` 重定向到 `/cockpit`
- 新增 `/cockpit` — 经营驾驶舱
- 新增 `/workbench/customer` — 客户经营工作台（替代 `/customers`）
- 新增 `/workbench/conversation` — 会话与跟进工作台（替代 `/conversations`）
- 新增 `/workbench/ai-runs` — AI 执行流工作台
- 新增 `/workbench/approvals` — 审批流工作台（替代 `/approvals`）
- 新增 `/customer-360/:id` — 客户 360 视图（替代 `/customers/:id/360`）
- 新增 `/risk-signals` — 预警台
- 保留 `/customers`、`/conversations`、`/approvals` 作为兼容别名

---

## REMOVED Requirements

无移除需求。所有现有功能保留，仅扩展和重构路由结构。
