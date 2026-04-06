# MOY API 契约与 Schema 字典

## 1. 文档定位
本文档是 MOY 唯一 API 实现级文档，统一收口：
- HTTP API
- WebSocket 事件
- 错误码约束
- 请求/响应 Schema 命名
- 并发、幂等、事务、审计规则

### 1.1 实现级展开入口
- `08` 主文继续承担 API / WS / Schema 的唯一主链索引与全局规则。
- 终局实现阶段的契约层最终实现输入统一以下列子文档为准：
  - [08A_原子API与Schema展开.md](./08A_原子API与Schema展开.md)
  - [08B_原子Schema字段字典.md](./08B_原子Schema字段字典.md)
- 本文后续章节中的区间 API、资源族级 schema 仅保留索引意义，不再作为 codegen、contract test、前后端联调的最终实现输入。

## 2. 全局强约束
- 统一前缀：`/api/v1`
- 路径参数统一 `{id}`，禁止 `:id`
- `/` 仅重定向到 `/dashboard`
- 写接口默认写审计日志
- 多租户隔离必须基于 `org_id`
- 乐观锁实体默认要求 `version`
- 商机结果字段仅允许 `won/lost`

## 3. 公共 Header / Response
### 3.1 Header Schema
| Schema | 字段 |
| --- | --- |
| `SCH-HEADER-AUTH` | `Authorization: Bearer <token>` |
| `SCH-HEADER-REQID` | `X-Request-Id: <uuid>` |
| `SCH-HEADER-IDEMPOTENCY` | `Idempotency-Key: <string>` |
| `SCH-HEADER-PORTAL` | `X-Portal-Token: <token>`（客户端/门户） |

### 3.2 通用 Path / Query
| Schema | 说明 |
| --- | --- |
| `SCH-PATH-ID` | `{id: uuid}` |
| `SCH-PAGE-QUERY` | `page/page_size/sort_by/sort_order` |
| `SCH-VERSION-BODY` | `version >= 1` |
| `SCH-LIST-META` | 列表分页返回元信息 |

### 3.3 统一成功响应
```json
{
  "code": "OK",
  "message": "success",
  "request_id": "req_xxx",
  "data": {},
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 0,
    "total_pages": 0,
    "sort_by": "created_at",
    "sort_order": "desc",
    "has_next": false
  }
}
```

### 3.4 典型错误码
| 错误码 | 说明 |
| --- | --- |
| `AUTH_UNAUTHORIZED` | 未认证或 token 失效 |
| `AUTH_FORBIDDEN` | 权限不足或跨租户访问 |
| `PARAM_INVALID` | 参数非法 |
| `RESOURCE_NOT_FOUND` | 资源不存在 |
| `CONFLICT_VERSION` | 乐观锁版本冲突 |
| `STATUS_TRANSITION_INVALID` | 状态迁移非法 |
| `RATE_LIMITED` | 限流命中 |
| `DUPLICATE_REQUEST` | 幂等键重复 |
| `AI_TASK_TIMEOUT` | AI 请求超时 |

## 4. Schema 命名规则
- 查询：`SCH-{MOD}-LIST-QUERY`
- 详情：`SCH-{MOD}-DETAIL`
- 创建：`SCH-{MOD}-CREATE`
- 更新：`SCH-{MOD}-UPDATE`
- 动作：`SCH-{MOD}-{ACTION}`
- 列表返回：`SCH-{MOD}-LIST-RESP`
- 事件：`WS-{event_name}`

### 4.1 原子 API-ID 展开规则
- `08A` 中只允许使用原子 `API-{MOD}-{NNN}` 作为最终实现输入。
- 本文中允许保留 `API-{MOD}-{start}~{end}` 作为压缩索引写法，但实现阶段必须以 `08A` 展开的原子 API-ID 为准。
- 同一行 `Method / Path` 中的端点顺序，必须与 API-ID 顺序一一对应；禁止自行重排。
- 若字段只写一组通用约束，则表示该约束对本区间全部原子 API-ID 生效。
- 若字段写成 `A / B / C` 多组模式，则按 API-ID 顺序逐项对应。
- 代码生成工具消费顺序固定为：`API-ID -> Method/Path -> Schema -> Permission -> Data Scope -> Transaction -> Idempotency -> Concurrency -> Audit`。

### 4.2 标准 REST 合同合成模板
| 路由模式 | 请求 Schema | 响应 Schema | 代码生成输出 |
| --- | --- | --- | --- |
| `GET /resources` | `SCH-{MOD}-LIST-QUERY` 或模块专用 `QUERY` | `SCH-{MOD}-LIST-RESP` | `List{Resource}QueryDto` + `findAll()` |
| `POST /resources` | `SCH-{MOD}-CREATE` | `SCH-{MOD}-DETAIL` | `Create{Resource}Dto` + `create()` |
| `GET /resources/{id}` | `SCH-PATH-ID` | `SCH-{MOD}-DETAIL` | `findOne(id)` |
| `PUT /resources/{id}` | `SCH-PATH-ID + SCH-{MOD}-UPDATE + SCH-VERSION-BODY` | `SCH-{MOD}-DETAIL` | `Update{Resource}Dto` + `update(id)` |
| `POST /resources/{id}/{action}` | `SCH-PATH-ID + SCH-{MOD}-{ACTION}` | `SCH-{MOD}-DETAIL` 或 `SCH-ACK` | `{action}()` Action DTO |
| `GET /resources/{id}/{subresource}` | `SCH-PATH-ID + SCH-{MOD}-{SUBRESOURCE}-QUERY` | `SCH-{MOD}-{SUBRESOURCE}-RESP` | 子资源查询 DTO |
| `POST /resources/export` | `SCH-{MOD}-EXPORT` | `SCH-{MOD}-EXPORT-JOB` 或 `SCH-ACK` | 导出作业 DTO |

### 4.3 框架生成约束
- NestJS：
  - Controller 名：`{ModulePlural}Controller`
  - DTO 名：由 `Schema` 直接转为 `Create/Update/Action/ListQuery/DetailResponse DTO`
  - Guard：由 `权限 + 数据范围` 直接生成 `PermissionGuard + DataScopeGuard`
  - 并发：存在 `version` 时必须注入乐观锁校验
  - 幂等：标记为“是”的接口必须挂 `IdempotencyInterceptor`
- React + TypeScript + Ant Design：
  - 列表页：直接消费 `LIST-QUERY + LIST-RESP`
  - 详情页：直接消费 `DETAIL`
  - 表单：`CREATE/UPDATE/ACTION` 直接生成 Form Item 与校验规则
  - 实时页：若 API 对应 `WS-*` 事件，页面必须接入实时刷新
- 生成器不得发明第二套 DTO、错误码或权限命名。

## 5. API 历史压缩索引（非最终实现输入）
本节仅保留模块级 API 历史索引，便于从旧文档快速定位。
- 最终实现输入：`08A`
- 字段级 schema 输入：`08B`
- 若本节与 `08A/08B` 不一致，以 `08A/08B` 为准。
说明：
- `权限` 为必须权限；匿名接口记 `-`
- `数据范围` 取 `SELF/TEAM/ORG/PORTAL`
- `并发` 为 `version` 或 `-`
- `示例` 使用 `EX-*` 占位，按同模块统一模式生成
- 区间行按 `4.1~4.3` 展开为原子 API-ID 后，才可进入 Controller / DTO / Client 代码生成。

### 5.1 平台基础
| API-ID | Method / Path | introduced_in | Path / Query / Body / Header | Response | 成功 / 失败 | 权限 | 数据范围 | 事务 | 幂等 | 并发 | 审计动作 | 示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-AUTH-001~003 | `POST /auth/login` `POST /auth/refresh` `GET /auth/me` | S1 | `- / - / SCH-AUTH-LOGIN 或 SCH-AUTH-REFRESH / SCH-HEADER-REQID` | `SCH-AUTH-SESSION` / `SCH-AUTH-ME` | `200/401` | - | SELF | 否 | 否 | - | `AUTH_LOGIN/AUTH_REFRESH/AUTH_ME_VIEW` | `EX-AUTH-001` |
| API-AUTH-004~005 | `POST /auth/forgot-password` `POST /auth/change-password` | S1 | `- / - / SCH-AUTH-PASSWORD / SCH-HEADER-AUTH` | `SCH-ACK` | `200/400/401` | - | SELF | 是 | 否 | - | `AUTH_PASSWORD_RESET/AUTH_PASSWORD_CHANGE` | `EX-AUTH-002` |
| API-AUTH-006~007 | `GET /auth/sessions` `POST /auth/sessions/{id}/revoke` | S2 | `SCH-PATH-ID / SCH-PAGE-QUERY / SCH-AUTH-SESSION-REVOKE / SCH-HEADER-AUTH` | `SCH-AUTH-SESSION-LIST` | `200/401/403` | `PERM-AUTH-SESSION` | SELF/ORG | 是 | 否 | `version` | `AUTH_SESSION_LIST/AUTH_SESSION_REVOKE` | `EX-AUTH-003` |
| API-ORG-001~007 | `PUT /organizations/{id}` `GET /organizations/{id}` `GET /departments` `POST /departments` `PUT /departments/{id}` `POST /organizations/{id}/bootstrap` `POST /organizations/{id}/configs` | S1 | `SCH-PATH-ID / SCH-ORG-* / SCH-ORG-* / SCH-HEADER-AUTH` | `SCH-ORG-DETAIL` | `200/201/400/403/409` | `PERM-ORG-MANAGE` | ORG | 是 | 创建类是 | `version` | `ORG_UPDATE/DEPARTMENT_CREATE/DEPARTMENT_UPDATE/ORG_BOOTSTRAP` | `EX-ORG-001` |
| API-USR-001~008 | `GET /users` `PUT /roles/{id}/permissions` `POST /users/{id}/status` `GET /roles` `GET /permissions` `POST /users/{id}/reset-password` `POST /permissions/resolve` `POST /permissions/rollback` | S1/S4 | `SCH-PATH-ID / SCH-USR-* / SCH-USR-* / SCH-HEADER-AUTH` | `SCH-USR-*` | `200/400/403/409` | `PERM-USR-MANAGE` | ORG | 是 | 写接口可选 | `version` | `USER_LIST_VIEW/ROLE_PERMISSION_UPDATE/USER_STATUS_CHANGE/PERMISSION_RESOLVE/ROLLBACK` | `EX-USR-001` |
| API-AUD-001~002 | `GET /audit-logs` `GET /audit-logs/export` | S1 | `- / SCH-AUD-LIST-QUERY / - / SCH-HEADER-AUTH` | `SCH-AUD-LIST` | `200/403` | `PERM-AUD-VIEW` | ORG | 否 | 否 | - | `AUDIT_LOG_VIEW/AUDIT_LOG_EXPORT` | `EX-AUD-001` |
| API-SYS-001~003 | `GET /dashboard/summary` `GET /system-configs` `PUT /system-configs/{id}` | S1 | `SCH-PATH-ID / SCH-SYS-* / SCH-SYS-* / SCH-HEADER-AUTH` | `SCH-SYS-DASHBOARD` / `SCH-SYS-CONFIG-*` | `200/400/403/409` | `PERM-SYS-VIEW` 或 `PERM-SYS-MANAGE` | ORG | `PUT` 是 | 否 | `version` | `DASHBOARD_SUMMARY_VIEW/SYS_CONFIG_UPDATE` | `EX-SYS-001` |

### 5.2 客户、线索、渠道、自动化
| API-ID | Method / Path | introduced_in | Path / Query / Body / Header | Response | 成功 / 失败 | 权限 | 数据范围 | 事务 | 幂等 | 并发 | 审计动作 | 示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-CM-001~005 | `GET /customers` `POST /customers` `GET /customers/{id}` `PUT /customers/{id}` `POST /customers/{id}/status` | S1 | `SCH-PATH-ID / SCH-CM-* / SCH-CM-* / SCH-HEADER-AUTH` | `SCH-CM-LIST` / `SCH-CM-DETAIL` | `200/201/400/403/409` | `PERM-CM-*` | SELF/TEAM/ORG | 写接口是 | 创建是 | `version` | `CUSTOMER_*` | `EX-CM-001` |
| API-CM-006~009 | `POST /customers/{id}/tags` `POST /customer-groups` `POST /customers/{id}/merge` `POST /customers/export` | S2 | `SCH-PATH-ID / - / SCH-CM-TAG/GROUP/MERGE/EXPORT / SCH-HEADER-AUTH` | `SCH-ACK` / `SCH-CM-EXPORT-JOB` | `200/201/400/403` | `PERM-CM-TAG/GROUP/MERGE/EXPORT` | ORG | 是 | 写接口是 | `version` | `CUSTOMER_TAG_BIND/GROUP_CREATE/MERGE/EXPORT` | `EX-CM-002` |
| API-LM-001~009 | `GET /leads` `POST /leads` `POST /leads/{id}/assign` `POST /leads/{id}/follow-ups` `POST /leads/{id}/convert` `GET /leads/{id}` `POST /leads/import` `POST /leads/{id}/score` `POST /leads/{id}/recycle` | S1/S2 | `SCH-PATH-ID / SCH-LM-* / SCH-LM-* / SCH-HEADER-AUTH` | `SCH-LM-*` | `200/201/400/403/409` | `PERM-LM-*` | SELF/TEAM/ORG | `convert` 跨表事务 | 创建/导入/转化是 | `version` | `LEAD_*` | `EX-LM-001` |
| API-CHN-001~006 | `GET /channels` `POST /channels` `PUT /channels/{id}` `POST /channels/extended` `POST /channels/{id}/verify` `POST /routing-rules` | S1/S3 | `SCH-PATH-ID / SCH-CHN-* / SCH-CHN-* / SCH-HEADER-AUTH` | `SCH-CHN-*` | `200/201/400/403/409` | `PERM-CHN-*` | ORG | 是 | 创建/验证是 | `version` | `CHANNEL_* / ROUTING_RULE_*` | `EX-CHN-001` |
| API-AUTO-001~006 | `GET/POST /campaigns` `GET/POST /segments` `GET/POST /automation-flows` `POST /automation-flows/{id}/execute` `GET/POST /campaign-assets` `GET /campaigns/{id}/metrics` | S2 | `SCH-PATH-ID / SCH-AUTO-* / SCH-AUTO-* / SCH-HEADER-AUTH` | `SCH-AUTO-*` | `200/201/400/403` | `PERM-AUTO-*` | ORG | 执行类是 | 创建/执行是 | `version` | `CAMPAIGN_* / AUTOMATION_FLOW_*` | `EX-AUTO-001` |

### 5.3 会话、工单、任务、通知、知识、看板
| API-ID | Method / Path | introduced_in | Path / Query / Body / Header | Response | 成功 / 失败 | 权限 | 数据范围 | 事务 | 幂等 | 并发 | 审计动作 | 示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-CNV-001~004 | `GET /conversations` `GET /conversations/{id}` `GET /conversations/{id}/messages` `POST /conversations/{id}/messages` | S1 | `SCH-PATH-ID / SCH-CNV-* / SCH-CNV-* / SCH-HEADER-AUTH` | `SCH-CNV-LIST` / `SCH-CNV-DETAIL` / `SCH-CNV-MESSAGES` | `200/201/400/403` | `PERM-CNV-VIEW/SEND` | SELF/TEAM/ORG | 发送是 | 发送是 | `version` | `CONVERSATION_* / MESSAGE_SEND` | `EX-CNV-001` |
| API-CNV-005~010 | `POST /conversations/{id}/accept` `POST /conversations/{id}/transfer` `POST /conversations/{id}/close` `POST /conversations/{id}/tickets` `GET /conversations/monitor` `POST /conversations/{id}/rating` | S1/S2 | `SCH-PATH-ID / SCH-CNV-ACTION / SCH-CNV-RATING / SCH-HEADER-AUTH` | `SCH-CNV-DETAIL` / `SCH-TK-DETAIL` / `SCH-CNV-RATING` | `200/201/400/403/409` | `PERM-CNV-*` | SELF/TEAM/ORG | 是 | 转工单是 | `version` | `CONVERSATION_ACCEPT/TRANSFER/CLOSE/CREATE_TICKET/RATE` | `EX-CNV-002` |
| API-TK-001~009 | `GET /tickets` `POST /tickets` `GET /tickets/{id}` `POST /tickets/{id}/assign` `POST /tickets/{id}/start` `POST /tickets/{id}/resolve` `POST /tickets/{id}/close` `PUT /sla-configs/{id}` `GET /tickets/metrics` | S1/S2 | `SCH-PATH-ID / SCH-TK-* / SCH-TK-* / SCH-HEADER-AUTH` | `SCH-TK-*` | `200/201/400/403/409` | `PERM-TK-*` | SELF/TEAM/ORG | 是 | 创建是 | `version` | `TICKET_* / SLA_CONFIG_*` | `EX-TK-001` |
| API-TSK-001~005 | `GET /tasks` `POST /tasks` `PUT /tasks/{id}` `POST /tasks/{id}/status` `POST /tasks/{id}/remind` | S1 | `SCH-PATH-ID / SCH-TSK-* / SCH-TSK-* / SCH-HEADER-AUTH` | `SCH-TSK-*` | `200/201/400/403/409` | `PERM-TSK-*` | SELF/TEAM/ORG | 是 | 创建/提醒是 | `version` | `TASK_*` | `EX-TSK-001` |
| API-NTF-001~003 | `GET /notifications` `POST /notifications/{id}/read` `PUT /notification-preferences` | S1/S2 | `SCH-PATH-ID / SCH-NTF-* / SCH-NTF-* / SCH-HEADER-AUTH` | `SCH-NTF-*` | `200/400/403` | `PERM-NTF-*` | SELF | 是 | 否 | `version` | `NOTIFICATION_LIST/READ/PREFERENCE_UPDATE` | `EX-NTF-001` |
| API-KB-001~006 | `GET /knowledge/items` `GET /knowledge/items/{id}` `POST /knowledge/items` `PUT /knowledge/items/{id}` `POST /knowledge/items/{id}/review` `POST /knowledge/ask` | S2 | `SCH-PATH-ID / SCH-KB-* / SCH-KB-* / SCH-HEADER-AUTH` | `SCH-KB-*` | `200/201/400/403/409` | `PERM-KB-*` | ORG/PORTAL | 是 | 创建/提问是 | `version` | `KNOWLEDGE_* / KNOWLEDGE_ASK` | `EX-KB-001` |
| API-DASH-001~003 | `GET /dashboards/sales` `GET /dashboards/service` `GET /dashboards/executive` | S2 | `- / SCH-DASH-QUERY / - / SCH-HEADER-AUTH` | `SCH-DASH-*` | `200/400/403` | `PERM-DASH-VIEW` | TEAM/ORG | 否 | 否 | - | `DASHBOARD_VIEW` | `EX-DASH-001` |

### 5.4 商机、报价、合同、订单、客户成功
| API-ID | Method / Path | introduced_in | Path / Query / Body / Header | Response | 成功 / 失败 | 权限 | 数据范围 | 事务 | 幂等 | 并发 | 审计动作 | 示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-OM-001~009 | `GET /opportunities` `POST /opportunities` `GET /opportunities/{id}` `PUT /opportunities/{id}` `POST /opportunities/{id}/stage` `POST /opportunities/{id}/result` `GET /opportunities/{id}/forecast` `POST /opportunities/{id}/pause` `POST /opportunities/{id}/quotes` | S1/S2 | `SCH-PATH-ID / SCH-OM-* / SCH-OM-* / SCH-HEADER-AUTH` | `SCH-OM-*` | `200/201/400/403/409` | `PERM-OM-*` | SELF/TEAM/ORG | 阶段/结果/转报价是 | 创建/转报价是 | `version` | `OPPORTUNITY_*` | `EX-OM-001` |
| API-QT-001~004 | `GET/POST /quotes` `GET/PUT /quotes/{id}` `POST /quotes/{id}/submit-approval` `POST /quotes/{id}/send` | S2 | `SCH-PATH-ID / SCH-QT-* / SCH-QT-* / SCH-HEADER-AUTH` | `SCH-QT-*` | `200/201/400/403/409` | `PERM-QT-*` | SELF/TEAM/ORG | 是 | 创建/发送是 | `version` | `QUOTE_*` | `EX-QT-001` |
| API-CT-001~005 | `GET/POST /contracts` `GET/PUT /contracts/{id}` `POST /contracts/{id}/submit-approval` `POST /contracts/{id}/sign` `POST /contracts/{id}/expire-check` | S2 | `SCH-PATH-ID / SCH-CT-* / SCH-CT-* / SCH-HEADER-AUTH` | `SCH-CT-*` | `200/201/400/403/409` | `PERM-CT-*` | SELF/TEAM/ORG | 是 | 创建/签署是 | `version` | `CONTRACT_*` | `EX-CT-001` |
| API-ORD-001~004 | `GET/POST /orders` `GET/PUT /orders/{id}` `POST /orders/{id}/activate` `POST /orders/{id}/refund` | S3 | `SCH-PATH-ID / SCH-ORD-* / SCH-ORD-* / SCH-HEADER-AUTH` | `SCH-ORD-*` | `200/201/400/403/409` | `PERM-ORD-*` | ORG | 是 | 创建/激活/退款是 | `version` | `ORDER_*` | `EX-ORD-001` |
| API-CSM-001~004 | `GET /customers/{id}/health` `GET/POST /success-plans` `GET /renewals/workbench` `POST /customers/{id}/expansion-recommendations` | S2 | `SCH-PATH-ID / SCH-CSM-* / SCH-CSM-* / SCH-HEADER-AUTH` | `SCH-CSM-*` | `200/201/400/403` | `PERM-CSM-*` | TEAM/ORG | 是 | 创建/推荐是 | `version` | `CSM_*` | `EX-CSM-001` |

### 5.5 AI、商业化、集成与多端
| API-ID | Method / Path | introduced_in | Path / Query / Body / Header | Response | 成功 / 失败 | 权限 | 数据范围 | 事务 | 幂等 | 并发 | 审计动作 | 示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-AI-001~010 | `POST /ai/smart-reply` `GET /ai/tasks/{id}` `GET/POST /ai/agents` `POST /ai/agents/{id}/run` `GET /ai/approval-requests` `POST /ai/approval-requests/{id}/decision` `GET/PUT /ai/quality-rules` `GET /ai/quality-reports` `POST /ai/rollbacks` `POST /ai/takeovers` | S1/S2 | `SCH-PATH-ID / SCH-AI-* / SCH-AI-* / SCH-HEADER-AUTH` | `SCH-AI-*` | `200/201/202/400/403/409/429` | `PERM-AI-*` | SELF/TEAM/ORG | 运行/审批/回滚是 | 任务/执行是 | `version` | `AI_*` | `EX-AI-001` |
| API-PLAN-001~003 | `GET/POST /plans` `GET/POST /add-ons` `GET/PUT /quota-policies/{id}` | S3 | `SCH-PATH-ID / SCH-PLAN-* / SCH-PLAN-* / SCH-HEADER-AUTH` | `SCH-PLAN-*` | `200/201/400/403/409` | `PERM-PLAN-MANAGE` | ORG | 是 | 创建是 | `version` | `PLAN_* / QUOTA_POLICY_*` | `EX-PLAN-001` |
| API-SUB-001~004 | `GET/POST /subscriptions` `GET/PUT /subscriptions/{id}` `POST /subscriptions/{id}/renew` `POST /subscriptions/{id}/suspend` | S3 | `SCH-PATH-ID / SCH-SUB-* / SCH-SUB-* / SCH-HEADER-AUTH` | `SCH-SUB-*` | `200/201/400/403/409` | `PERM-SUB-*` | ORG | 是 | 创建/续费/暂停是 | `version` | `SUBSCRIPTION_*` | `EX-SUB-001` |
| API-BILL-001~004 | `GET/POST /bills` `GET /bills/{id}` `GET /bills/{id}/export` `POST /bills/{id}/collect` | S3 | `SCH-PATH-ID / SCH-BILL-* / SCH-BILL-* / SCH-HEADER-AUTH` | `SCH-BILL-*` | `200/201/400/403/409` | `PERM-BILL-*` | ORG | 是 | 生成/催缴是 | `version` | `BILL_*` | `EX-BILL-001` |
| API-PAY-001~002 | `POST /payments` `POST /payments/{id}/reconcile` | S3 | `SCH-PATH-ID / SCH-PAY-* / SCH-PAY-* / SCH-HEADER-AUTH` | `SCH-PAY-*` | `200/201/400/403/409` | `PERM-PAY-*` | ORG | 是 | 创建/对账是 | `version` | `PAYMENT_*` | `EX-PAY-001` |
| API-INV-001~003 | `GET/POST /invoices` `POST /invoices/{id}/issue` `POST /invoices/{id}/deliver` | S3 | `SCH-PATH-ID / SCH-INV-* / SCH-INV-* / SCH-HEADER-AUTH` | `SCH-INV-*` | `200/201/400/403/409` | `PERM-INV-*` | ORG/PORTAL | 是 | 创建/开具是 | `version` | `INVOICE_*` | `EX-INV-001` |
| API-INT-001~005 | `GET/POST /integrations` `GET/POST /integration-flows` `GET/POST /integration-mappings` `GET/POST /webhooks` `GET/POST /api-clients` | S3 | `SCH-PATH-ID / SCH-INT-* / SCH-INT-* / SCH-HEADER-AUTH` | `SCH-INT-*` | `200/201/400/403/409` | `PERM-INT-*` | ORG | 是 | 创建是 | `version` | `INTEGRATION_* / WEBHOOK_* / API_CLIENT_*` | `EX-INT-001` |
| API-PLT-001~004 | `GET /portal/home` `GET /mobile/workspace` `POST /mobile/push-tokens` `PUT /terminal-profiles/{id}` | S3 | `SCH-PATH-ID / SCH-PLT-* / SCH-PLT-* / SCH-HEADER-AUTH 或 SCH-HEADER-PORTAL` | `SCH-PLT-*` | `200/201/400/403` | `PERM-PLT-MANAGE` 或门户令牌 | PORTAL/SELF/ORG | 是 | 推送 token 创建是 | `version` | `PORTAL_VIEW/MOBILE_TOKEN_BIND/TERMINAL_PROFILE_UPDATE` | `EX-PLT-001` |
| API-I18N-001~003 | `GET/PUT /locale-resources/{id}` `GET/PUT /region-policies/{id}` `POST /consent-records` | S4 | `SCH-PATH-ID / SCH-I18N-* / SCH-I18N-* / SCH-HEADER-AUTH` | `SCH-I18N-*` | `200/201/400/403/409` | `PERM-I18N-MANAGE` | ORG | 是 | 创建是 | `version` | `LOCALE_RESOURCE_* / REGION_POLICY_* / CONSENT_RECORD_*` | `EX-I18N-001` |
| API-DEPLOY-001~003 | `GET/PUT /deployment-profiles/{id}` `POST /migration-batches` `POST /license-tokens/activate` | S3 | `SCH-PATH-ID / SCH-DEPLOY-* / SCH-DEPLOY-* / SCH-HEADER-AUTH` | `SCH-DEPLOY-*` | `200/201/400/403/409` | `PERM-DEPLOY-MANAGE` | ORG/ENV | 是 | 创建/激活是 | `version` | `DEPLOYMENT_PROFILE_* / MIGRATION_BATCH_* / LICENSE_ACTIVATE` | `EX-DEPLOY-001` |

## 6. WebSocket 事件字典
| 事件 | 触发源 | Payload Schema | 说明 |
| --- | --- | --- | --- |
| `conversation.message.created` | API-CNV-004 | `WS-conversation-message-created` | 新消息 |
| `conversation.status.changed` | API-CNV-005/006/007 | `WS-conversation-status-changed` | 接入/转接/关闭 |
| `ticket.created` | API-CNV-008,API-TK-002 | `WS-ticket-created` | 新工单 |
| `ticket.status.changed` | API-TK-004~007 | `WS-ticket-status-changed` | 工单流转 |
| `notification.created` | 系统通知创建器 | `WS-notification-created` | 新通知 |
| `ai.task.status.changed` | AI worker | `WS-ai-task-status-changed` | AI 任务变化 |
| `bill.status.changed` | API-BILL-001~004, API-PAY-001 | `WS-bill-status-changed` | 账单状态变化 |
| `subscription.status.changed` | API-SUB-001~004 | `WS-subscription-status-changed` | 订阅状态变化 |

## 7. Schema 历史索引（非最终实现输入）
本节仅保留旧口径的 schema 族级导航，帮助从模块入口跳转到实现级定义。
- 最终 schema 定义：`08A` + `08B`
- 本节中的 `SCH-XXX-*` 不得直接用于 DTO / controller / client / contract test 生成。

### 7.1 资源族 Schema
| 资源族 | Query | Create | Update | Detail | List Response |
| --- | --- | --- | --- | --- | --- |
| AUTH | `SCH-AUTH-LOGIN`, `SCH-AUTH-REFRESH` | - | `SCH-AUTH-PASSWORD` | `SCH-AUTH-ME` | - |
| ORG / USR | `SCH-ORG-LIST`, `SCH-USR-LIST` | `SCH-ORG-DEPARTMENT-CREATE`, `SCH-USR-CREATE` | `SCH-ORG-UPDATE`, `SCH-USR-UPDATE` | `SCH-ORG-DETAIL`, `SCH-USR-DETAIL` | `SCH-ORG-LIST-RESP`, `SCH-USR-LIST-RESP` |
| CM / LM / OM | `SCH-CM-LIST`, `SCH-LM-LIST`, `SCH-OM-LIST` | `SCH-CM-CREATE`, `SCH-LM-CREATE`, `SCH-OM-CREATE` | `SCH-CM-UPDATE`, `SCH-OM-UPDATE` | `SCH-CM-DETAIL`, `SCH-LM-DETAIL`, `SCH-OM-DETAIL` | `SCH-CM-LIST-RESP`, `SCH-LM-LIST-RESP`, `SCH-OM-LIST-RESP` |
| CNV / TK / TSK / NTF | `SCH-CNV-LIST`, `SCH-TK-LIST`, `SCH-TSK-LIST`, `SCH-NTF-LIST` | `SCH-CNV-SEND`, `SCH-TK-CREATE`, `SCH-TSK-CREATE` | `SCH-TSK-UPDATE`, `SCH-NTF-PREFERENCE` | `SCH-CNV-DETAIL`, `SCH-TK-DETAIL`, `SCH-TSK-DETAIL` | `SCH-CNV-LIST-RESP`, `SCH-TK-LIST-RESP`, `SCH-TSK-LIST-RESP`, `SCH-NTF-LIST-RESP` |
| KB / DASH / AUTO | `SCH-KB-LIST`, `SCH-DASH-QUERY`, `SCH-AUTO-LIST` | `SCH-KB-CREATE`, `SCH-AUTO-CREATE` | `SCH-KB-UPDATE`, `SCH-AUTO-UPDATE` | `SCH-KB-DETAIL`, `SCH-AUTO-DETAIL` | `SCH-KB-LIST-RESP`, `SCH-AUTO-LIST-RESP` |
| QT / CT / ORD | `SCH-QT-LIST`, `SCH-CT-LIST`, `SCH-ORD-LIST` | `SCH-QT-CREATE`, `SCH-CT-CREATE`, `SCH-ORD-CREATE` | `SCH-QT-UPDATE`, `SCH-CT-UPDATE`, `SCH-ORD-UPDATE` | `SCH-QT-DETAIL`, `SCH-CT-DETAIL`, `SCH-ORD-DETAIL` | `SCH-QT-LIST-RESP`, `SCH-CT-LIST-RESP`, `SCH-ORD-LIST-RESP` |
| PLAN / SUB / BILL / PAY / INV | `SCH-PLAN-LIST`, `SCH-SUB-LIST`, `SCH-BILL-LIST`, `SCH-PAY-LIST`, `SCH-INV-LIST` | `SCH-PLAN-CREATE`, `SCH-SUB-CREATE`, `SCH-BILL-CREATE`, `SCH-PAY-CREATE`, `SCH-INV-CREATE` | `SCH-PLAN-UPDATE`, `SCH-SUB-UPDATE` | `SCH-PLAN-DETAIL`, `SCH-SUB-DETAIL`, `SCH-BILL-DETAIL`, `SCH-PAY-DETAIL`, `SCH-INV-DETAIL` | `SCH-PLAN-LIST-RESP`, `SCH-SUB-LIST-RESP`, `SCH-BILL-LIST-RESP`, `SCH-PAY-LIST-RESP`, `SCH-INV-LIST-RESP` |
| CSM / INT / PLT / I18N / DEPLOY | `SCH-CSM-*`, `SCH-INT-*`, `SCH-PLT-*`, `SCH-I18N-*`, `SCH-DEPLOY-*` | 同模块 `CREATE` | 同模块 `UPDATE` | 同模块 `DETAIL` | 同模块 `LIST-RESP` |

### 7.2 示例模式
- `EX-*-001`：标准创建/查询流程
- `EX-*-002`：状态迁移或审批流程
- `EX-*-003`：异步 / Webhook / 回调 / 导出流程

## 8. 事务、幂等、并发策略
- 幂等键强制接口：
  - 创建类：`/customers`, `/leads`, `/opportunities`, `/tickets`, `/tasks`, `/payments`
  - 异步执行类：`/ai/smart-reply`, `/automation-flows/{id}/execute`
  - 开票/催缴/迁移：`/invoices`, `/bills/{id}/collect`, `/migration-batches`
- 需要显式事务的场景：
  - `lead -> opportunity`
  - `conversation -> ticket`
  - `order -> subscription`
  - `bill -> payment -> invoice`
- 需要 `version` 的资源：
  - 所有 `PROFILE-MUTABLE` 表对应主资源

## 9. 变更规则
- 任何 API 变更必须至少同步：`03 -> 04 -> 08 -> 09 -> 12`。
- 不允许在 SSOT 外维护第二套错误码、Schema 或 WebSocket 文档。
- 新增 API 时，必须先满足 `4.1~4.3` 的原子展开条件，并同步回写 `08A/08B -> 09/09A -> 12/12A -> 04`。
