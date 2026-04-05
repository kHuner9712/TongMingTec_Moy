# MOY 数据模型与数据字典（DBD）

## 1. 文档元信息
| 属性 | 内容 |
| --- | --- |
| 文档编号 | MOY_DBD_001 |
| 文档版本 | v4.0 |
| 文档状态 | 已确认（冻结） |
| 日期 | 2026-04-05 |
| 上游输入 | `06_PRD`、`07_RTM`、`09_HLD` |
| 下游约束 | `11_API`、后端实现、测试数据准备 |

## 2. 设计原则
- 仅定义 P0 在建数据模型。
- 表、状态枚举、外键关系必须与 RTM/API 一致。
- 禁止为覆盖率“补表”。

## 3. 数据表清单（P0）
| TABLE ID | 表名 | 中文名 | 模块 | 在 P0 范围 |
| --- | --- | --- | --- | --- |
| TABLE-ORG-001 | organizations | 组织表 | ORG | 是 |
| TABLE-ORG-002 | departments | 部门表 | ORG | 是 |
| TABLE-USR-001 | users | 用户表 | USR | 是 |
| TABLE-USR-002 | roles | 角色表 | USR | 是 |
| TABLE-USR-003 | permissions | 权限表 | USR | 是 |
| TABLE-USR-004 | user_roles | 用户角色关联表 | USR | 是 |
| TABLE-USR-005 | role_permissions | 角色权限关联表 | USR | 是 |
| TABLE-CM-001 | customers | 客户表 | CM | 是 |
| TABLE-CM-002 | customer_contacts | 客户联系人表 | CM | 是 |
| TABLE-LM-001 | leads | 线索表 | LM | 是 |
| TABLE-LM-002 | lead_follow_ups | 线索跟进表 | LM | 是 |
| TABLE-OM-001 | opportunities | 商机表 | OM | 是 |
| TABLE-OM-002 | opportunity_stage_histories | 商机阶段历史表 | OM | 是 |
| TABLE-CNV-001 | conversations | 会话表 | CNV | 是 |
| TABLE-CNV-002 | conversation_messages | 会话消息表 | CNV | 是 |
| TABLE-TK-001 | tickets | 工单表 | TK | 是 |
| TABLE-TK-002 | ticket_logs | 工单日志表 | TK | 是 |
| TABLE-TSK-001 | tasks | 任务表 | TSK | 是 |
| TABLE-NTF-001 | notifications | 通知表 | NTF | 是 |
| TABLE-CHN-001 | channels | 渠道表 | CHN | 是 |
| TABLE-AI-001 | ai_tasks | AI任务表 | AI | 是 |
| TABLE-AUD-001 | audit_logs | 审计日志表 | AUD | 是 |
| TABLE-SYS-001 | system_configs | 系统配置表 | SYS | 是 |

## 4. 关键表字段口径（摘要）

### 4.1 customers（TABLE-CM-001）
- 主键：`id`
- 关键字段：`org_id`, `name`, `owner_user_id`, `status`, `created_at`, `updated_at`
- 状态字段：`status` 使用 `SM-customer`

### 4.2 leads（TABLE-LM-001）
- 主键：`id`
- 关键字段：`org_id`, `name`, `source`, `owner_user_id`, `status`, `converted_opportunity_id`
- 状态字段：`status` 使用 `SM-lead`

### 4.3 opportunities（TABLE-OM-001）
- 主键：`id`
- 关键字段：`org_id`, `customer_id`, `name`, `amount`, `stage`, `result`
- 状态字段：
  - `stage`：`discovery|qualification|proposal|negotiation`
  - `result`：`won|lost|null`

### 4.4 conversations（TABLE-CNV-001）
- 主键：`id`
- 关键字段：`org_id`, `channel_id`, `customer_id`, `status`, `assignee_user_id`
- 状态字段：`status` 使用 `SM-conversation`

### 4.5 tickets（TABLE-TK-001）
- 主键：`id`
- 关键字段：`org_id`, `source_type`, `source_id`, `status`, `priority`, `assignee_user_id`
- 状态字段：`status` 使用 `SM-ticket`

### 4.6 tasks（TABLE-TSK-001）
- 主键：`id`
- 关键字段：`org_id`, `title`, `status`, `assignee_user_id`, `due_at`
- 状态字段：`status` 使用 `SM-task`

### 4.7 ai_tasks（TABLE-AI-001）
- 主键：`id`
- 关键字段：`org_id`, `conversation_id`, `task_type`, `status`, `input_payload`, `output_payload`
- 状态字段：`status` 使用 `SM-ai_task`

## 5. 状态枚举（唯一）
| 状态机ID | 字段 | 枚举 |
| --- | --- | --- |
| SM-customer | customers.status | `potential, active, silent, lost` |
| SM-lead | leads.status | `new, assigned, following, converted, invalid` |
| SM-opportunity | opportunities.stage/result | `discovery, qualification, proposal, negotiation, won, lost` |
| SM-conversation | conversations.status | `queued, active, closed` |
| SM-ticket | tickets.status | `pending, assigned, processing, resolved, closed` |
| SM-task | tasks.status | `pending, in_progress, completed, cancelled` |
| SM-ai_task | ai_tasks.status | `pending, running, succeeded, failed, cancelled` |

## 6. 关系约束
- `leads.converted_opportunity_id -> opportunities.id`
- `opportunities.customer_id -> customers.id`
- `conversations.customer_id -> customers.id`
- `tickets.source_type/source_id` 支持来源会话
- `ai_tasks.conversation_id -> conversations.id`

## 7. 游离对象清理结果
- 仅在 RTM/HLD 出现但无 DBD 定义的对象：已清理。
- 仅在旧报告出现但未纳入实现的对象：已标记为 P1/P2，不在 P0 表清单。

## 8. 与 API 对齐规则
- API 返回字段命名与表字段一一映射。
- 商机结果统一使用 `won/lost`。
- 不允许 `win/lose`、`waiting` 等非基线枚举进入接口样例。

## 9. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v4.0 | 2026-04-05 | DBD 收口重写：P0 表清单冻结，状态枚举统一，游离对象清理完成 |
