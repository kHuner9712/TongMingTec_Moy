# Tasks — AI 原生架构重构

## 第一阶段：基础设施与骨架

- [x] Task 1: 创建领域事件系统（Domain Event System）
  - [x] SubTask 1.1: 创建 `backend/src/common/events/domain-event.ts`
  - [x] SubTask 1.2: 创建 `backend/src/common/events/event-bus.service.ts`
  - [x] SubTask 1.3: 创建 `backend/src/common/events/events.module.ts`
  - [x] SubTask 1.4: 创建 `backend/src/common/events/events/` 目录，定义核心领域事件

- [x] Task 2: 创建状态机校验基础设施
  - [x] SubTask 2.1: 创建 `backend/src/common/statemachine/state-machine.ts`
  - [x] SubTask 2.2: 创建 `backend/src/common/statemachine/state-machine.module.ts`
  - [x] SubTask 2.3: 为 S1 核心实体创建状态机定义文件

- [x] Task 3: 创建 Customer Operating Record 模块（COR）
  - [x] SubTask 3.1: 创建 `backend/src/modules/cor/` 目录结构
  - [x] SubTask 3.2: 创建 `cor.module.ts`
  - [x] SubTask 3.3: 创建 `entities/customer-timeline-event.entity.ts`
  - [x] SubTask 3.4: 创建 `entities/customer-operating-record.entity.ts`
  - [x] SubTask 3.5: 创建 `services/timeline.service.ts`
  - [x] SubTask 3.6: 创建 `services/customer-360.service.ts`
  - [x] SubTask 3.7: 创建 `services/operating-record.service.ts`
  - [x] SubTask 3.8: 创建 `cor.controller.ts`
  - [x] SubTask 3.9: 创建 `dto/`

- [x] Task 4: 创建 Customer Memory 模块（CMEM）
  - [x] SubTask 4.1: 创建 `backend/src/modules/cmem/` 目录结构
  - [x] SubTask 4.2: 创建 `cmem.module.ts`
  - [x] SubTask 4.3: 创建 `entities/customer-context.entity.ts`
  - [x] SubTask 4.4: 创建 `entities/customer-intent.entity.ts`
  - [x] SubTask 4.5: 创建 `entities/customer-risk.entity.ts`
  - [x] SubTask 4.6: 创建 `entities/customer-next-action.entity.ts`
  - [x] SubTask 4.7: 创建 `services/context.service.ts`
  - [x] SubTask 4.8: 创建 `services/intent.service.ts`
  - [x] SubTask 4.9: 创建 `services/risk.service.ts`
  - [x] SubTask 4.10: 创建 `services/next-action.service.ts`
  - [x] SubTask 4.11: 创建 `cmem.controller.ts`
  - [x] SubTask 4.12: 创建 `dto/`

- [x] Task 5: 创建 Agent Runtime 模块（ART）
  - [x] SubTask 5.1: 创建 `backend/src/modules/art/` 目录结构
  - [x] SubTask 5.2: 创建 `art.module.ts`
  - [x] SubTask 5.3: 创建 `entities/ai-agent.entity.ts`
  - [x] SubTask 5.4: 创建 `entities/ai-agent-run.entity.ts`
  - [x] SubTask 5.5: 创建 `entities/ai-approval-request.entity.ts`
  - [x] SubTask 5.6: 创建 `entities/ai-rollback.entity.ts`
  - [x] SubTask 5.7: 创建 `entities/ai-takeover.entity.ts`
  - [x] SubTask 5.8: 创建 `entities/ai-prompt-template.entity.ts`
  - [x] SubTask 5.9: 创建 `entities/ai-tool.entity.ts`
  - [x] SubTask 5.10: 创建 `services/agent-registry.service.ts`
  - [x] SubTask 5.11: 创建 `services/execution-engine.service.ts`
  - [x] SubTask 5.12: 创建 `services/approval-engine.service.ts`
  - [x] SubTask 5.13: 创建 `services/rollback-engine.service.ts`
  - [x] SubTask 5.14: 创建 `services/takeover-engine.service.ts`
  - [x] SubTask 5.15: 创建 `services/prompt-template.service.ts`
  - [x] SubTask 5.16: 创建 `services/tool-calling.service.ts`
  - [x] SubTask 5.17: 创建 `art.controller.ts`
  - [x] SubTask 5.18: 创建 `dto/`

## 第二阶段：现有模块重构

- [x] Task 6: 重构 AI 模块为 Agent Runtime 入口适配层
  - [x] SubTask 6.1: 修改 `backend/src/modules/ai/ai.service.ts` — 委托给 ExecutionEngine
  - [x] SubTask 6.2: 修改 `backend/src/modules/ai/ai.module.ts` — 导入 ArtModule
  - [x] SubTask 6.3: 修改 `backend/src/modules/ai/ai.controller.ts`
  - [x] SubTask 6.4: 修改 `backend/src/modules/ai/entities/ai-task.entity.ts` — 新增 agentRunId 字段

- [x] Task 7: 扩展客户模块（CM）
  - [x] SubTask 7.1: 修改 `customer.entity.ts` — 新增 contextSnapshot / intentSummary / riskLevel / nextActionSuggestion 字段
  - [x] SubTask 7.2: 修改 `cm.service.ts` — changeStatus 加入状态机校验 + 事件发布
  - [x] SubTask 7.3: 修改 `cm.module.ts` — 导入 EventsModule

- [ ] Task 8: 为所有 S1 业务模块添加状态机校验 + 事件发布
  - [ ] SubTask 8.1: 修改 `backend/src/modules/lm/lm.service.ts`
  - [ ] SubTask 8.2: 修改 `backend/src/modules/om/om.service.ts`
  - [ ] SubTask 8.3: 修改 `backend/src/modules/cnv/cnv.service.ts`
  - [ ] SubTask 8.4: 修改 `backend/src/modules/tk/tk.service.ts`
  - [ ] SubTask 8.5: 修改 `backend/src/modules/tsk/tsk.service.ts`
  - [ ] SubTask 8.6: 修改 `backend/src/modules/org/org.service.ts`
  - [ ] SubTask 8.7: 修改 `backend/src/modules/usr/usr.service.ts`

- [x] Task 9: 注册新模块到 AppModule
  - [x] SubTask 9.1: 修改 `backend/src/app.module.ts` — 导入 EventsModule + CorModule + CmemModule + ArtModule

- [x] Task 10: 创建数据库 Migration
  - [x] SubTask 10.1: 创建 migration 文件

## 第三阶段：前端重构

- [x] Task 11: 前端类型扩展
  - [x] SubTask 11.1: 修改 `frontend/src/types/index.ts`

- [x] Task 12: 前端 Store 扩展
  - [x] SubTask 12.1: 创建 `frontend/src/stores/aiStore.ts`
  - [x] SubTask 12.2: 创建 `frontend/src/stores/customerContextStore.ts`
  - [x] SubTask 12.3: 创建 `frontend/src/stores/approvalStore.ts`
  - [x] SubTask 12.4: 创建 `frontend/src/stores/workbenchStore.ts`

- [x] Task 13: 前端 Service 扩展
  - [x] SubTask 13.1: 创建 `frontend/src/services/agent.ts`
  - [x] SubTask 13.2: 创建 `frontend/src/services/customer-memory.ts`
  - [x] SubTask 13.3: 创建 `frontend/src/services/approval.ts`
  - [x] SubTask 13.4: 创建 `frontend/src/services/cor.ts`

- [x] Task 14: 前端页面创建
  - [x] SubTask 14.1: 创建 `frontend/src/pages/Workbench.tsx`
  - [x] SubTask 14.2: 创建 `frontend/src/pages/Customer360.tsx`
  - [x] SubTask 14.3: 创建 `frontend/src/pages/ApprovalInbox.tsx`
  - [x] SubTask 14.4: 创建 `frontend/src/pages/AgentHub.tsx`

- [x] Task 15: 前端组件创建
  - [x] SubTask 15.1: 创建 `frontend/src/components/AiCopilot/`
  - [x] SubTask 15.2: 创建 `frontend/src/components/CustomerTimeline/`

- [x] Task 16: 前端路由与布局重构
  - [x] SubTask 16.1: 修改 `frontend/src/App.tsx`
  - [x] SubTask 16.2: 修改 `frontend/src/components/Layout.tsx`

## 第四阶段：集成与验证

- [x] Task 17: 领域事件订阅集成
  - [x] SubTask 17.1: COR TimelineService 已订阅客户相关领域事件
  - [x] SubTask 17.2: CMEM 模块预留事件订阅接口
  - [x] SubTask 17.3: ART 审批超时检查已实现

- [ ] Task 18: 初始化数据
  - [ ] SubTask 18.1: 创建 Agent 初始化种子数据
  - [ ] SubTask 18.2: 创建 Prompt Template 初始化种子数据
  - [ ] SubTask 18.3: 创建 Tool 初始化种子数据

- [x] Task 19: 验证与测试
  - [x] SubTask 19.1: 验证后端编译通过
  - [x] SubTask 19.2: 验证前端编译通过
  - [ ] SubTask 19.3: 验证状态机校验（需运行时验证）
  - [ ] SubTask 19.4: 验证领域事件发布与订阅（需运行时验证）
  - [ ] SubTask 19.5: 验证 Agent 执行（需运行时验证）
  - [ ] SubTask 19.6: 验证审批流（需运行时验证）
  - [ ] SubTask 19.7: 验证前端页面渲染（需运行时验证）

# Task Dependencies

- Task 1 (事件系统) → Task 3 (COR) / Task 4 (CMEM) / Task 5 (ART) / Task 8 (业务模块重构)
- Task 2 (状态机) → Task 7 (CM 扩展) / Task 8 (业务模块重构)
- Task 3 (COR) → Task 17 (事件订阅集成)
- Task 4 (CMEM) → Task 17 (事件订阅集成)
- Task 5 (ART) → Task 6 (AI 模块重构) / Task 18 (初始化数据)
- Task 6 (AI 重构) 依赖 Task 5 (ART)
- Task 7 (CM 扩展) 依赖 Task 2 (状态机) + Task 1 (事件系统)
- Task 8 (业务模块重构) 依赖 Task 1 + Task 2
- Task 9 (AppModule) 依赖 Task 3 + Task 4 + Task 5
- Task 10 (Migration) 依赖 Task 3 + Task 4 + Task 5 + Task 7
- Task 11~16 (前端) 可与 Task 3~10 (后端) 并行
- Task 17 (集成) 依赖 Task 3 + Task 4 + Task 5
- Task 18 (初始化) 依赖 Task 5
- Task 19 (验证) 依赖所有前置 Task
