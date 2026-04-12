# MOY AI / Agent / 自动化 / 集成执行规范

## 1. 文档定位

本文档是 MOY 唯一的 AI、Agent、自动化和集成执行规范，统一收口：

- Agent registry
- capability contract
- execution mode
- prompt / template
- tool calling
- orchestration
- approval flow
- rollback
- human takeover
- integration flow
- data mapping
- retry / timeout / circuit breaker / rate limit
- audit / observability

## 2. 基础边界

- P0 已落地且继续继承的能力：
  - 智能回复
  - AI task 落库
  - 脱敏
  - Provider 抽象
  - 超时 / 重试 / 熔断 / 限流
  - 人工编辑后发送
- 已实现能力（S1 代码已落地）：
  - Agent Registry（AiAgent 实体 + AgentRegistryService）
  - Agent Execution Engine（4 种执行模式：suggest / assist / auto / approval）
  - Approval Engine（AiApprovalRequest + ApprovalEngineService + ApprovalCenterService）
  - Rollback Engine（AiRollback + RollbackEngineService + RollbackCenterService）
  - Takeover Engine（AiTakeover + TakeoverEngineService + TakeoverCenterService）
  - Prompt Template（AiPromptTemplate + PromptTemplateService）
  - Tool Calling（AiTool + ToolCallingService）
  - Customer Operating Record（COR 模块：CustomerOperatingRecord + CustomerTimelineEvent + Customer360Service）
  - Customer Memory（CMEM 模块：CustomerContext + CustomerIntent + CustomerRisk + CustomerNextAction）
  - Domain Event System（EventBusService + 领域事件定义）
  - State Machine Enforcement（StateMachine<S> + 9 个 S1 状态机定义 + 2 个 S2 状态机定义）
- S2 已实现能力：
  - SM-ai_agent 集成到 AgentRegistryService（状态机校验 + EventBus agent.status_changed + 乐观锁版本控制）
  - SM-approval_request 集成到 ApprovalCenterService（状态机校验 + EventBus approval.status_changed + 乐观锁版本控制 + cancel 方法 + checkExpired 定时检查）
  - CMEM 事件驱动（CmemEventHandler 订阅 customer.status_changed → 自动触发 IntentService.detectIntent + RiskService.assessRisk）
  - Agent 状态变更 API（API-AI-011：activate/pause/archive，含 version 乐观锁）
  - 审批取消 API（API-AI-012：cancel，含 version 乐观锁）
- 终局扩展能力：
  - Agent registry
  - 审批驱动的自动执行
  - 回滚与接管
  - 自动化流程编排
  - 集成流与字段映射
  - 可观测性与风险分级

## 3. Agent Registry

### 3.1 统一注册表

| Agent Code   | 名称               | 主要职责                        | introduced_in | required_in | 默认模式 | 实现状态    |
| ------------ | ------------------ | ------------------------------- | ------------- | ----------- | -------- | ----------- |
| AGENT-AI-001 | Acquisition Agent  | 渠道线索吸收、首轮清洗          | S2            | S4          | assist   | specified   |
| AGENT-AI-002 | Lead Clean Agent   | 去重、标准化、评分建议          | S2            | S3          | assist   | specified   |
| AGENT-AI-003 | Conversation Agent | 智能回复、摘要、意图识别        | S1            | S1          | suggest  | implemented |
| AGENT-AI-004 | Sales Follow Agent | 跟进建议、下一步动作建议        | S2            | S3          | suggest  | specified   |
| AGENT-AI-005 | Opportunity Agent  | 商机风险与赢单建议              | S2            | S4          | suggest  | specified   |
| AGENT-AI-006 | Ticket Agent       | 工单摘要、分流建议、解决建议    | S2            | S3          | assist   | specified   |
| AGENT-AI-007 | Knowledge Agent    | 知识检索与答案合成              | S2            | S2          | assist   | specified   |
| AGENT-AI-008 | Quality Agent      | 会话/工单质检、敏感词、情绪分析 | S2            | S3          | auto     | specified   |
| AGENT-AI-009 | Insight Agent      | 数据洞察、异常解释、趋势归因    | S3            | S4          | assist   | specified   |
| AGENT-AI-010 | Orchestrate Agent  | 自动化流程编排与跨工具协调      | S3            | S4          | approval | specified   |
| AGENT-AI-011 | Dashboard Agent    | 驾驶舱摘要与管理层日报          | S3            | S4          | suggest  | specified   |

### 3.2 capability contract

每个 Agent 必须声明：

- `agent_code`
- `resource_scope`
- `tool_scope`
- `supported_actions`
- `execution_mode`
- `risk_level`
- `input_schema`
- `output_schema`
- `requires_approval`
- `rollback_strategy`
- `takeover_strategy`

### 3.3 Agent 可操作模块

**报价（QT）**：
- suggest：根据商机信息建议报价金额和明细
- assist：自动生成报价草稿，人工确认后提交
- auto：报价审批通过后自动发送

**合同（CT）**：
- suggest：根据报价建议合同条款
- assist：自动生成合同草稿，人工确认后提交
- approval：合同签署必须人工审批

**订单（ORD）**：
- suggest：建议从合同生成订单
- assist：自动填充订单明细，人工确认
- approval：订单确认必须人工审批

**付款（PAY）**：
- suggest：建议付款提醒
- approval：付款确认必须人工审批

## 4. 执行模式

| 模式       | 说明                             | 是否可直接落业务终态 |
| ---------- | -------------------------------- | -------------------- |
| `suggest`  | 只给建议，不自动提交             | 否                   |
| `assist`   | 可生成草稿或中间结果，由人工确认 | 否                   |
| `auto`     | 可自动执行低风险动作             | 仅限低风险           |
| `approval` | 自动准备动作，但必须审批后才执行 | 否，审批后才可执行   |

默认规则：

- `Conversation Agent`、`Sales Follow Agent`：`suggest`
- `Ticket Agent`、`Knowledge Agent`：`assist`
- `Quality Agent`：`auto`
- `Orchestrate Agent`：`approval`

## 5. Prompt / Template 规范

- Prompt 必须模板化存储，不允许代码内散落硬编码长 Prompt。
- 模板字段至少包含：
  - `template_code`
  - `agent_code`
  - `version`
  - `system_prompt`
  - `user_prompt_pattern`
  - `input_schema`
  - `output_schema`
  - `safety_rules`
  - `enabled`
- 模板变量来源只允许：
  - 当前资源详情
  - 租户级配置
  - 明确声明可读的历史上下文
  - 脱敏后的用户输入

## 6. Tool Calling 规则

### 6.1 允许的工具类型

- `read_api`
- `write_api`
- `kb_search`
- `workflow_execute`
- `integration_execute`
- `notification_send`
- `report_export`

### 6.2 工具调用约束

- 工具调用前先跑权限解析。
- 写工具必须声明目标资源、目标动作、预期状态变化。
- 高风险写工具只能在 `approval` 模式下使用。
- 工具调用日志必须写入 `TABLE-AI-003 ai_agent_runs`。

## 7. Orchestration 规则

### 7.1 编排结构

一个编排流程至少包含：

1. trigger
2. context loader
3. decision step
4. action step
5. validation step
6. audit step
7. rollback / takeover step

### 7.2 编排边界

- 单 Agent 可以完成单资源判断。
- 多资源、多模块、多终态变更必须通过 `Orchestrate Agent` + 审批链。
- 任何跨模块事务都不得让 Agent 直接拼 SQL 或绕开 API。

### 7.3 触发式自动化主干（AUTO）

**阶段**：S2

**触发类型**：
- event：领域事件触发（如 opportunity.won, contract.signed, order.confirmed）
- schedule：定时触发（Cron 表达式）
- webhook：外部回调触发

**基础节点类型**：
- notify：发送通知（站内信/邮件/短信）
- state_change：状态变更（调用状态机推进）
- ai_action：AI 动作（调用 Agent 执行）

**执行模型**：
1. 触发器匹配 → 创建 automation_run（status=pending）
2. 按步骤顺序执行 → 每步创建 automation_step
3. 全部成功 → automation_run.status=succeeded
4. 任一步骤失败 → automation_run.status=failed，记录 error_code
5. 失败执行可手动重试

**与成交链路的衔接**：
- opportunity.won → 自动创建报价（suggest 模式）
- contract.signed → 自动创建订单（assist 模式）
- payment.succeeded → 自动激活订单（auto 模式）
- order.activated → 自动开通订阅（auto 模式）
- subscription.expiring → 自动发送续费提醒（notify 模式）

**限制**：
- S2 仅支持单步骤和双步骤流程，不支持复杂分支/循环
- S2 不支持条件判断节点，条件逻辑由 AI Agent 处理
- S2 不支持子流程调用

## 8. Approval Flow

| 场景              | 发起方式                         | 审批节点    | 执行后动作       |
| ----------------- | -------------------------------- | ----------- | ---------------- |
| AI 自动转派       | Agent 发起 `ai_approval_request` | 业务经理    | 调用目标写 API   |
| 批量状态修改      | 自动化流程触发                   | 模块负责人  | 执行后写审计     |
| 合同/报价审批建议 | Agent 仅给建议                   | 人工审批    | 保留人工最终决定 |
| 高风险商业动作    | Agent 只能准备，不可直接提交     | 财务/管理员 | 审批后执行       |

审批请求必须包含：

- `resource_type`
- `resource_id`
- `requested_action`
- `risk_level`
- `before_snapshot`
- `proposed_after_snapshot`
- `explanation`

## 9. Rollback / Human Takeover

### 9.1 rollback 原则

- 只对 AI 自动写入的结果回滚，不回滚人工确认后的手工编辑。
- 回滚前先生成 `before_snapshot` 与 `rollback_scope`。
- 回滚结果必须写 `TABLE-AI-007 ai_rollbacks`。

### 9.2 human takeover 原则

- 命中以下条件必须触发人工接管：
  - 超时重试后仍失败
  - 置信度低于阈值
  - 命中 P0/P1 风险动作
  - 资源状态发生并发变化
  - 审批拒绝或过期
- 接管后：
  - 锁定当前 AI run
  - 记录接管人、接管原因
  - 页面显式显示“已人工接管”

## 10. Integration Flow / Data Mapping

### 10.1 integration flow

集成流必须声明：

- `flow_code`
- `source_system`
- `target_system`
- `direction`
- `trigger_type`
- `idempotency_key_expr`
- `retry_policy`
- `mapping_set`

### 10.2 data mapping

字段映射必须声明：

- `source_field`
- `target_field`
- `transform_rule`
- `default_value`
- `required`
- `masking_rule`

## 11. 超时、重试、熔断、限流

| 机制           | 默认值                     |
| -------------- | -------------------------- |
| LLM 单次超时   | 12s                        |
| 外部集成超时   | 8s                         |
| 默认重试       | 2 次，指数退避             |
| 熔断阈值       | 5 分钟内失败率 > 50%       |
| Agent 调用限流 | 每租户/每分钟按 Agent 配额 |
| Webhook 重试   | 1m / 5m / 15m / 1h         |

## 12. 审计与可观测性

### 12.1 审计

必须记录：

- 发起人
- Agent
- 模板版本
- 输入摘要
- 输出摘要
- 工具调用
- 审批结果
- 回滚结果
- 接管结果

### 12.2 观测指标

- 调用量
- 成功率
- 平均延迟
- token 成本
- 拒绝率
- 审批通过率
- 回滚率
- 接管率

### 12.3 告警

- Agent 失败率异常
- 成本异常
- 审批积压
- 集成重试积压
- Webhook 投递失败

## 13. 与其他主文档的关系

- 表结构：见 `05`
- 状态机：见 `06`
- 权限与审批边界：见 `07`
- API / WebSocket：见 `08`
- 页面与工作台：见 `09`
- 测试、部署与迁移：见 `12`
