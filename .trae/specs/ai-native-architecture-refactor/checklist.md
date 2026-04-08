# Checklist — AI 原生架构重构验收

## 基础设施

- [ ] 领域事件系统：`backend/src/common/events/domain-event.ts` 存在且包含 eventType / aggregateType / aggregateId / payload / occurredAt / orgId 字段
- [ ] 事件总线：`backend/src/common/events/event-bus.service.ts` 存在且提供 publish / subscribe 方法
- [ ] 事件模块：`backend/src/common/events/events.module.ts` 存在且全局注册
- [ ] 核心领域事件定义：`backend/src/common/events/events/` 目录下至少包含 CustomerCreated / CustomerStatusChanged / ConversationMessageCreated / TicketStatusChanged / OpportunityStageChanged / AiTaskCompleted 事件
- [ ] 状态机校验器：`backend/src/common/statemachine/state-machine.ts` 存在且可校验合法/非法迁移
- [ ] S1 核心状态机定义：`backend/src/common/statemachine/definitions/` 目录下包含 customer / lead / opportunity / conversation / ticket / task / ai-task / organization / user 的状态机定义

## Customer Operating Record Layer

- [ ] COR 模块目录：`backend/src/modules/cor/` 存在
- [ ] CustomerTimelineEvent 实体：包含 customerId / eventType / eventSource / eventPayload / occurredAt / actorType / actorId 字段
- [ ] CustomerOperatingRecord 实体：包含 customerId / recordType / content / aiSuggestion / humanDecision / sourceType / sourceId 字段
- [ ] TimelineService：提供 appendEvent / getTimeline 方法
- [ ] Customer360Service：提供 getCustomer360 方法，聚合客户全维度数据
- [ ] COR Controller：提供 GET /cor/customers/:id/360 / GET /cor/customers/:id/timeline / GET /cor/customers/:id/records / POST /cor/customers/:id/records 端点

## Customer Memory Layer

- [ ] CMEM 模块目录：`backend/src/modules/cmem/` 存在
- [ ] CustomerContext 实体：包含 customerId / contextType / contextData / lastUpdatedFrom / expiresAt 字段
- [ ] CustomerIntent 实体：包含 customerId / intentType / confidence / evidence / detectedAt 字段
- [ ] CustomerRisk 实体：包含 customerId / riskLevel / riskFactors / assessedAt 字段
- [ ] CustomerNextAction 实体：包含 customerId / actionType / priority / reasoning / suggestedBy / suggestedAt / status 字段
- [ ] ContextService：提供 updateContext / getContext 方法
- [ ] IntentService：提供 detectIntent / getIntent 方法
- [ ] RiskService：提供 assessRisk / getRisk 方法
- [ ] NextActionService：提供 recommend / getNextActions / acceptAction / dismissAction 方法
- [ ] CMEM Controller：提供客户上下文/意图/风险/下一步的 API 端点

## Agent Runtime Layer

- [ ] ART 模块目录：`backend/src/modules/art/` 存在
- [ ] AiAgent 实体：包含 code / name / agentType / executionMode / resourceScope / toolScope / riskLevel / inputSchema / outputSchema / requiresApproval / rollbackStrategy / takeoverStrategy / status 字段
- [ ] AiAgentRun 实体：包含 agentId / requestId / status / inputPayload / outputPayload / executionMode / latencyMs / tokenCost / errorMessage 字段
- [ ] AiApprovalRequest 实体：包含 agentRunId / resourceType / resourceId / requestedAction / riskLevel / status / beforeSnapshot / proposedAfterSnapshot / explanation / approverUserId / expiresAt 字段
- [ ] AiRollback 实体：包含 agentRunId / resourceType / resourceId / rollbackScope / beforeSnapshot / result / rolledBackBy / rolledBackAt 字段
- [ ] AiTakeover 实体：包含 agentRunId / resourceType / resourceId / takeoverUserId / reason / takeoverAt 字段
- [ ] AiPromptTemplate 实体：包含 templateCode / agentCode / version / systemPrompt / userPromptPattern / inputSchema / outputSchema / safetyRules / enabled 字段
- [ ] AiTool 实体：包含 code / name / toolType / config / riskLevel / enabled 字段
- [ ] AgentRegistryService：提供 register / activate / pause / archive / getAgent / listAgents 方法
- [ ] ExecutionEngine：提供 execute 方法，根据 executionMode 走不同执行路径
- [ ] ApprovalEngine：提供 createApprovalRequest / approve / reject / checkExpired 方法
- [ ] RollbackEngine：提供 rollback / getRollbackRecords 方法
- [ ] TakeoverEngine：提供 takeover / getTakeoverRecords 方法
- [ ] PromptTemplateService：提供 create / update / getTemplate / listTemplates 方法
- [ ] ToolCallingService：提供 registerTool / callTool / validatePermission 方法
- [ ] ART Controller：提供 Agent 管理 / 执行 / 审批 / 回滚 / 接管 / 模板 / 工具的 API 端点

## 现有模块重构

- [ ] AI 模块重构：ai.service.ts 的 createSmartReplyTask 委托给 ExecutionEngine
- [ ] AI 模块重构：ai-task.entity.ts 新增 agentRunId 字段
- [ ] Customer 实体扩展：新增 contextSnapshot / intentSummary / riskLevel / nextActionSuggestion 字段
- [ ] CM 状态机校验：changeStatus 加入状态机校验 + 审计写入 + 事件发布
- [ ] LM 状态机校验：状态变更加入状态机校验 + 事件发布
- [ ] OM 状态机校验：状态变更加入状态机校验 + 事件发布
- [ ] CNV 状态机校验：状态变更加入状态机校验 + 事件发布
- [ ] TK 状态机校验：状态变更加入状态机校验 + 事件发布
- [ ] AppModule 注册：EventsModule + CorModule + CmemModule + ArtModule 已注册
- [ ] 数据库 Migration：新表 + Customer 新字段的 migration 文件已创建

## 前端重构

- [ ] 类型扩展：frontend/src/types/index.ts 包含所有新增类型定义
- [ ] aiStore：frontend/src/stores/aiStore.ts 存在且包含 agentList / currentAgentRun / copilotVisible / copilotContext
- [ ] customerContextStore：frontend/src/stores/customerContextStore.ts 存在
- [ ] approvalStore：frontend/src/stores/approvalStore.ts 存在
- [ ] workbenchStore：frontend/src/stores/workbenchStore.ts 存在
- [ ] Agent API 服务：frontend/src/services/agent.ts 存在
- [ ] Customer Memory API 服务：frontend/src/services/customer-memory.ts 存在
- [ ] Approval API 服务：frontend/src/services/approval.ts 存在
- [ ] COR API 服务：frontend/src/services/cor.ts 存在
- [ ] Workbench 页面：frontend/src/pages/Workbench.tsx 存在且包含待办区 / AI 洞察区 / 待审批区
- [ ] Customer360 页面：frontend/src/pages/Customer360.tsx 存在且包含时间线 / 经营记忆 / AI 建议
- [ ] ApprovalInbox 页面：frontend/src/pages/ApprovalInbox.tsx 存在且包含审批列表 / approve/reject 操作
- [ ] AgentHub 页面：frontend/src/pages/AgentHub.tsx 存在且包含 Agent 列表 / 注册 / 状态管理
- [ ] AiCopilot 组件：frontend/src/components/AiCopilot/ 存在
- [ ] CustomerTimeline 组件：frontend/src/components/CustomerTimeline/ 存在
- [ ] 路由重构：App.tsx 包含 /workbench / customers/:id/360 / approvals / agents 路由
- [ ] 布局重构：Layout.tsx 侧边栏包含工作台 / 审批中心 / Agent 管理 + AI Copilot 触发按钮

## 集成验证

- [ ] 后端编译通过：npm run build 无错误
- [ ] 前端编译通过：npm run build 无错误
- [ ] 状态机校验：非法状态迁移返回 STATUS_TRANSITION_INVALID
- [ ] 领域事件：客户状态变更自动追加时间线
- [ ] Agent 执行：Conversation Agent suggest 模式执行返回建议
- [ ] 审批流：创建审批请求 / approve / reject 完整闭环
- [ ] 初始化数据：Conversation Agent + Prompt Template + Tool 种子数据已创建

## 文档回写

- [ ] SSOT 02_业务域与模块树：新增 COR / CMEM / ART 模块码
- [ ] SSOT 05_对象模型与数据库设计：新增表定义
- [ ] SSOT 08_API契约与Schema字典：新增 API 定义
- [ ] SSOT 09_页面与交互规格：新增工作台/客户360/审批页面
