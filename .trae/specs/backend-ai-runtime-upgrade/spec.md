# 后端 AI 原生架构升级 Spec

## Why
当前后端已有 COR/CMEM/ART/APC/TKC/RBC 六个 AI 原生模块的骨架，但存在三个关键缺口：
1. 缺少 `CustomerStateSnapshot` 实体，无法追踪客户状态快照与变更对比
2. ART 核心实体（AiAgentRun/AiApprovalRequest/AiRollback/AiTakeover）缺少 `customerId` 字段，无法建立"客户经营主线"关系
3. 缺少 `ai-runtime` 统一门面模块，API 散落在 /art、/cor、/cmem 三个前缀下，不符合"AI 运行时驱动"的主叙事

## What Changes
- 新增 `CustomerStateSnapshot` 实体到 COR 模块
- 为 ART 4 个核心实体新增 `customerId` 字段 + 索引
- 新增 `ai-runtime` 门面模块，统一暴露 /ai-runtime/* API
- 新增 `StateMachineError` 全局异常过滤器，映射为 HTTP 400
- 新增数据库迁移覆盖新字段和新实体
- 修正 main.ts / app.module.ts 工程问题
- 补充关键注释

## Impact
- Affected specs: SSOT 02（模块树）、05（对象模型）、08（API 契约）
- Affected code: backend/src/modules/art/entities/*, backend/src/modules/cor/*, backend/src/modules/ai-runtime/*(新), backend/src/common/*, backend/src/main.ts, backend/src/app.module.ts

## ADDED Requirements

### Requirement: CustomerStateSnapshot
系统 SHALL 提供 `CustomerStateSnapshot` 实体，记录客户在某一时间点的完整状态快照，用于 AI 执行前后的状态对比和回滚依据。

#### Scenario: AI 执行前自动创建快照
- **WHEN** AI Agent Run 对某客户执行写操作
- **THEN** 系统在执行前自动创建该客户的状态快照，关联到 agentRunId

### Requirement: AI Runtime 统一门面
系统 SHALL 提供 `/ai-runtime/*` API 前缀，作为 AI 运行时的统一入口，聚合 ART/COR/CMEM 的核心能力。

#### Scenario: 通过统一入口获取客户 360 视图
- **WHEN** 前端请求 GET /ai-runtime/customers/:id/360
- **THEN** 返回包含客户基本信息 + 经营记录 + 记忆上下文 + AI 运行历史的聚合视图

### Requirement: 客户经营主线关系
所有 AI 核心对象（AiAgentRun/AiApprovalRequest/AiRollback/AiTakeover）SHALL 包含 `customerId` 字段，建立与客户经营主线的显式关联。

### Requirement: StateMachineError 全局异常过滤
系统 SHALL 将 `StateMachineError` 自动映射为 HTTP 400 BadRequestException 响应。

## MODIFIED Requirements

### Requirement: AiAgentRun 实体
新增字段：`customerId: string`（uuid, indexed, nullable），关联到客户经营主线

### Requirement: AiApprovalRequest 实体
新增字段：`customerId: string`（uuid, indexed, nullable），关联到客户经营主线

### Requirement: AiRollback 实体
新增字段：`customerId: string`（uuid, indexed, nullable），关联到客户经营主线

### Requirement: AiTakeover 实体
新增字段：`customerId: string`（uuid, indexed, nullable），关联到客户经营主线
