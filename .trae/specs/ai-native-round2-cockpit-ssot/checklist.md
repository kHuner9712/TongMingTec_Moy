# Checklist — AI 原生架构第二轮重构验收

## 前端路由与页面骨架

- [x] Cockpit 驾驶舱页面：`frontend/src/pages/Cockpit.tsx` 存在且包含 AI 洞察区 / 风险预警区 / 关键指标区
- [x] cockpitStore：`frontend/src/stores/cockpitStore.ts` 存在
- [x] CustomerWorkbench 页面：`frontend/src/pages/workbench/CustomerWorkbench.tsx` 存在
- [x] ConversationWorkbench 页面：`frontend/src/pages/workbench/ConversationWorkbench.tsx` 存在
- [x] AiRunsWorkbench 页面：`frontend/src/pages/workbench/AiRunsWorkbench.tsx` 存在
- [x] ApprovalWorkbench 页面：`frontend/src/pages/workbench/ApprovalWorkbench.tsx` 存在
- [x] RiskSignals 预警台页面：`frontend/src/pages/RiskSignals.tsx` 存在
- [x] risk-signal API 服务：`frontend/src/services/risk-signal.ts` 存在
- [x] 路由重构：App.tsx 包含 /cockpit /workbench/customer /workbench/conversation /workbench/ai-runs /workbench/approvals /customer-360/:id /risk-signals 路由
- [x] 路由重定向：`/` 重定向到 `/cockpit`
- [x] 兼容别名：/customers → /workbench/customer，/conversations → /workbench/conversation
- [x] 侧边栏重构：Layout.tsx 侧边栏包含驾驶舱 / 客户经营 / 会话跟进 / AI 执行流 / 审批流 / 预警台分组

## 后端独立模块

- [x] ApprovalCenter 模块目录：`backend/src/modules/approval-center/` 存在
- [x] ApprovalCenterService：提供 getPendingCount / getApprovalStats / approve / reject 方法
- [x] ApprovalCenter Controller：提供 GET /approval-center/pending / GET /approval-center/stats 等端点
- [x] TakeoverCenter 模块目录：`backend/src/modules/takeover-center/` 存在
- [x] TakeoverCenterService：提供 getActiveTakeovers / getTakeoverStats 方法
- [x] TakeoverCenter Controller：提供 GET /takeover-center/active / GET /takeover-center/stats 等端点
- [x] RollbackCenter 模块目录：`backend/src/modules/rollback-center/` 存在
- [x] RollbackCenterService：提供 getRollbackStats / rollback / getRollbackRecords 方法
- [x] RollbackCenter Controller：提供 GET /rollback-center/stats / POST /rollback-center/:id/execute 等端点
- [x] AppModule 注册：ApprovalCenterModule + TakeoverCenterModule + RollbackCenterModule 已注册

## 第一轮遗留任务

- [x] LM 状态机校验：lm.service.ts changeStatus 加入状态机校验 + 事件发布
- [x] OM 状态机校验：om.service.ts changeStage 加入状态机校验 + 事件发布
- [x] CNV 状态机校验：cnv.service.ts changeStatus 加入状态机校验 + 事件发布
- [x] TK 状态机校验：tk.service.ts changeStatus 加入状态机校验 + 事件发布
- [x] TSK 状态机校验：tsk.service.ts changeStatus 加入状态机校验 + 事件发布
- [x] ORG 状态机校验：org.module.ts 导入 EventsModule
- [x] USR 状态机校验：usr.service.ts changeUserStatus 加入状态机校验 + 事件发布
- [x] Agent 种子数据：Conversation Agent (AGENT-AI-003) 种子数据已创建
- [x] Prompt Template 种子数据：Conversation Agent 的 prompt template 已创建
- [x] Tool 种子数据：read_api / kb_search / notification_send 已创建

## 工程基线修复

- [x] 前端统一数据请求层：所有 service 文件使用统一 api 实例
- [x] CORS 配置：backend/src/main.ts 明确允许前端开发端口 5173
- [x] 开发说明：project_rules.md 包含 AI 原生架构说明

## SSOT 回写

- [x] SSOT 00：新增 COR/CMEM/ART/Approval-Center/Takeover-Center/Rollback-Center 模块索引
- [x] SSOT 01：新增驾驶舱/工作台/预警台页面到 S1 范围
- [x] SSOT 02：新增模块码和层级关系
- [x] SSOT 10：更新 Agent Runtime 代码实现状态

## 编译验证

- [x] 后端编译通过：tsc --noEmit src/ 目录零错误
- [x] 前端编译通过：tsc --noEmit 零错误
