# 第三轮收口修复 Spec

## Why
前两轮搭建了 AI 原生骨架，但存在 4 类真实问题：API 响应契约不一致导致前端到处手写解包、Cockpit 数据流未闭环、AiPromptTemplate.version 与 BaseEntity.version 字段双义冲突、SSOT 主链文档漂移。

## What Changes
- 统一前端 API 响应解包：在 ai-runtime.ts service 层统一解包 `{ code, data }` → `data`
- 新增后端 cockpit 聚合接口 + 前端接通
- 修复 AiPromptTemplate.version 双义冲突：BaseEntity.version → recordVersion，AiPromptTemplate.version → templateVersion
- 回写 SSOT 05/08/02

## Impact
- Affected code: frontend/src/services/ai-runtime.ts, all stores, Cockpit.tsx, Customer360.tsx, backend AiPromptTemplate entity + migration, SSOT docs

## ADDED Requirements

### Requirement: 统一 API 响应解包
ai-runtime.ts 所有方法 SHALL 统一解包后端 `{ code: 'OK', data }` 响应，返回 `data` 部分，页面和 store 不再处理包裹对象。

### Requirement: Cockpit 聚合接口
后端 SHALL 提供 GET /ai-runtime/cockpit 接口，返回 aiInsights / riskSignals / keyMetrics / recentAgentRuns / recommendedTodos 聚合数据。

### Requirement: AiPromptTemplate.version 重命名
AiPromptTemplate 的业务版本字段 SHALL 重命名为 templateVersion，与 BaseEntity 的乐观锁 version 明确区分。

## MODIFIED Requirements

### Requirement: BaseEntity.version
BaseEntity.version 保持不变（乐观锁语义），但 AiPromptTemplate 不再复用此字段名作为业务版本。
