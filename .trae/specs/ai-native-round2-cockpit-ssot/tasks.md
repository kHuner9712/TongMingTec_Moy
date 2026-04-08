# Tasks — AI 原生架构第二轮重构

## 第一组：前端路由与页面骨架升级

- [x] Task 1: 创建经营驾驶舱页面
  - [x] SubTask 1.1: 创建 `frontend/src/pages/Cockpit.tsx` — 经营驾驶舱，包含全局 AI 洞察区 / 风险预警区 / 关键指标区 / Agent 执行摘要区
  - [x] SubTask 1.2: 创建 `frontend/src/stores/cockpitStore.ts` — 驾驶舱状态管理，包含 aiInsights / riskSignals / keyMetrics / recentAgentRuns

- [x] Task 2: 创建工作台分组页面
  - [x] SubTask 2.1: 创建 `frontend/src/pages/workbench/CustomerWorkbench.tsx` — 客户经营工作台，包含客户列表 + AI 建议下一步 + 风险标记 + 快速跳转 360
  - [x] SubTask 2.2: 创建 `frontend/src/pages/workbench/ConversationWorkbench.tsx` — 会话与跟进工作台，包含会话列表 + 智能回复 + 跟进任务
  - [x] SubTask 2.3: 创建 `frontend/src/pages/workbench/AiRunsWorkbench.tsx` — AI 执行流工作台，包含 Agent 执行记录 + 执行详情 + 审批/接管/回滚操作
  - [x] SubTask 2.4: 创建 `frontend/src/pages/workbench/ApprovalWorkbench.tsx` — 审批流工作台，包含待审批/已审批/已过期列表 + 审批操作

- [x] Task 3: 创建风险预警台页面
  - [x] SubTask 3.1: 创建 `frontend/src/pages/RiskSignals.tsx` — 风险/机会/续费/服务预警台
  - [x] SubTask 3.2: 创建 `frontend/src/services/risk-signal.ts` — 预警 API 服务

- [x] Task 4: 重构前端路由体系
  - [x] SubTask 4.1: 修改 `frontend/src/App.tsx` — 新增 /cockpit /workbench/customer /workbench/conversation /workbench/ai-runs /workbench/approvals /customer-360/:id /risk-signals 路由；`/` 重定向到 `/cockpit`；保留旧路由作为兼容别名
  - [x] SubTask 4.2: 修改 `frontend/src/components/Layout.tsx` — 侧边栏菜单重构为工作台分组：驾驶舱 / 客户经营 / 会话跟进 / AI 执行流 / 审批流 / 预警台 / Agent 管理 / 系统管理

## 第二组：后端独立模块拆分

- [x] Task 5: 创建审批中心模块（approval-center）
  - [x] SubTask 5.1: 创建 `backend/src/modules/approval-center/` 目录结构
  - [x] SubTask 5.2: 创建 `approval-center.module.ts` — 导入 AiApprovalRequest 实体
  - [x] SubTask 5.3: 创建 `services/approval-center.service.ts` — 从 ART ApprovalEngineService 迁移逻辑，新增 getPendingCount / getApprovalStats 方法
  - [x] SubTask 5.4: 创建 `approval-center.controller.ts` — API 端点：GET /approval-center/pending / GET /approval-center/stats / POST /approval-center/:id/approve / POST /approval-center/:id/reject
  - [x] SubTask 5.5: 创建 `dto/` — ApprovalQueryDto / ApprovalStatsDto

- [x] Task 6: 创建接管中心模块（takeover-center）
  - [x] SubTask 6.1: 创建 `backend/src/modules/takeover-center/` 目录结构
  - [x] SubTask 6.2: 创建 `takeover-center.module.ts`
  - [x] SubTask 6.3: 创建 `services/takeover-center.service.ts` — 从 ART TakeoverEngineService 迁移逻辑，新增 getActiveTakeovers / getTakeoverStats 方法
  - [x] SubTask 6.4: 创建 `takeover-center.controller.ts` — API 端点：GET /takeover-center/active / GET /takeover-center/stats / POST /takeover-center/:id/resolve
  - [x] SubTask 6.5: 创建 `dto/` — TakeoverQueryDto / ResolveTakeoverDto

- [x] Task 7: 创建回滚中心模块（rollback-center）
  - [x] SubTask 7.1: 创建 `backend/src/modules/rollback-center/` 目录结构
  - [x] SubTask 7.2: 创建 `rollback-center.module.ts`
  - [x] SubTask 7.3: 创建 `services/rollback-center.service.ts` — 从 ART RollbackEngineService 迁移逻辑，新增 getRollbackStats 方法
  - [x] SubTask 7.4: 创建 `rollback-center.controller.ts` — API 端点：GET /rollback-center/stats / POST /rollback-center/:id/execute / GET /rollback-center/history
  - [x] SubTask 7.5: 创建 `dto/` — RollbackQueryDto

- [x] Task 8: 注册新模块到 AppModule
  - [x] SubTask 8.1: 修改 `backend/src/app.module.ts` — 导入 ApprovalCenterModule + TakeoverCenterModule + RollbackCenterModule

## 第三组：第一轮遗留任务

- [x] Task 9: 为 LM/OM/CNV/TK/TSK/ORG/USR 添加状态机校验 + 事件发布
  - [x] SubTask 9.1: 修改 `backend/src/modules/lm/lm.service.ts` — changeStatus 加入 leadStateMachine.validateTransition + eventBus.publish(leadStatusChanged)
  - [x] SubTask 9.2: 修改 `backend/src/modules/om/om.service.ts` — changeStage 加入 opportunityStateMachine.validateTransition + eventBus.publish(opportunityStageChanged)
  - [x] SubTask 9.3: 修改 `backend/src/modules/cnv/cnv.service.ts` — changeStatus 加入 conversationStateMachine.validateTransition + eventBus.publish(conversationCreated/conversationMessageCreated)
  - [x] SubTask 9.4: 修改 `backend/src/modules/tk/tk.service.ts` — changeStatus 加入 ticketStateMachine.validateTransition + eventBus.publish(ticketStatusChanged)
  - [x] SubTask 9.5: 修改 `backend/src/modules/tsk/tsk.service.ts` — changeStatus 加入 taskStateMachine.validateTransition + eventBus.publish
  - [x] SubTask 9.6: 修改 `backend/src/modules/org/org.service.ts` — changeStatus 加入 organizationStateMachine.validateTransition + eventBus.publish
  - [x] SubTask 9.7: 修改 `backend/src/modules/usr/usr.service.ts` — changeStatus 加入 userStateMachine.validateTransition + eventBus.publish

- [x] Task 10: 创建初始化种子数据
  - [x] SubTask 10.1: 创建 `backend/src/modules/art/seeds/agent.seed.ts` — Conversation Agent (AGENT-AI-003, suggest 模式) 种子数据
  - [x] SubTask 10.2: 创建 `backend/src/modules/art/seeds/prompt-template.seed.ts` — Conversation Agent 的 system prompt + user prompt pattern 种子数据
  - [x] SubTask 10.3: 创建 `backend/src/modules/art/seeds/tool.seed.ts` — read_api / kb_search / notification_send 种子数据
  - [x] SubTask 10.4: 创建 `backend/src/modules/art/seeds/seed-runner.ts` — 种子数据执行器，在模块初始化时检查并插入

## 第四组：工程基线修复

- [x] Task 11: 统一前端数据请求层
  - [x] SubTask 11.1: 检查 `frontend/src/utils/api.ts` — 确认统一的 axios 实例配置（baseURL / interceptors / error handling）
  - [x] SubTask 11.2: 检查所有 service 文件，确保全部使用统一 api 实例而非直接 fetch
  - [x] SubTask 11.3: 如需 React Query，创建 `frontend/src/utils/hooks.ts` — 统一 React Query hooks 封装

- [x] Task 12: CORS 配置对齐
  - [x] SubTask 12.1: 修改 `backend/src/main.ts` — 确保 CORS 明确允许前端开发端口 5173

- [x] Task 13: 关键开发说明写入仓库
  - [x] SubTask 13.1: 检查并更新 `.trae/rules/project_rules.md` — 新增 AI 原生架构说明 / 开发端口 / 模块结构

## 第五组：SSOT 回写

- [x] Task 14: 回写 SSOT 00_README
  - [x] SubTask 14.1: 修改 `docs/SSOT/00_README_唯一执行入口.md` — 新增 COR/CMEM/ART/Approval-Center/Takeover-Center/Rollback-Center 模块索引

- [x] Task 15: 回写 SSOT 01_产品范围与阶段地图
  - [x] SubTask 15.1: 修改 `docs/SSOT/01_产品范围与阶段地图.md` — 新增驾驶舱/工作台/预警台页面到 S1 范围

- [x] Task 16: 回写 SSOT 02_业务域与模块树
  - [x] SubTask 16.1: 修改 `docs/SSOT/02_业务域与模块树.md` — 新增 COR/CMEM/ART/Approval-Center/Takeover-Center/Rollback-Center 模块码和层级关系

- [x] Task 17: 回写 SSOT 10_AI_Agent
  - [x] SubTask 17.1: 修改 `docs/SSOT/10_AI_Agent_自动化与集成执行规范.md` — 更新 Agent Runtime 代码实现状态，标注已实现/待实现

## 第六组：编译验证

- [x] Task 18: 验证编译通过
  - [x] SubTask 18.1: 后端 `tsc --noEmit` 通过（src/ 目录零错误，test/ 目录有预存的 supertest 依赖缺失问题）
  - [x] SubTask 18.2: 前端 `tsc --noEmit` 通过（零错误）

# Task Dependencies

- Task 1-4 (前端页面/路由) 可并行
- Task 5-7 (后端独立模块) 可并行，且与 Task 1-4 可并行
- Task 8 (AppModule 注册) 依赖 Task 5-7
- Task 9 (业务模块状态机) 依赖第一轮的 Task 1+2（已完成）
- Task 10 (种子数据) 依赖第一轮的 Task 5（已完成）
- Task 11-12 (工程基线) 可独立并行
- Task 14-17 (SSOT 回写) 可并行
- Task 18 (编译验证) 依赖所有前置 Task
