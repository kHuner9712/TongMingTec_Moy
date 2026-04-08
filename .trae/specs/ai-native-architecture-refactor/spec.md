# AI 原生企业级客户经营系统架构重构 Spec

---

## 文档元信息

| 属性 | 内容 |
|------|------|
| 文档名称 | AI 原生架构重构 |
| change-id | ai-native-architecture-refactor |
| 版本号 | v1.0 |
| 状态 | 待审批 |
| 日期 | 2026-04-08 |
| 目标读者 | 技术团队、产品团队 |

---

## Why

当前 MOY 仓库虽然 SSOT 文档已定义了完整的 AI 原生客户经营系统蓝图，但代码实现仍停留在传统企业软件骨架：AI 模块只是附带 mock 的任务执行器，客户模块是扁平 CRUD，前端是页面菜单驱动的工作台。系统的中心不是"客户经营对象 + AI 执行运行时 + 人机协同"，而是"传统业务模块拼装"。必须重构代码架构，让 AI 成为系统运行时内核，让客户经营对象成为系统中心。

---

## A. 当前架构诊断

### A.1 仍是"传统企业软件骨架"的地方

| 诊断项 | 当前状态 | 问题 |
|--------|----------|------|
| 后端模块结构 | 14 个扁平 CRUD 模块（cm/lm/om/cnv/tk/tsk/ntf/chn/ai/aud/sys/auth/org/usr），每个模块只有 entity+service+controller 三件套 | 模块之间无事件驱动、无领域事件、无跨模块编排能力 |
| AI 模块 | `ai.service.ts` 只有 `createSmartReplyTask` + `executeTask` + `generateMockOutput`，全部是 mock 数据 | 无 Agent Registry、无 Capability Contract、无执行模式（suggest/assist/auto/approval）、无审批流、无回滚、无接管 |
| 客户模块 | `Customer` 实体只有 name/industry/level/phone/email/address/remark/status 等扁平字段 | 无 Timeline、无 Memory、无 Context、无 Intent、无 Risk、无 NextAction |
| 前端 Layout | 传统侧边栏菜单 + 页面路由，Dashboard 只是统计数字 + 快捷入口 | 无 AI Copilot、无客户 360 时间线、无审批收件箱、无人机协同工作台 |
| 状态机 | `CmService.changeStatus` 直接 `updateCustomer({ status })`，无状态校验 | 状态迁移无合法性校验、无审计写入、无事件发布 |
| 事件系统 | WebSocket Gateway 只做消息/通知推送，无领域事件 | 无 Event Bus、无 Event-Driven 架构、模块间无松耦合通信 |
| 前端状态管理 | 只有 `authStore`，无业务 store | 无 AI 状态、无客户上下文、无审批队列、无工作台状态 |

### A.2 已具备 AI Native 基础的地方

| 基础项 | 当前状态 | 可复用度 |
|--------|----------|----------|
| SSOT 文档体系 | 00~13 完整定义了 AI Agent 体系、审批流、回滚接管、状态机、权限边界 | ★★★★★ 直接作为实现输入 |
| BaseEntity | 含 id/orgId/createdAt/updatedAt/deletedAt/version，支持乐观并发与软删除 | ★★★★★ 直接复用 |
| 多租户隔离 | org_id 全局隔离 + TenantGuard | ★★★★★ 直接复用 |
| 权限系统 | RBAC + Permissions Decorator + RolesGuard + DataScope | ★★★★☆ 需扩展 AI 权限边界 |
| 审计模块 | AuditLog 实体 + AudService | ★★★★☆ 需扩展 AI 审计字段 |
| WebSocket | EventsGateway + Socket.IO | ★★★★☆ 需扩展领域事件推送 |
| 技术栈 | NestJS + TypeORM + PostgreSQL + React + Ant Design + Zustand + React Query | ★★★★★ 完全符合要求 |

### A.3 必须重构才能让 AI 成为系统内核的地方

| 重构项 | 当前 → 目标 | 优先级 |
|--------|-------------|--------|
| AI 模块 → Agent Runtime | mock task runner → Agent Registry + Capability Contract + Execution Engine + Approval + Rollback + Takeover | P0 |
| 客户模块 → Customer Operating Record | 扁平 CRUD → Customer 360 + Timeline + Memory + Context | P0 |
| 前端 Dashboard → Human-AI Workbench | 统计面板 → AI Copilot + 审批收件箱 + 客户时间线 + 待办驱动 | P0 |
| 状态机强制执行 | 隐式状态变更 → 显式状态机校验 + 审计 + 事件发布 | P1 |
| 事件驱动架构 | 无 → DomainEvent + EventBus + 跨模块事件订阅 | P1 |
| 前端 Store 扩展 | authStore → + aiStore + customerContextStore + approvalStore + workbenchStore | P1 |

---

## B. 目标架构（5 层）

### B.1 架构总图

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 5: Human-AI Workbench 人机协同工作台层                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ AI Copilot│ │ Approval │ │ Customer │ │ Action Center    │   │
│  │ Panel     │ │ Inbox    │ │ 360 View │ │ (待办/提醒/建议)  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: Agent Runtime AI 执行运行时层                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Agent    │ │ Approval │ │ Rollback │ │ Takeover         │   │
│  │ Registry │ │ Engine   │ │ Engine   │ │ Engine           │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ Execution│ │ Prompt   │ │ Tool     │                       │
│  │ Engine   │ │ Template │ │ Calling  │                       │
│  └──────────┘ └──────────┘ └──────────┘                       │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Customer Memory 经营记忆层                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Context  │ │ Intent   │ │ Risk     │ │ NextAction       │   │
│  │ Memory   │ │ Tracker  │ │ Assessor │ │ Recommender      │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: Customer Operating Record 经营对象层                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Customer │ │ Timeline │ │ Operating│ │ Relationship     │   │
│  │ 360      │ │ Event    │ │ Record   │ │ Graph            │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: Domain Resource 业务资源层（现有模块重构）              │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│  │CM  │ │LM  │ │OM  │ │CNV │ │TK  │ │TSK │ │NTF │ │CHN │    │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                          │
│  │AUTH│ │ORG │ │USR │ │AUD │ │SYS │                          │
│  └────┘ └────┘ └────┘ └────┘ └────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### B.2 各层职责

#### Layer 1: Customer Operating Record / Customer 360 / Timeline 经营对象层
- **Customer 360**：客户全维度聚合视图，聚合客户基本信息 + 联系人 + 关联线索 + 关联商机 + 关联会话 + 关联工单 + 关联合同 + 关联订单
- **Timeline**：客户经营时间线，记录所有客户相关事件（沟通、跟进、状态变更、AI 建议、审批结果等）
- **Operating Record**：经营记录，每次与客户的交互都形成一条经营记录，包含交互类型、内容、AI 建议、人工决策
- **Relationship Graph**：客户关系图谱，客户-联系人-线索-商机-合同-订单的关联关系

#### Layer 2: Customer Memory / Context / Intent / Risk / Next Action 经营记忆层
- **Context Memory**：客户上下文记忆，累积客户偏好、历史沟通摘要、关键决策点
- **Intent Tracker**：客户意图追踪，识别客户当前意图（咨询、投诉、购买、续费、流失等）
- **Risk Assessor**：客户风险评估，基于行为模式评估流失风险、商机风险、SLA 风险
- **Next Action Recommender**：下一步行动推荐，基于上下文 + 意图 + 风险推荐最佳下一步动作

#### Layer 3: Agent Runtime / Approval / Rollback / Takeover / Audit AI 执行运行时层
- **Agent Registry**：Agent 注册表，每个 Agent 声明 capability contract（resource_scope / tool_scope / execution_mode / risk_level / input_schema / output_schema）
- **Execution Engine**：Agent 执行引擎，根据 execution_mode（suggest/assist/auto/approval）执行 Agent 逻辑
- **Approval Engine**：审批引擎，高风险 AI 操作必须经过审批
- **Rollback Engine**：回滚引擎，AI 自动写入的结果可回滚
- **Takeover Engine**：接管引擎，超时/低置信度/高风险时触发人工接管
- **Prompt Template**：Prompt 模板管理，模板化存储，不允许代码内硬编码
- **Tool Calling**：工具调用管理，AI 可调用的工具注册与权限校验

#### Layer 4: Domain Resource 业务资源层
- 现有 14 个模块保留，但重构为：
  - 状态机强制校验
  - 领域事件发布
  - AI 可观测性接入点
  - 审计写入规范化

#### Layer 5: Human-AI Workbench 人机协同工作台层
- **AI Copilot Panel**：全局 AI 助手面板，可基于当前上下文给出建议
- **Approval Inbox**：审批收件箱，AI 发起的审批请求集中处理
- **Customer 360 View**：客户 360 视图 + 时间线 + 经营记忆
- **Action Center**：待办/提醒/建议驱动的工作中心

### B.3 数据流

```
用户操作 / AI 建议
    ↓
Domain Resource Layer (状态校验 + 事件发布)
    ↓
Customer Operating Record Layer (Timeline 事件追加 + 360 聚合更新)
    ↓
Customer Memory Layer (上下文更新 + 意图识别 + 风险评估 + 下一步推荐)
    ↓
Agent Runtime Layer (根据推荐触发 Agent / 审批 / 回滚 / 接管)
    ↓
Human-AI Workbench Layer (实时推送 + 工作台更新)
```

---

## What Changes

### 新增后端模块

- `backend/src/modules/cor/` — Customer Operating Record（客户经营记录层）
  - entities: `customer-timeline-event.entity.ts`, `customer-operating-record.entity.ts`, `customer-360.entity.ts`
  - services: `cor.service.ts`, `timeline.service.ts`, `customer-360.service.ts`
  - controller: `cor.controller.ts`
  - module: `cor.module.ts`

- `backend/src/modules/cmem/` — Customer Memory（客户经营记忆层）
  - entities: `customer-context.entity.ts`, `customer-intent.entity.ts`, `customer-risk.entity.ts`, `customer-next-action.entity.ts`
  - services: `cmem.service.ts`, `context.service.ts`, `intent.service.ts`, `risk.service.ts`, `next-action.service.ts`
  - controller: `cmem.controller.ts`
  - module: `cmem.module.ts`

- `backend/src/modules/art/` — Agent Runtime（AI 执行运行时层）
  - entities: `ai-agent.entity.ts`, `ai-agent-run.entity.ts`, `ai-approval-request.entity.ts`, `ai-rollback.entity.ts`, `ai-takeover.entity.ts`, `ai-prompt-template.entity.ts`, `ai-tool.entity.ts`
  - services: `agent-registry.service.ts`, `execution-engine.service.ts`, `approval-engine.service.ts`, `rollback-engine.service.ts`, `takeover-engine.service.ts`, `prompt-template.service.ts`, `tool-calling.service.ts`
  - controller: `art.controller.ts`
  - module: `art.module.ts`

- `backend/src/common/events/` — 领域事件系统
  - `domain-event.ts` — 领域事件基类
  - `event-bus.service.ts` — 进程内事件总线
  - `events/` — 各模块领域事件定义

### 重构后端模块

- `backend/src/modules/ai/` — 从 mock task runner 重构为 Agent Runtime 的入口适配层
  - 保留 `AITask` 实体，但执行逻辑委托给 `art` 模块
  - `ai.service.ts` 改为调用 `ExecutionEngine`
  - `ai.controller.ts` 扩展 Agent 管理 API

- `backend/src/modules/cm/` — 扩展客户模块
  - `customer.entity.ts` 新增 `contextSnapshot` / `intentSummary` / `riskLevel` / `nextActionSuggestion` 字段
  - `cm.service.ts` 新增状态机校验 + 事件发布

- 所有业务模块 — 状态机强制校验 + 领域事件发布

### 新增前端模块

- `frontend/src/pages/Workbench.tsx` — 人机协同工作台（替代 Dashboard）
- `frontend/src/pages/Customer360.tsx` — 客户 360 视图 + 时间线
- `frontend/src/pages/ApprovalInbox.tsx` — 审批收件箱
- `frontend/src/pages/AgentHub.tsx` — Agent 管理中心
- `frontend/src/components/AiCopilot/` — AI Copilot 全局面板组件
- `frontend/src/components/CustomerTimeline/` — 客户时间线组件
- `frontend/src/stores/aiStore.ts` — AI 状态管理
- `frontend/src/stores/customerContextStore.ts` — 客户上下文状态
- `frontend/src/stores/approvalStore.ts` — 审批队列状态
- `frontend/src/stores/workbenchStore.ts` — 工作台状态
- `frontend/src/services/agent.ts` — Agent API 服务
- `frontend/src/services/customer-memory.ts` — 客户记忆 API 服务
- `frontend/src/services/approval.ts` — 审批 API 服务

### 重构前端模块

- `frontend/src/App.tsx` — 路由重构，新增工作台/客户360/审批/Agent路由
- `frontend/src/components/Layout.tsx` — 侧边栏重构，突出 AI 工作台入口
- `frontend/src/pages/Dashboard.tsx` — 重构为 Workbench
- `frontend/src/pages/Customers.tsx` — 新增跳转 Customer360 入口
- `frontend/src/types/index.ts` — 新增 Agent/Memory/Approval/Workbench 类型

### **BREAKING** 变更

- `AI` 模块从独立 task runner 变为 Agent Runtime 入口，原有 `POST /api/v1/ai/smart-reply` 接口行为不变但内部委托给 Agent Runtime
- `Customer` 实体新增字段，需要数据库 migration
- 前端路由新增 `/workbench`、`/customers/:id/360`、`/approvals`、`/agents`

---

## Impact

### Affected specs
- SSOT 02_业务域与模块树：新增 COR / CMEM / ART 模块码
- SSOT 05_对象模型与数据库设计：新增表定义
- SSOT 06_状态机总表：新增 AI Agent / Approval 状态机实现
- SSOT 08_API契约与Schema字典：新增 API
- SSOT 09_页面与交互规格：新增工作台/客户360/审批页面
- SSOT 10_AI_Agent_自动化与集成执行规范：从文档定义到代码实现

### Affected code
- `backend/src/app.module.ts` — 注册新模块
- `backend/src/modules/ai/*` — 重构
- `backend/src/modules/cm/*` — 扩展
- `backend/src/common/*` — 新增事件系统
- `frontend/src/App.tsx` — 路由重构
- `frontend/src/components/Layout.tsx` — 布局重构
- `frontend/src/pages/*` — 新增/重构页面
- `frontend/src/stores/*` — 新增 store
- `frontend/src/services/*` — 新增 service
- `frontend/src/types/*` — 扩展类型

---

## ADDED Requirements

### Requirement: Customer Operating Record Layer

系统 SHALL 提供客户经营记录层，作为客户全生命周期经营数据的聚合与时间线中心。

#### Scenario: 客户时间线事件追加
- **WHEN** 任何业务模块产生与客户相关的事件（沟通、跟进、状态变更、AI 建议等）
- **THEN** 系统自动追加一条 Timeline Event 到该客户的时间线
- **AND** Timeline Event 包含 eventType / eventSource / eventPayload / occurredAt / actorType / actorId

#### Scenario: Customer 360 聚合视图
- **WHEN** 用户查看客户 360 视图
- **THEN** 系统聚合客户基本信息 + 联系人 + 关联线索 + 关联商机 + 关联会话 + 关联工单 + 最新上下文记忆 + 当前意图 + 风险等级 + 下一步建议
- **AND** 聚合数据通过 API 一次性返回

#### Scenario: 经营记录创建
- **WHEN** 用户或 AI 与客户发生交互
- **THEN** 系统创建一条经营记录，记录交互类型、内容、AI 建议、人工决策
- **AND** 经营记录追加到客户时间线

### Requirement: Customer Memory Layer

系统 SHALL 提供客户经营记忆层，持续积累客户上下文、识别意图、评估风险、推荐下一步行动。

#### Scenario: 客户上下文记忆更新
- **WHEN** 客户相关的经营记录被追加
- **THEN** 系统更新客户的上下文记忆（偏好、历史摘要、关键决策点）
- **AND** 上下文记忆以 jsonb 存储，支持增量更新

#### Scenario: 客户意图识别
- **WHEN** 新的会话消息或经营记录产生
- **THEN** 系统通过 AI 识别客户当前意图（咨询/投诉/购买/续费/流失等）
- **AND** 意图结果包含 intentType / confidence / evidence

#### Scenario: 客户风险评估
- **WHEN** 客户行为模式发生变化（沉默期延长、商机停滞、SLA 违规等）
- **THEN** 系统评估客户风险等级（low/medium/high/critical）
- **AND** 风险评估结果包含 riskLevel / riskFactors / suggestedActions

#### Scenario: 下一步行动推荐
- **WHEN** 客户上下文 + 意图 + 风险发生变化
- **THEN** 系统推荐最佳下一步动作（跟进/报价/续费提醒/流失挽回等）
- **AND** 推荐结果包含 actionType / priority / reasoning / suggestedBy

### Requirement: Agent Runtime Layer

系统 SHALL 提供 AI Agent 执行运行时层，实现 Agent Registry、Execution Engine、Approval、Rollback、Takeover 的完整闭环。

#### Scenario: Agent 注册与查询
- **WHEN** 管理员注册新 Agent
- **THEN** Agent 必须声明 capability contract（agent_code / resource_scope / tool_scope / execution_mode / risk_level / input_schema / output_schema / requires_approval / rollback_strategy / takeover_strategy）
- **AND** Agent 注册后状态为 draft，需激活后才可执行

#### Scenario: Agent 执行 - suggest 模式
- **WHEN** Agent 以 suggest 模式执行
- **THEN** 只生成建议，不自动提交任何业务终态
- **AND** 建议结果返回给前端展示

#### Scenario: Agent 执行 - assist 模式
- **WHEN** Agent 以 assist 模式执行
- **THEN** 可生成草稿或中间结果，由人工确认后才提交
- **AND** 确认前不写入业务终态

#### Scenario: Agent 执行 - auto 模式
- **WHEN** Agent 以 auto 模式执行且 risk_level 为 low
- **THEN** 可自动执行低风险动作
- **AND** 执行结果写入审计日志

#### Scenario: Agent 执行 - approval 模式
- **WHEN** Agent 以 approval 模式执行
- **THEN** 自动准备动作，但必须审批后才执行
- **AND** 审批请求包含 resource_type / resource_id / requested_action / risk_level / before_snapshot / proposed_after_snapshot / explanation

#### Scenario: AI 审批流
- **WHEN** 高风险 AI 操作触发审批
- **THEN** 审批请求进入 Approval Inbox
- **AND** 审批人可 approve / reject，审批结果写入审计
- **AND** 审批超时自动 expired

#### Scenario: AI 回滚
- **WHEN** AI 自动写入的结果需要回滚
- **THEN** 系统基于 before_snapshot 回滚到变更前状态
- **AND** 回滚结果写入 ai_rollbacks 表
- **AND** 不回滚人工确认后的手工编辑

#### Scenario: 人工接管
- **WHEN** 命中超时重试失败 / 置信度低于阈值 / P0P1 风险动作 / 并发变化 / 审批拒绝
- **THEN** 系统触发人工接管
- **AND** 锁定当前 AI run，记录接管人和接管原因
- **AND** 页面显式显示"已人工接管"

### Requirement: Human-AI Workbench Layer

系统 SHALL 提供人机协同工作台层，以 AI Copilot + 审批收件箱 + 客户 360 + 待办驱动取代传统统计面板。

#### Scenario: 工作台首页
- **WHEN** 用户登录后进入工作台
- **THEN** 首页展示：待办事项（AI 建议的下一步 + 人工待办）+ 待审批项 + 待处理会话/工单 + AI 洞察摘要
- **AND** 首页根路径 `/` 重定向到 `/workbench`

#### Scenario: AI Copilot 全局面板
- **WHEN** 用户在任何页面点击 AI Copilot
- **THEN** 右侧滑出 AI 助手面板，基于当前上下文给出建议
- **AND** 建议包含：当前客户摘要 + 下一步建议 + 风险提醒 + 智能回复

#### Scenario: 审批收件箱
- **WHEN** 有 AI 发起的审批请求
- **THEN** 审批收件箱显示待审批项列表
- **AND** 审批人可查看详情、approve / reject

#### Scenario: 客户 360 视图
- **WHEN** 用户点击客户进入 360 视图
- **THEN** 展示客户全维度信息 + 时间线 + 经营记忆 + AI 建议
- **AND** 时间线按时间倒序展示所有经营事件

### Requirement: Domain Event System

系统 SHALL 提供领域事件系统，实现模块间松耦合通信。

#### Scenario: 领域事件发布
- **WHEN** 业务模块执行写操作（创建/更新/状态变更）
- **THEN** 发布对应的领域事件
- **AND** 事件包含 eventType / aggregateType / aggregateId / payload / occurredAt / orgId

#### Scenario: 事件订阅
- **WHEN** 其他模块需要响应某类事件
- **THEN** 通过 EventBus 订阅事件
- **AND** 订阅者异步处理事件

#### Scenario: Timeline 事件自动追加
- **WHEN** 任何与客户相关的领域事件发布
- **THEN** COR 模块自动订阅并追加到客户时间线

### Requirement: State Machine Enforcement

系统 SHALL 强制执行状态机校验，禁止非法状态迁移。

#### Scenario: 状态迁移校验
- **WHEN** 业务模块执行状态变更
- **THEN** 必须经过状态机校验，非法迁移返回 STATUS_TRANSITION_INVALID
- **AND** 合法迁移写入审计日志

#### Scenario: 状态迁移事件发布
- **WHEN** 状态迁移成功
- **THEN** 发布状态变更领域事件
- **AND** 事件包含 fromStatus / toStatus / reason

---

## MODIFIED Requirements

### Requirement: AI Module Architecture

AI 模块从独立 mock task runner 变为 Agent Runtime 的入口适配层：
- 保留 `AITask` 实体和 `POST /api/v1/ai/smart-reply` 接口
- 执行逻辑委托给 `art` 模块的 `ExecutionEngine`
- 新增 Agent 管理 API（注册/查询/激活/暂停/归档）
- 新增审批 API（查询/审批/拒绝）
- 新增回滚 API（执行回滚/查询回滚记录）
- 新增接管 API（执行接管/查询接管记录）

### Requirement: Customer Entity

Customer 实体扩展：
- 新增 `context_snapshot jsonb` — 客户上下文快照
- 新增 `intent_summary varchar(255)` — 当前意图摘要
- 新增 `risk_level varchar(16)` — 风险等级
- 新增 `next_action_suggestion jsonb` — 下一步建议

### Requirement: Frontend Routing

前端路由重构：
- `/` 重定向到 `/workbench`（原 `/dashboard`）
- 新增 `/workbench` — 人机协同工作台
- 新增 `/customers/:id/360` — 客户 360 视图
- 新增 `/approvals` — 审批收件箱
- 新增 `/agents` — Agent 管理中心
- 保留 `/dashboard` 作为 `/workbench` 的别名

---

## REMOVED Requirements

无移除的需求。所有现有功能保留，仅扩展和重构。
