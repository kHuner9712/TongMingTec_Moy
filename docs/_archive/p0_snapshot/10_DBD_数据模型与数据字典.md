# MOY 数据模型与数据字典（DBD）

## 1. 文档元信息
| 属性 | 内容 |
| --- | --- |
| 文档编号 | MOY_DBD_001 |
| 文档版本 | v5.0 |
| 文档状态 | 已确认（实现级冻结） |
| 日期 | 2026-04-05 |
| 上游输入 | `06_PRD`、`07_RTM`、`09_HLD`、`27_状态机实现规范` |
| 下游约束 | PostgreSQL migration、NestJS Entity/Repository、`11_API`、`23_测试与验收方案` |

## 2. 适用范围与硬约束
- 仅覆盖 P0：AUTH、ORG、USR、CM、LM、OM、CNV、TK、TSK、NTF、CHN、AI、AUD、SYS。
- 不引入 P1/P2 表。
- 保持 SSOT 编号：`TABLE-{MOD}-{NNN}`。
- 商机结果仅允许 `won/lost`。
- 多租户隔离以 `org_id` 为核心。

## 3. 建模总规范（Migration 必须遵守）

### 3.1 命名与类型
- 数据库：PostgreSQL 15+。
- 表名：`snake_case` 复数。
- 主键：`id uuid primary key default gen_random_uuid()`（`audit_logs` 使用 `bigserial`）。
- 时间：`timestamptz`。
- 货币：`numeric(14,2)`；AI 成本：`numeric(12,6)`。
- JSON：`jsonb`。

### 3.2 多租户策略
- 业务表必须包含 `org_id uuid not null`，并建立租户索引。
- Repository 默认注入 `org_id` 过滤；任何跨租户访问返回 `AUTH_FORBIDDEN`。
- 仅全局字典表可不含 `org_id`（本期无全局业务字典，`permissions` 仍按租户初始化）。

### 3.3 审计字段策略
| 表类型 | 必填字段 |
| --- | --- |
| 可变业务表（如 customers/leads/tickets） | `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`, `version` |
| 追加日志表（如 lead_follow_ups/ticket_logs/opportunity_stage_histories） | `created_at`, `created_by` |
| 系统审计表（audit_logs） | `created_at` + 审计专用字段（见 TABLE-AUD-001） |

### 3.4 软删除策略
- 默认软删除：`deleted_at timestamptz null`。
- 追加日志表不软删除（只追加，不更新，不删除）。

### 3.5 并发控制策略
- 可变业务表统一使用 `version int not null default 1`。
- 更新接口必须携带 `version`；不匹配返回 `CONFLICT_VERSION`（HTTP 409）。

## 4. P0 表清单（最终）
| TABLE ID | 表名 | 主键 | 租户字段 | 软删除 | 说明 |
| --- | --- | --- | --- | --- | --- |
| TABLE-ORG-001 | organizations | id(uuid) | - | 是 | 组织主体 |
| TABLE-ORG-002 | departments | id(uuid) | org_id | 是 | 部门树 |
| TABLE-USR-001 | users | id(uuid) | org_id | 是 | 用户 |
| TABLE-USR-002 | roles | id(uuid) | org_id | 是 | 角色 |
| TABLE-USR-003 | permissions | id(uuid) | org_id | 否 | 权限字典（按租户初始化） |
| TABLE-USR-004 | user_roles | id(uuid) | org_id | 否 | 用户角色关系 |
| TABLE-USR-005 | role_permissions | id(uuid) | org_id | 否 | 角色权限关系 |
| TABLE-CM-001 | customers | id(uuid) | org_id | 是 | 客户 |
| TABLE-CM-002 | customer_contacts | id(uuid) | org_id | 是 | 客户联系人 |
| TABLE-LM-001 | leads | id(uuid) | org_id | 是 | 线索 |
| TABLE-LM-002 | lead_follow_ups | id(uuid) | org_id | 否 | 线索跟进 |
| TABLE-OM-001 | opportunities | id(uuid) | org_id | 是 | 商机 |
| TABLE-OM-002 | opportunity_stage_histories | id(uuid) | org_id | 否 | 商机阶段历史 |
| TABLE-CNV-001 | conversations | id(uuid) | org_id | 是 | 会话 |
| TABLE-CNV-002 | conversation_messages | id(uuid) | org_id | 否 | 会话消息 |
| TABLE-TK-001 | tickets | id(uuid) | org_id | 是 | 工单 |
| TABLE-TK-002 | ticket_logs | id(uuid) | org_id | 否 | 工单日志 |
| TABLE-TSK-001 | tasks | id(uuid) | org_id | 是 | 任务 |
| TABLE-NTF-001 | notifications | id(uuid) | org_id | 否 | 通知 |
| TABLE-CHN-001 | channels | id(uuid) | org_id | 是 | 渠道 |
| TABLE-AI-001 | ai_tasks | id(uuid) | org_id | 否 | AI 任务 |
| TABLE-AUD-001 | audit_logs | id(bigserial) | org_id | 否 | 审计日志 |
| TABLE-SYS-001 | system_configs | id(uuid) | org_id | 是 | 系统配置 |

## 5. 状态与枚举约束（数据库 CHECK）
| 字段 | 允许值 |
| --- | --- |
| customers.status | `potential,active,silent,lost` |
| leads.status | `new,assigned,following,converted,invalid` |
| opportunities.stage | `discovery,qualification,proposal,negotiation` |
| opportunities.result | `won,lost` 或 `null` |
| conversations.status | `queued,active,closed` |
| tickets.status | `pending,assigned,processing,resolved,closed` |
| tasks.status | `pending,in_progress,completed,cancelled` |
| ai_tasks.status | `pending,running,succeeded,failed,cancelled` |

## 6. 表结构定义（可直接生成 Migration）

### 6.1 ORG / USR

#### TABLE-ORG-001 organizations
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| code | varchar(64) | 是 | - | 全局唯一 |
| name | varchar(128) | 是 | - | 组织名称 |
| status | varchar(16) | 是 | 'active' | `active/disabled` |
| timezone | varchar(64) | 是 | 'Asia/Shanghai' | 时区 |
| locale | varchar(16) | 是 | 'zh-CN' | 区域 |
| owner_user_id | uuid | 否 | null | 组织负责人 |
| created_at | timestamptz | 是 | now() | 创建时间 |
| updated_at | timestamptz | 是 | now() | 更新时间 |
| created_by | uuid | 否 | null | 创建人 |
| updated_by | uuid | 否 | null | 更新人 |
| deleted_at | timestamptz | 否 | null | 软删除 |
| version | int | 是 | 1 | 乐观锁 |
索引/约束：
- `pk_organizations(id)`
- `uq_organizations_code(code)`
- `idx_organizations_status(status)`

#### TABLE-ORG-002 departments
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| parent_id | uuid | 否 | null | FK -> departments.id |
| code | varchar(64) | 是 | - | 组织内唯一 |
| name | varchar(128) | 是 | - | 部门名 |
| manager_user_id | uuid | 否 | null | 负责人 |
| sort_order | int | 是 | 0 | 排序 |
| is_active | boolean | 是 | true | 启用标记 |
| created_at | timestamptz | 是 | now() | - |
| updated_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
| updated_by | uuid | 否 | null | - |
| deleted_at | timestamptz | 否 | null | 软删除 |
| version | int | 是 | 1 | 乐观锁 |
索引/约束：
- `uq_departments_org_code(org_id,code)`
- `idx_departments_org_parent(org_id,parent_id)`
- `idx_departments_org_active(org_id,is_active)`

#### TABLE-USR-001 users
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| department_id | uuid | 否 | null | FK -> departments.id |
| username | varchar(64) | 是 | - | 组织内唯一 |
| display_name | varchar(64) | 是 | - | 显示名 |
| email | varchar(128) | 否 | null | 组织内唯一（可空） |
| mobile | varchar(32) | 否 | null | 组织内唯一（可空） |
| password_hash | varchar(255) | 是 | - | 密码哈希 |
| status | varchar(16) | 是 | 'active' | `active/inactive/locked` |
| last_login_at | timestamptz | 否 | null | 最近登录 |
| created_at | timestamptz | 是 | now() | - |
| updated_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
| updated_by | uuid | 否 | null | - |
| deleted_at | timestamptz | 否 | null | 软删除 |
| version | int | 是 | 1 | 乐观锁 |
索引/约束：
- `uq_users_org_username(org_id,username)`
- `uq_users_org_email(org_id,email) where email is not null`
- `idx_users_org_status(org_id,status)`
- `idx_users_org_department(org_id,department_id)`

#### TABLE-USR-002 roles
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| code | varchar(64) | 是 | - | 组织内唯一 |
| name | varchar(64) | 是 | - | 角色名 |
| data_scope | varchar(16) | 是 | 'self' | `self/team/org` |
| is_default | boolean | 是 | false | 默认角色 |
| created_at | timestamptz | 是 | now() | - |
| updated_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
| updated_by | uuid | 否 | null | - |
| deleted_at | timestamptz | 否 | null | 软删除 |
| version | int | 是 | 1 | 乐观锁 |
索引/约束：
- `uq_roles_org_code(org_id,code)`
- `idx_roles_org_default(org_id,is_default)`

#### TABLE-USR-003 permissions
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| perm_id | varchar(64) | 是 | - | 组织内唯一，格式 `PERM-*` |
| module | varchar(32) | 是 | - | 模块 |
| action | varchar(64) | 是 | - | 动作 |
| description | varchar(255) | 否 | null | 描述 |
| created_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
索引/约束：
- `uq_permissions_org_permid(org_id,perm_id)`
- `idx_permissions_org_module(org_id,module)`

#### TABLE-USR-004 user_roles
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| user_id | uuid | 是 | - | FK -> users.id |
| role_id | uuid | 是 | - | FK -> roles.id |
| created_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
索引/约束：
- `uq_user_roles_org_user_role(org_id,user_id,role_id)`
- `idx_user_roles_org_user(org_id,user_id)`

#### TABLE-USR-005 role_permissions
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| role_id | uuid | 是 | - | FK -> roles.id |
| permission_id | uuid | 是 | - | FK -> permissions.id |
| created_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
索引/约束：
- `uq_role_permissions_org_role_perm(org_id,role_id,permission_id)`
- `idx_role_permissions_org_role(org_id,role_id)`

### 6.2 CM / LM / OM

#### TABLE-CM-001 customers
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| name | varchar(128) | 是 | - | 客户名称 |
| industry | varchar(64) | 否 | null | 行业 |
| level | varchar(16) | 否 | null | `A/B/C/D` |
| owner_user_id | uuid | 是 | - | FK -> users.id |
| status | varchar(16) | 是 | 'potential' | `SM-customer` |
| phone | varchar(32) | 否 | null | - |
| email | varchar(128) | 否 | null | - |
| address | varchar(255) | 否 | null | - |
| remark | text | 否 | null | 备注 |
| created_at | timestamptz | 是 | now() | - |
| updated_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
| updated_by | uuid | 否 | null | - |
| deleted_at | timestamptz | 否 | null | 软删除 |
| version | int | 是 | 1 | 乐观锁 |
索引/约束：
- `idx_customers_org_status(org_id,status)`
- `idx_customers_org_owner(org_id,owner_user_id)`
- `idx_customers_org_name_trgm(org_id,name)`

#### TABLE-CM-002 customer_contacts
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| customer_id | uuid | 是 | - | FK -> customers.id |
| name | varchar(64) | 是 | - | 联系人姓名 |
| title | varchar(64) | 否 | null | 职位 |
| phone | varchar(32) | 否 | null | - |
| email | varchar(128) | 否 | null | - |
| wechat | varchar(64) | 否 | null | - |
| is_primary | boolean | 是 | false | 主联系人 |
| created_at | timestamptz | 是 | now() | - |
| updated_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
| updated_by | uuid | 否 | null | - |
| deleted_at | timestamptz | 否 | null | 软删除 |
| version | int | 是 | 1 | 乐观锁 |
索引/约束：
- `idx_customer_contacts_org_customer(org_id,customer_id)`
- `idx_customer_contacts_org_primary(org_id,customer_id,is_primary)`

#### TABLE-LM-001 leads
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| name | varchar(128) | 是 | - | 线索名 |
| source | varchar(32) | 是 | - | `web/manual/import/referral/other` |
| contact_name | varchar(64) | 否 | null | 联系人 |
| phone | varchar(32) | 否 | null | - |
| email | varchar(128) | 否 | null | - |
| owner_user_id | uuid | 否 | null | FK -> users.id |
| status | varchar(16) | 是 | 'new' | `SM-lead` |
| next_follow_up_at | timestamptz | 否 | null | 下次跟进 |
| converted_opportunity_id | uuid | 否 | null | 转化商机关联ID（循环依赖外键在迁移阶段B补充） |
| invalid_reason | varchar(255) | 否 | null | 无效原因 |
| created_at | timestamptz | 是 | now() | - |
| updated_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
| updated_by | uuid | 否 | null | - |
| deleted_at | timestamptz | 否 | null | 软删除 |
| version | int | 是 | 1 | 乐观锁 |
索引/约束：
- `idx_leads_org_status(org_id,status)`
- `idx_leads_org_owner(org_id,owner_user_id)`
- `idx_leads_org_source(org_id,source)`

#### TABLE-LM-002 lead_follow_ups
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| lead_id | uuid | 是 | - | FK -> leads.id |
| follow_type | varchar(16) | 是 | 'other' | `call/message/visit/other` |
| content | text | 是 | - | 跟进内容 |
| next_follow_time | timestamptz | 否 | null | 下次跟进时间 |
| created_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | 操作人 |
索引/约束：
- `idx_lead_follow_ups_org_lead(org_id,lead_id,created_at desc)`

#### TABLE-OM-001 opportunities
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| customer_id | uuid | 是 | - | FK -> customers.id |
| lead_id | uuid | 否 | null | FK -> leads.id |
| name | varchar(128) | 是 | - | 商机名 |
| amount | numeric(14,2) | 是 | 0 | 金额 |
| currency | varchar(8) | 是 | 'CNY' | 币种 |
| stage | varchar(32) | 是 | 'discovery' | `SM-opportunity stage` |
| result | varchar(16) | 否 | null | `won/lost/null` |
| expected_close_date | date | 否 | null | 预计成交 |
| owner_user_id | uuid | 是 | - | FK -> users.id |
| loss_reason | varchar(255) | 否 | null | 丢单原因 |
| created_at | timestamptz | 是 | now() | - |
| updated_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
| updated_by | uuid | 否 | null | - |
| deleted_at | timestamptz | 否 | null | 软删除 |
| version | int | 是 | 1 | 乐观锁 |
索引/约束：
- `idx_opportunities_org_stage(org_id,stage)`
- `idx_opportunities_org_result(org_id,result)`
- `idx_opportunities_org_owner(org_id,owner_user_id)`
- `idx_opportunities_org_customer(org_id,customer_id)`

#### TABLE-OM-002 opportunity_stage_histories
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| opportunity_id | uuid | 是 | - | FK -> opportunities.id |
| from_stage | varchar(32) | 否 | null | 原阶段 |
| to_stage | varchar(32) | 是 | - | 目标阶段 |
| note | varchar(255) | 否 | null | 备注 |
| created_at | timestamptz | 是 | now() | 变更时间 |
| created_by | uuid | 否 | null | 操作人 |
索引/约束：
- `idx_opp_stage_histories_org_opp(org_id,opportunity_id,created_at desc)`

### 6.3 CNV / TK / TSK / NTF / CHN

#### TABLE-CNV-001 conversations
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| channel_id | uuid | 是 | - | FK -> channels.id |
| customer_id | uuid | 否 | null | FK -> customers.id |
| external_conversation_id | varchar(128) | 是 | - | 渠道侧会话ID |
| status | varchar(16) | 是 | 'queued' | `SM-conversation` |
| assignee_user_id | uuid | 否 | null | 当前处理人 |
| accepted_at | timestamptz | 否 | null | 接入时间 |
| closed_at | timestamptz | 否 | null | 关闭时间 |
| close_reason | varchar(255) | 否 | null | 关闭原因 |
| last_message_at | timestamptz | 否 | null | 最新消息时间 |
| created_at | timestamptz | 是 | now() | - |
| updated_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
| updated_by | uuid | 否 | null | - |
| deleted_at | timestamptz | 否 | null | 软删除 |
| version | int | 是 | 1 | 乐观锁 |
索引/约束：
- `uq_conversations_org_channel_external(org_id,channel_id,external_conversation_id)`
- `idx_conversations_org_status(org_id,status,last_message_at desc)`
- `idx_conversations_org_assignee(org_id,assignee_user_id,status)`

#### TABLE-CNV-002 conversation_messages
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| conversation_id | uuid | 是 | - | FK -> conversations.id |
| seq_no | bigint | 是 | - | 会话内单调递增序号 |
| sender_type | varchar(16) | 是 | - | `customer/agent/system/ai` |
| sender_user_id | uuid | 否 | null | 发送人 |
| content_type | varchar(16) | 是 | 'text' | `text/image/file/template` |
| content | text | 是 | - | 消息正文 |
| attachments | jsonb | 是 | '[]'::jsonb | 附件 |
| is_internal | boolean | 是 | false | 内部消息 |
| client_msg_id | varchar(64) | 否 | null | 客户端幂等键 |
| sent_at | timestamptz | 是 | now() | 发送时间 |
| created_at | timestamptz | 是 | now() | 入库时间 |
| created_by | uuid | 否 | null | - |
索引/约束：
- `uq_conversation_messages_org_conv_seq(org_id,conversation_id,seq_no)`
- `uq_conversation_messages_org_conv_client(org_id,conversation_id,client_msg_id) where client_msg_id is not null`
- `idx_conversation_messages_org_conv_sent(org_id,conversation_id,sent_at desc)`

#### TABLE-TK-001 tickets
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| ticket_no | varchar(32) | 是 | - | 组织内唯一 |
| source_type | varchar(16) | 是 | - | `conversation/manual` |
| source_id | uuid | 否 | null | 来源ID |
| title | varchar(255) | 是 | - | 标题 |
| description | text | 否 | null | 描述 |
| status | varchar(16) | 是 | 'pending' | `SM-ticket` |
| priority | varchar(16) | 是 | 'medium' | `low/medium/high/urgent` |
| assignee_user_id | uuid | 否 | null | 指派人 |
| reporter_user_id | uuid | 否 | null | 报告人 |
| sla_due_at | timestamptz | 否 | null | SLA 截止 |
| resolved_at | timestamptz | 否 | null | 解决时间 |
| closed_at | timestamptz | 否 | null | 关闭时间 |
| close_reason | varchar(255) | 否 | null | 关闭原因 |
| created_at | timestamptz | 是 | now() | - |
| updated_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
| updated_by | uuid | 否 | null | - |
| deleted_at | timestamptz | 否 | null | 软删除 |
| version | int | 是 | 1 | 乐观锁 |
索引/约束：
- `uq_tickets_org_ticket_no(org_id,ticket_no)`
- `idx_tickets_org_status(org_id,status,priority)`
- `idx_tickets_org_assignee(org_id,assignee_user_id,status)`

#### TABLE-TK-002 ticket_logs
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| ticket_id | uuid | 是 | - | FK -> tickets.id |
| action | varchar(64) | 是 | - | `create/assign/start/resolve/close/comment` |
| from_status | varchar(16) | 否 | null | 变更前 |
| to_status | varchar(16) | 否 | null | 变更后 |
| content | text | 否 | null | 说明 |
| created_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | 操作人 |
索引/约束：
- `idx_ticket_logs_org_ticket(org_id,ticket_id,created_at desc)`

#### TABLE-TSK-001 tasks
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| title | varchar(255) | 是 | - | 标题 |
| description | text | 否 | null | 描述 |
| status | varchar(16) | 是 | 'pending' | `SM-task` |
| priority | varchar(16) | 是 | 'medium' | `low/medium/high` |
| assignee_user_id | uuid | 是 | - | 执行人 |
| creator_user_id | uuid | 否 | null | 创建人 |
| due_at | timestamptz | 否 | null | 截止时间 |
| completed_at | timestamptz | 否 | null | 完成时间 |
| source_type | varchar(16) | 是 | 'manual' | `manual/lead/opportunity/ticket/conversation/system` |
| source_id | uuid | 否 | null | 来源ID |
| created_at | timestamptz | 是 | now() | - |
| updated_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
| updated_by | uuid | 否 | null | - |
| deleted_at | timestamptz | 否 | null | 软删除 |
| version | int | 是 | 1 | 乐观锁 |
索引/约束：
- `idx_tasks_org_assignee_status(org_id,assignee_user_id,status)`
- `idx_tasks_org_due(org_id,due_at)`

#### TABLE-NTF-001 notifications
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| user_id | uuid | 是 | - | 接收人 |
| type | varchar(32) | 是 | 'business' | `system/business/alert` |
| title | varchar(255) | 是 | - | 标题 |
| content | text | 是 | - | 内容 |
| is_read | boolean | 是 | false | 已读标记 |
| read_at | timestamptz | 否 | null | 已读时间 |
| source_type | varchar(32) | 否 | null | 来源类型 |
| source_id | uuid | 否 | null | 来源ID |
| created_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
| updated_at | timestamptz | 是 | now() | - |
| updated_by | uuid | 否 | null | - |
索引/约束：
- `idx_notifications_org_user_read(org_id,user_id,is_read,created_at desc)`

#### TABLE-CHN-001 channels
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| name | varchar(64) | 是 | - | 渠道名称 |
| type | varchar(32) | 是 | 'webchat' | `webchat/wechat/whatsapp/facebook/custom` |
| status | varchar(16) | 是 | 'enabled' | `enabled/disabled` |
| config | jsonb | 是 | '{}'::jsonb | 渠道配置 |
| callback_url | varchar(255) | 否 | null | 回调地址 |
| secret_ciphertext | varchar(255) | 否 | null | 加密密钥 |
| created_at | timestamptz | 是 | now() | - |
| updated_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
| updated_by | uuid | 否 | null | - |
| deleted_at | timestamptz | 否 | null | 软删除 |
| version | int | 是 | 1 | 乐观锁 |
索引/约束：
- `uq_channels_org_name(org_id,name)`
- `idx_channels_org_status(org_id,status)`

### 6.4 AI / AUD / SYS

#### TABLE-AI-001 ai_tasks
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| conversation_id | uuid | 否 | null | FK -> conversations.id |
| trigger_message_id | uuid | 否 | null | FK -> conversation_messages.id |
| task_type | varchar(32) | 是 | 'smart_reply' | P0 固定 smart_reply |
| status | varchar(16) | 是 | 'pending' | `SM-ai_task` |
| provider | varchar(32) | 是 | - | 提供商标识 |
| model | varchar(64) | 是 | - | 模型名 |
| prompt_template_id | varchar(64) | 是 | - | 模板ID |
| prompt_vars | jsonb | 是 | '{}'::jsonb | 模板变量 |
| input_payload | jsonb | 是 | '{}'::jsonb | 输入快照 |
| output_payload | jsonb | 否 | null | 输出结构化结果 |
| output_text | text | 否 | null | 建议回复文本 |
| error_code | varchar(64) | 否 | null | 失败码 |
| error_message | varchar(255) | 否 | null | 失败说明 |
| token_input | int | 是 | 0 | 输入token |
| token_output | int | 是 | 0 | 输出token |
| cost_amount | numeric(12,6) | 是 | 0 | 成本 |
| currency | varchar(8) | 是 | 'CNY' | 币种 |
| retry_count | int | 是 | 0 | 重试次数 |
| started_at | timestamptz | 否 | null | 开始时间 |
| finished_at | timestamptz | 否 | null | 完成时间 |
| created_at | timestamptz | 是 | now() | - |
| updated_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
| updated_by | uuid | 否 | null | - |
索引/约束：
- `idx_ai_tasks_org_status(org_id,status,created_at desc)`
- `idx_ai_tasks_org_conversation(org_id,conversation_id,created_at desc)`

#### TABLE-AUD-001 audit_logs
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | bigserial | 是 | auto increment | PK |
| org_id | uuid | 是 | - | 租户 |
| request_id | varchar(64) | 是 | - | 链路追踪 |
| operator_id | uuid | 否 | null | 操作人 |
| api_id | varchar(32) | 否 | null | API 编号 |
| http_method | varchar(8) | 否 | null | 方法 |
| path | varchar(255) | 否 | null | 路径 |
| action | varchar(64) | 是 | - | 审计动作 |
| target_type | varchar(64) | 否 | null | 对象类型 |
| target_id | varchar(64) | 否 | null | 对象ID |
| result | varchar(16) | 是 | - | `success/failed` |
| error_code | varchar(64) | 否 | null | 错误码 |
| before_data | jsonb | 否 | null | 变更前 |
| after_data | jsonb | 否 | null | 变更后 |
| ip | varchar(64) | 否 | null | 来源IP |
| user_agent | varchar(255) | 否 | null | UA |
| created_at | timestamptz | 是 | now() | 记录时间 |
索引/约束：
- `idx_audit_logs_org_created(org_id,created_at desc)`
- `idx_audit_logs_org_action(org_id,action,created_at desc)`
- `idx_audit_logs_request_id(request_id)`

#### TABLE-SYS-001 system_configs
| 字段 | 类型 | 非空 | 默认值 | 约束/说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 是 | gen_random_uuid() | PK |
| org_id | uuid | 是 | - | FK -> organizations.id |
| module | varchar(32) | 是 | 'system' | 模块 |
| config_key | varchar(64) | 是 | - | 组织内唯一 |
| value_type | varchar(16) | 是 | 'string' | `string/number/boolean/json` |
| config_value | jsonb | 是 | '{}'::jsonb | 值 |
| is_secret | boolean | 是 | false | 是否敏感 |
| description | varchar(255) | 否 | null | 描述 |
| created_at | timestamptz | 是 | now() | - |
| updated_at | timestamptz | 是 | now() | - |
| created_by | uuid | 否 | null | - |
| updated_by | uuid | 否 | null | - |
| deleted_at | timestamptz | 否 | null | 软删除 |
| version | int | 是 | 1 | 乐观锁 |
索引/约束：
- `uq_system_configs_org_key(org_id,config_key)`
- `idx_system_configs_org_module(org_id,module)`

## 7. 外键与级联规则
| 子表 | 外键 | 父表 | on delete |
| --- | --- | --- | --- |
| departments | org_id | organizations.id | restrict |
| users | org_id | organizations.id | restrict |
| users | department_id | departments.id | set null |
| roles | org_id | organizations.id | restrict |
| permissions | org_id | organizations.id | restrict |
| user_roles | user_id | users.id | cascade |
| user_roles | role_id | roles.id | cascade |
| role_permissions | role_id | roles.id | cascade |
| role_permissions | permission_id | permissions.id | cascade |
| customer_contacts | customer_id | customers.id | cascade |
| leads | converted_opportunity_id | opportunities.id | set null |
| lead_follow_ups | lead_id | leads.id | cascade |
| opportunities | customer_id | customers.id | restrict |
| opportunities | lead_id | leads.id | set null |
| opportunity_stage_histories | opportunity_id | opportunities.id | cascade |
| conversations | channel_id | channels.id | restrict |
| conversations | customer_id | customers.id | set null |
| conversation_messages | conversation_id | conversations.id | cascade |
| tickets | source_id | conversations.id | set null（source_type=conversation 时） |
| ticket_logs | ticket_id | tickets.id | cascade |
| ai_tasks | conversation_id | conversations.id | set null |
| ai_tasks | trigger_message_id | conversation_messages.id | set null |
| system_configs | org_id | organizations.id | restrict |

循环依赖说明：
- `leads.converted_opportunity_id -> opportunities.id` 与 `opportunities.lead_id -> leads.id` 构成循环依赖。
- migration 必须采用“先建表，后补外键”策略（见第 8 章）。

## 8. Migration 执行顺序（强制）
阶段A（建表与可直接外键）：
1. `organizations`
2. `departments`
3. `users`
4. `roles`
5. `permissions`
6. `user_roles`
7. `role_permissions`
8. `customers`
9. `customer_contacts`
10. `leads`（先不加 `converted_opportunity_id -> opportunities.id` 外键）
11. `opportunities`（可直接加 `lead_id -> leads.id`）
12. `lead_follow_ups`
13. `opportunity_stage_histories`
14. `channels`
15. `conversations`
16. `conversation_messages`
17. `tickets`
18. `ticket_logs`
19. `tasks`
20. `notifications`
21. `ai_tasks`
22. `system_configs`
23. `audit_logs`

阶段B（补充循环依赖外键）：
24. `alter table leads add constraint fk_leads_converted_opportunity foreign key (converted_opportunity_id) references opportunities(id) on delete set null;`

## 9. 初始化种子数据范围（P0）
- 组织：创建 1 个默认组织（仅 DEV/TEST），PROD 由租户开通流程创建。
- 角色：`ROLE-ADMIN/ROLE-SALES_MANAGER/ROLE-SALES_REP/ROLE-SERVICE_MANAGER/ROLE-SERVICE_AGENT`。
- 权限：`17_权限模型设计.md` 全量 PERM 清单。
- 角色权限映射：按 `17_权限模型设计.md` 第 5 章。
- 默认渠道：`webchat`，状态 `enabled`。
- 默认系统配置：
  - `conversation.timeout_minutes=30`
  - `ticket.sla_hours=24`
  - `ai.timeout_ms=8000`
  - `list.default_page_size=20`

## 10. 与 API/状态机一致性检查点
- API 任何 `status/stage/result` 字段必须落在第 5 章枚举范围。
- `API-OM-006` 的 `result` 仅允许 `won/lost`。
- 所有查询必须附带 `org_id` 条件。
- 所有写接口必须维护 `version/updated_at/updated_by`，并写入 `audit_logs`。

## 11. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v5.0 | 2026-04-05 | 升级为实现级 DBD：逐表字段、类型、约束、索引、级联、迁移顺序、种子数据完整定义 |
| v4.0 | 2026-04-05 | DBD 收口重写：P0 表清单冻结，状态枚举统一 |
