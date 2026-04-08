## AI 原生架构说明

### 系统定位
MOY（墨言）是 AI 运行时驱动的企业级客户经营系统，不是传统菜单式企业管理后台。

### 核心架构层次
1. **COR（客户经营记录）**：CustomerOperatingRecord + CustomerTimelineEvent + Customer360Service
2. **CMEM（客户记忆）**：CustomerContext + CustomerIntent + CustomerRisk + CustomerNextAction
3. **ART（Agent 运行时）**：AgentRegistryService + ExecutionEngineService + PromptTemplateService + ToolCallingService
4. **APC（审批中心）**：ApprovalCenterService — AI 审批请求管理
5. **TKC（接管中心）**：TakeoverCenterService — AI 人工接管管理
6. **RBC（回滚中心）**：RollbackCenterService — AI 执行回滚管理

### 前端主路由
- `/cockpit` — 经营驾驶舱（首页）
- `/workbench/customer` — 客户经营工作台
- `/workbench/conversation` — 会话跟进工作台
- `/workbench/ai-runs` — AI 执行流工作台
- `/workbench/approvals` — 审批流工作台
- `/customer-360/:id` — 客户 360 视图
- `/risk-signals` — 风险预警台

### 开发端口
- 前端开发服务器：`http://localhost:5173`（Vite 默认）
- 后端 API 服务器：`http://localhost:3001`
- CORS 已配置允许 5173 和 3000 端口

### 后端模块结构
```
backend/src/
├── common/
│   ├── events/          # 领域事件系统
│   ├── statemachine/    # 状态机基础设施
│   ├── guards/          # 认证/权限/租户守卫
│   └── ...
├── modules/
│   ├── cor/             # 客户经营记录
│   ├── cmem/            # 客户记忆
│   ├── art/             # Agent 运行时
│   ├── approval-center/ # 审批中心
│   ├── takeover-center/ # 接管中心
│   ├── rollback-center/ # 回滚中心
│   ├── cm/ lm/ om/ cnv/ tk/ tsk/ ...  # 业务模块
│   └── ...
└── ...
```

### 状态机使用
所有业务模块的状态变更必须通过统一状态机校验：
```typescript
import { leadStateMachine } from '../../common/statemachine/definitions/lead.sm';
leadStateMachine.validateTransition(fromStatus, toStatus); // 非法流转抛出 StateMachineError
```

### 领域事件使用
所有业务模块的状态变更必须发布领域事件：
```typescript
import { EventBusService } from '../../common/events/event-bus.service';
import { leadStatusChanged } from '../../common/events/lead-events';
this.eventBus.publish(leadStatusChanged({ leadId, orgId, fromStatus, toStatus, changedBy: userId }));
```

### AI 执行模式
- `suggest`：只给建议，不自动提交
- `assist`：可生成草稿，由人工确认
- `auto`：可自动执行低风险动作
- `approval`：自动准备动作，但必须审批后才执行

### 多租户隔离
所有业务表默认继承 `org_id` 多租户隔离，所有查询必须带 orgId 条件。
