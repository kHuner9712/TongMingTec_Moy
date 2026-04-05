# MOY 接口设计说明（API）

## 1. 文档元信息
| 属性 | 内容 |
| --- | --- |
| 文档编号 | MOY_API_001 |
| 文档版本 | v4.0 |
| 文档状态 | 已确认（实现级冻结） |
| 日期 | 2026-04-05 |
| 上游输入 | `06_PRD`、`07_RTM`、`10_DBD`、`17_权限模型设计`、`27_状态机实现规范` |
| 下游约束 | NestJS Controller/DTO/Service、前端 API Client、自动化测试 |

## 2. 总契约规则（强制）
- 路径参数统一 `{id}`（文档口径禁止 `:id`）。
- 统一前缀：`/api/v1`。
- 商机结果字段仅允许 `won/lost`。
- 请求头：
  - `Authorization: Bearer <token>`（登录与刷新除外）
  - `X-Request-Id: <uuid>`（可选，缺省由服务端生成）
  - `Idempotency-Key: <string>`（见第 6 章）
- 写接口必须落审计日志（`TABLE-AUD-001`）。
- 数据隔离必须基于 `org_id`。

## 3. 统一响应格式

### 3.1 成功
```json
{
  "code": "OK",
  "message": "success",
  "request_id": "6f893026-82d2-4bf5-a9d9-f038d08b4a2c",
  "data": {},
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 128,
    "total_pages": 7,
    "sort_by": "created_at",
    "sort_order": "desc",
    "has_next": true
  }
}
```

### 3.2 失败
```json
{
  "code": "STATUS_TRANSITION_INVALID",
  "message": "invalid transition from assigned to resolved",
  "request_id": "6f893026-82d2-4bf5-a9d9-f038d08b4a2c",
  "error": {
    "field": "status",
    "detail": "SM-ticket only allows assigned -> processing"
  }
}
```

## 4. 分页/排序/过滤统一规则
- 分页参数：`page`（>=1，默认 1），`page_size`（1~100，默认 20）。
- 排序参数：`sort_by`、`sort_order(asc|desc)`；未传默认 `created_at desc`。
- 列表返回必须包含 `meta`。
- 各列表过滤字段与校验见：`42_API请求响应Schema字典.md`。

## 5. 并发、事务、审计、数据范围规则

### 5.1 并发更新
- 所有可变业务实体（含 customers/leads/opportunities/conversations/tickets/tasks/channels/system_configs）都带 `version`。
- 更新请求必须携带 `version`。
- `version` 不匹配返回 `CONFLICT_VERSION`（HTTP 409）。

### 5.2 事务
- 单表写操作：单事务提交。
- 跨表/跨模块写操作（如线索转商机、会话转工单）必须显式事务。

### 5.3 审计
- 写操作审计字段：`request_id/org_id/operator_id/action/target_type/target_id/result/error_code`。
- 读操作默认不写审计，敏感读取（如审计日志查询）写 `AUDIT_LOG_VIEW`。

### 5.4 数据范围
- `ORG_SCOPE`：全组织。
- `TEAM_SCOPE`：本人及下属团队。
- `SELF_SCOPE`：仅本人。
- 实际范围由角色 `data_scope` 与权限共同决定。

## 6. API 契约总览（实现级）
说明：
- `Path/Query/Body/Resp Schema` 引用 `42_API请求响应Schema字典.md`。
- `2xx` 为成功码；`4xx/5xx` 为典型失败码，完整映射见 `28_API错误码清单.md`。
- 下表 `Path` 为资源路径；完整路由 = `/api/v1` + `Path`。

| API ID | Method | Path | Path Schema | Query Schema | Body Schema | Resp Schema | 2xx | 典型错误码 | 权限 | 数据范围 | 幂等 | 事务 | 审计动作 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-AUTH-001 | POST | `/auth/login` | - | - | SCH-AUTH-LOGIN-REQ | SCH-AUTH-LOGIN-RESP | 200 | AUTH_UNAUTHORIZED, PARAM_INVALID, RATE_LIMITED | - | - | 否 | 否 | AUTH_LOGIN |
| API-AUTH-002 | POST | `/auth/refresh` | - | - | SCH-AUTH-REFRESH-REQ | SCH-AUTH-REFRESH-RESP | 200 | AUTH_UNAUTHORIZED, AUTH_TOKEN_EXPIRED | - | - | 否 | 否 | AUTH_REFRESH |
| API-AUTH-003 | GET | `/auth/me` | - | - | - | SCH-AUTH-ME-RESP | 200 | AUTH_UNAUTHORIZED | - | SELF_SCOPE | 否 | 否 | AUTH_ME_VIEW |
| API-USR-001 | GET | `/users` | - | SCH-USR-LIST-QUERY | - | SCH-USR-LIST-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-USR-MANAGE | ORG_SCOPE | 否 | 否 | USER_LIST_VIEW |
| API-USR-002 | PUT | `/roles/{id}/permissions` | SCH-PATH-ID | - | SCH-USR-ROLE-PERMS-REQ | SCH-USR-ROLE-PERMS-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND, PARAM_INVALID | PERM-USR-MANAGE | ORG_SCOPE | 否 | 是 | ROLE_PERMISSION_UPDATE |
| API-USR-003 | POST | `/users/{id}/status` | SCH-PATH-ID | - | SCH-USR-STATUS-REQ | SCH-USER-SUMMARY | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND, PARAM_INVALID | PERM-USR-MANAGE | ORG_SCOPE | 否 | 是 | USER_STATUS_CHANGE |
| API-USR-004 | GET | `/roles` | - | SCH-USR-ROLE-LIST-QUERY | - | SCH-USR-ROLE-LIST-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-USR-MANAGE | ORG_SCOPE | 否 | 否 | ROLE_LIST_VIEW |
| API-USR-005 | GET | `/permissions` | - | SCH-USR-PERMISSION-LIST-QUERY | - | SCH-USR-PERMISSION-LIST-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-USR-MANAGE | ORG_SCOPE | 否 | 否 | PERMISSION_LIST_VIEW |
| API-ORG-001 | PUT | `/organizations/{id}` | SCH-PATH-ID | - | SCH-ORG-UPDATE-REQ | SCH-ORG-UPDATE-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND, CONFLICT_VERSION | PERM-ORG-MANAGE | ORG_SCOPE | 否 | 是 | ORG_UPDATE |
| API-ORG-002 | GET | `/organizations/{id}` | SCH-PATH-ID | - | - | SCH-ORG-UPDATE-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND | PERM-ORG-MANAGE | ORG_SCOPE | 否 | 否 | ORG_DETAIL_VIEW |
| API-ORG-003 | GET | `/departments` | - | SCH-ORG-DEPT-LIST-QUERY | - | SCH-ORG-DEPT-LIST-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-ORG-MANAGE | ORG_SCOPE | 否 | 否 | DEPARTMENT_LIST_VIEW |
| API-ORG-004 | POST | `/departments` | - | - | SCH-ORG-DEPT-CREATE-REQ | SCH-ORG-DEPT-DETAIL-RESP | 201 | AUTH_FORBIDDEN, PARAM_INVALID, DUPLICATE_REQUEST | PERM-ORG-MANAGE | ORG_SCOPE | 是 | 是 | DEPARTMENT_CREATE |
| API-ORG-005 | PUT | `/departments/{id}` | SCH-PATH-ID | - | SCH-ORG-DEPT-UPDATE-REQ | SCH-ORG-DEPT-DETAIL-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND, CONFLICT_VERSION | PERM-ORG-MANAGE | ORG_SCOPE | 否 | 是 | DEPARTMENT_UPDATE |
| API-CM-001 | GET | `/customers` | - | SCH-CM-LIST-QUERY | - | SCH-CM-LIST-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-CM-VIEW | SELF/TEAM/ORG | 否 | 否 | CUSTOMER_LIST_VIEW |
| API-CM-002 | POST | `/customers` | - | - | SCH-CM-CREATE-REQ | SCH-CM-DETAIL-RESP | 201 | AUTH_FORBIDDEN, PARAM_INVALID, DUPLICATE_REQUEST | PERM-CM-CREATE | SELF/TEAM/ORG | 是 | 是 | CUSTOMER_CREATE |
| API-CM-003 | GET | `/customers/{id}` | SCH-PATH-ID | - | - | SCH-CM-DETAIL-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND | PERM-CM-VIEW | SELF/TEAM/ORG | 否 | 否 | CUSTOMER_DETAIL_VIEW |
| API-CM-004 | PUT | `/customers/{id}` | SCH-PATH-ID | - | SCH-CM-UPDATE-REQ | SCH-CM-DETAIL-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND, CONFLICT_VERSION | PERM-CM-UPDATE | SELF/TEAM/ORG | 否 | 是 | CUSTOMER_UPDATE |
| API-CM-005 | POST | `/customers/{id}/status` | SCH-PATH-ID | - | SCH-CM-STATUS-REQ | SCH-CM-DETAIL-RESP | 200 | STATUS_TRANSITION_INVALID, AUTH_FORBIDDEN | PERM-CM-STATUS | SELF/TEAM/ORG | 否 | 是 | CUSTOMER_STATUS_CHANGE |
| API-LM-001 | GET | `/leads` | - | SCH-LM-LIST-QUERY | - | SCH-LM-LIST-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-LM-VIEW | SELF/TEAM/ORG | 否 | 否 | LEAD_LIST_VIEW |
| API-LM-002 | POST | `/leads` | - | - | SCH-LM-CREATE-REQ | SCH-LM-DETAIL-RESP | 201 | AUTH_FORBIDDEN, PARAM_INVALID, DUPLICATE_REQUEST | PERM-LM-CREATE | SELF/TEAM/ORG | 是 | 是 | LEAD_CREATE |
| API-LM-003 | POST | `/leads/{id}/assign` | SCH-PATH-ID | - | SCH-LM-ASSIGN-REQ | SCH-LM-DETAIL-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND, STATUS_TRANSITION_INVALID | PERM-LM-ASSIGN | TEAM/ORG | 否 | 是 | LEAD_ASSIGN |
| API-LM-004 | POST | `/leads/{id}/follow-ups` | SCH-PATH-ID | - | SCH-LM-FOLLOWUP-REQ | SCH-LM-FOLLOWUP-RESP | 201 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND, PARAM_INVALID | PERM-LM-FOLLOW_UP | SELF/TEAM/ORG | 是 | 是 | LEAD_FOLLOW_UP |
| API-LM-005 | POST | `/leads/{id}/convert` | SCH-PATH-ID | - | SCH-LM-CONVERT-REQ | SCH-LM-CONVERT-RESP | 200 | AUTH_FORBIDDEN, STATUS_TRANSITION_INVALID, DUPLICATE_REQUEST | PERM-LM-CONVERT | SELF/TEAM/ORG | 是 | 是（跨表） | LEAD_CONVERT |
| API-LM-006 | GET | `/leads/{id}` | SCH-PATH-ID | - | - | SCH-LM-DETAIL-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND | PERM-LM-VIEW | SELF/TEAM/ORG | 否 | 否 | LEAD_DETAIL_VIEW |
| API-OM-001 | GET | `/opportunities` | - | SCH-OM-LIST-QUERY | - | SCH-OM-LIST-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-OM-VIEW | SELF/TEAM/ORG | 否 | 否 | OPPORTUNITY_LIST_VIEW |
| API-OM-002 | POST | `/opportunities` | - | - | SCH-OM-CREATE-REQ | SCH-OM-DETAIL-RESP | 201 | AUTH_FORBIDDEN, PARAM_INVALID, DUPLICATE_REQUEST | PERM-OM-CREATE | SELF/TEAM/ORG | 是 | 是 | OPPORTUNITY_CREATE |
| API-OM-003 | GET | `/opportunities/{id}` | SCH-PATH-ID | - | - | SCH-OM-DETAIL-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND | PERM-OM-VIEW | SELF/TEAM/ORG | 否 | 否 | OPPORTUNITY_DETAIL_VIEW |
| API-OM-004 | PUT | `/opportunities/{id}` | SCH-PATH-ID | - | SCH-OM-UPDATE-REQ | SCH-OM-DETAIL-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND, CONFLICT_VERSION | PERM-OM-UPDATE | SELF/TEAM/ORG | 否 | 是 | OPPORTUNITY_UPDATE |
| API-OM-005 | POST | `/opportunities/{id}/stage` | SCH-PATH-ID | - | SCH-OM-STAGE-REQ | SCH-OM-DETAIL-RESP | 200 | STATUS_TRANSITION_INVALID, AUTH_FORBIDDEN | PERM-OM-STAGE | SELF/TEAM/ORG | 否 | 是（含历史） | OPPORTUNITY_STAGE_CHANGE |
| API-OM-006 | POST | `/opportunities/{id}/result` | SCH-PATH-ID | - | SCH-OM-RESULT-REQ | SCH-OM-DETAIL-RESP | 200 | OM_RESULT_INVALID, STATUS_TRANSITION_INVALID | PERM-OM-RESULT | SELF/TEAM/ORG | 否 | 是 | OPPORTUNITY_RESULT_SET |
| API-CNV-001 | GET | `/conversations` | - | SCH-CNV-LIST-QUERY | - | SCH-CNV-LIST-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-CNV-VIEW | SELF/TEAM/ORG | 否 | 否 | CONVERSATION_LIST_VIEW |
| API-CNV-002 | GET | `/conversations/{id}` | SCH-PATH-ID | - | - | SCH-CNV-DETAIL-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND | PERM-CNV-VIEW | SELF/TEAM/ORG | 否 | 否 | CONVERSATION_DETAIL_VIEW |
| API-CNV-003 | GET | `/conversations/{id}/messages` | SCH-PATH-ID | SCH-CNV-MESSAGES-QUERY | - | SCH-CNV-MESSAGES-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND | PERM-CNV-VIEW | SELF/TEAM/ORG | 否 | 否 | CONVERSATION_MESSAGES_VIEW |
| API-CNV-004 | POST | `/conversations/{id}/messages` | SCH-PATH-ID | - | SCH-CNV-SEND-REQ | SCH-CNV-SEND-RESP | 201 | AUTH_FORBIDDEN, STATUS_TRANSITION_INVALID, DUPLICATE_REQUEST | PERM-CNV-SEND | SELF/TEAM/ORG | 是 | 是 | CONVERSATION_MESSAGE_SEND |
| API-CNV-005 | POST | `/conversations/{id}/accept` | SCH-PATH-ID | - | SCH-CNV-ACCEPT-REQ | SCH-CNV-DETAIL-RESP | 200 | AUTH_FORBIDDEN, STATUS_TRANSITION_INVALID | PERM-CNV-ACCEPT | SELF/TEAM/ORG | 否 | 是 | CONVERSATION_ACCEPT |
| API-CNV-006 | POST | `/conversations/{id}/transfer` | SCH-PATH-ID | - | SCH-CNV-TRANSFER-REQ | SCH-CNV-DETAIL-RESP | 200 | AUTH_FORBIDDEN, CNV_TRANSFER_TARGET_INVALID, STATUS_TRANSITION_INVALID | PERM-CNV-TRANSFER | TEAM/ORG | 否 | 是 | CONVERSATION_TRANSFER |
| API-CNV-007 | POST | `/conversations/{id}/close` | SCH-PATH-ID | - | SCH-CNV-CLOSE-REQ | SCH-CNV-DETAIL-RESP | 200 | AUTH_FORBIDDEN, STATUS_TRANSITION_INVALID | PERM-CNV-CLOSE | SELF/TEAM/ORG | 否 | 是 | CONVERSATION_CLOSE |
| API-CNV-008 | POST | `/conversations/{id}/tickets` | SCH-PATH-ID | - | SCH-CNV-CREATE-TICKET-REQ | SCH-TK-DETAIL-RESP | 201 | AUTH_FORBIDDEN, STATUS_TRANSITION_INVALID, DUPLICATE_REQUEST | PERM-CNV-CREATE_TICKET | SELF/TEAM/ORG | 是 | 是（跨模块） | CONVERSATION_CREATE_TICKET |
| API-TK-001 | GET | `/tickets` | - | SCH-TK-LIST-QUERY | - | SCH-TK-LIST-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-TK-VIEW | SELF/TEAM/ORG | 否 | 否 | TICKET_LIST_VIEW |
| API-TK-002 | POST | `/tickets` | - | - | SCH-TK-CREATE-REQ | SCH-TK-DETAIL-RESP | 201 | AUTH_FORBIDDEN, PARAM_INVALID, DUPLICATE_REQUEST | PERM-TK-CREATE | SELF/TEAM/ORG | 是 | 是 | TICKET_CREATE |
| API-TK-003 | GET | `/tickets/{id}` | SCH-PATH-ID | - | - | SCH-TK-DETAIL-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND | PERM-TK-VIEW | SELF/TEAM/ORG | 否 | 否 | TICKET_DETAIL_VIEW |
| API-TK-004 | POST | `/tickets/{id}/assign` | SCH-PATH-ID | - | SCH-TK-ASSIGN-REQ | SCH-TK-DETAIL-RESP | 200 | AUTH_FORBIDDEN, STATUS_TRANSITION_INVALID | PERM-TK-ASSIGN | TEAM/ORG | 否 | 是 | TICKET_ASSIGN |
| API-TK-005 | POST | `/tickets/{id}/start` | SCH-PATH-ID | - | SCH-TK-START-REQ | SCH-TK-DETAIL-RESP | 200 | AUTH_FORBIDDEN, STATUS_TRANSITION_INVALID | PERM-TK-START | SELF/TEAM/ORG | 否 | 是 | TICKET_START |
| API-TK-006 | POST | `/tickets/{id}/resolve` | SCH-PATH-ID | - | SCH-TK-RESOLVE-REQ | SCH-TK-DETAIL-RESP | 200 | AUTH_FORBIDDEN, STATUS_TRANSITION_INVALID, PARAM_INVALID | PERM-TK-RESOLVE | SELF/TEAM/ORG | 否 | 是 | TICKET_RESOLVE |
| API-TK-007 | POST | `/tickets/{id}/close` | SCH-PATH-ID | - | SCH-TK-CLOSE-REQ | SCH-TK-DETAIL-RESP | 200 | AUTH_FORBIDDEN, STATUS_TRANSITION_INVALID | PERM-TK-CLOSE | SELF/TEAM/ORG | 否 | 是 | TICKET_CLOSE |
| API-TSK-001 | GET | `/tasks` | - | SCH-TSK-LIST-QUERY | - | SCH-TSK-LIST-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-TSK-VIEW | SELF/TEAM/ORG | 否 | 否 | TASK_LIST_VIEW |
| API-TSK-002 | POST | `/tasks` | - | - | SCH-TSK-CREATE-REQ | SCH-TSK-DETAIL-RESP | 201 | AUTH_FORBIDDEN, PARAM_INVALID, DUPLICATE_REQUEST | PERM-TSK-CREATE | SELF/TEAM/ORG | 是 | 是 | TASK_CREATE |
| API-TSK-003 | PUT | `/tasks/{id}` | SCH-PATH-ID | - | SCH-TSK-UPDATE-REQ | SCH-TSK-DETAIL-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND, CONFLICT_VERSION | PERM-TSK-UPDATE | SELF/TEAM/ORG | 否 | 是 | TASK_UPDATE |
| API-TSK-004 | POST | `/tasks/{id}/status` | SCH-PATH-ID | - | SCH-TSK-STATUS-REQ | SCH-TSK-DETAIL-RESP | 200 | AUTH_FORBIDDEN, STATUS_TRANSITION_INVALID | PERM-TSK-STATUS | SELF/TEAM/ORG | 否 | 是 | TASK_STATUS_CHANGE |
| API-NTF-001 | GET | `/notifications` | - | SCH-NTF-LIST-QUERY | - | SCH-NTF-LIST-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-NTF-VIEW | SELF_SCOPE | 否 | 否 | NOTIFICATION_LIST_VIEW |
| API-NTF-002 | POST | `/notifications/{id}/read` | SCH-PATH-ID | - | SCH-NTF-READ-REQ | SCH-NTF-DETAIL-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND | PERM-NTF-READ | SELF_SCOPE | 否 | 是 | NOTIFICATION_READ |
| API-CHN-001 | GET | `/channels` | - | SCH-CHN-LIST-QUERY | - | SCH-CHN-LIST-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-CHN-VIEW | ORG_SCOPE | 否 | 否 | CHANNEL_LIST_VIEW |
| API-CHN-002 | POST | `/channels` | - | - | SCH-CHN-CREATE-REQ | SCH-CHN-DETAIL-RESP | 201 | AUTH_FORBIDDEN, PARAM_INVALID, DUPLICATE_REQUEST | PERM-CHN-MANAGE | ORG_SCOPE | 是 | 是 | CHANNEL_CREATE |
| API-CHN-003 | PUT | `/channels/{id}` | SCH-PATH-ID | - | SCH-CHN-UPDATE-REQ | SCH-CHN-DETAIL-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND, CONFLICT_VERSION | PERM-CHN-MANAGE | ORG_SCOPE | 否 | 是 | CHANNEL_UPDATE |
| API-AI-001 | POST | `/ai/smart-reply` | - | - | SCH-AI-SMART-REPLY-REQ | SCH-AI-TASK-RESP | 202 | AUTH_FORBIDDEN, AI_TASK_TIMEOUT, RATE_LIMITED, PARAM_INVALID | PERM-AI-EXECUTE | SELF/TEAM/ORG | 是 | 是 | AI_TASK_CREATE |
| API-AI-002 | GET | `/ai/tasks/{id}` | SCH-PATH-ID | - | - | SCH-AI-TASK-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND | PERM-AI-EXECUTE | SELF/TEAM/ORG | 否 | 否 | AI_TASK_VIEW |
| API-AUD-001 | GET | `/audit-logs` | - | SCH-AUD-LIST-QUERY | - | SCH-AUD-LIST-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-AUD-VIEW | ORG_SCOPE | 否 | 否 | AUDIT_LOG_VIEW |
| API-SYS-001 | GET | `/dashboard/summary` | - | SCH-SYS-DASHBOARD-QUERY | - | SCH-SYS-DASHBOARD-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-SYS-VIEW | ORG_SCOPE | 否 | 否 | DASHBOARD_SUMMARY_VIEW |
| API-SYS-002 | GET | `/system-configs` | - | SCH-SYS-CONFIG-LIST-QUERY | - | SCH-SYS-CONFIG-LIST-RESP | 200 | AUTH_FORBIDDEN, PARAM_INVALID | PERM-SYS-MANAGE | ORG_SCOPE | 否 | 否 | SYS_CONFIG_LIST_VIEW |
| API-SYS-003 | PUT | `/system-configs/{id}` | SCH-PATH-ID | - | SCH-SYS-CONFIG-UPDATE-REQ | SCH-SYS-CONFIG-DETAIL-RESP | 200 | AUTH_FORBIDDEN, RESOURCE_NOT_FOUND, CONFLICT_VERSION | PERM-SYS-MANAGE | ORG_SCOPE | 否 | 是 | SYS_CONFIG_UPDATE |

## 7. 幂等规则（落地）
- 幂等窗口：10 分钟（Redis 存储 `org_id + api_id + idempotency_key`）。
- 需要幂等键的接口：
  - `API-ORG-004`
  - `API-CM-002`
  - `API-LM-002`
  - `API-LM-004`
  - `API-LM-005`
  - `API-OM-002`
  - `API-CNV-004`
  - `API-CNV-008`
  - `API-TK-002`
  - `API-TSK-002`
  - `API-CHN-002`
  - `API-AI-001`
- `API-CNV-004` 额外使用 `client_msg_id` 做消息级幂等去重。

## 8. WebSocket 事件绑定（HTTP 写操作触发）
| API ID | 推送事件 |
| --- | --- |
| API-CNV-004 | `conversation.message.created` |
| API-CNV-005/API-CNV-006/API-CNV-007 | `conversation.status.changed` |
| API-CNV-008/API-TK-002 | `ticket.created` |
| API-TK-004/API-TK-005/API-TK-006/API-TK-007 | `ticket.status.changed` |
| API-NTF-001（后端创建通知时） | `notification.created` |
| API-AI-001/API-AI-002（状态变化时） | `ai.task.status.changed` |

## 9. 示例（关键链路）

### 9.1 API-LM-005 线索转化
Request:
```json
{
  "version": 3,
  "opportunity": {
    "name": "华东区域年度采购",
    "amount": 1200000,
    "currency": "CNY",
    "expected_close_date": "2026-05-30"
  }
}
```
Response:
```json
{
  "code": "OK",
  "message": "success",
  "request_id": "req_01",
  "data": {
    "lead_id": "6b7b7e3a-87f2-4603-9517-3f98d9f90cc1",
    "opportunity_id": "cbec6d64-5f8b-4c16-aafd-e6c2cb4e4871",
    "lead_status": "converted"
  }
}
```

### 9.2 API-OM-006 商机结果
Request:
```json
{
  "version": 5,
  "result": "won",
  "reason": "客户确认付款并签约"
}
```
Response:
```json
{
  "code": "OK",
  "message": "success",
  "request_id": "req_02",
  "data": {
    "id": "cbec6d64-5f8b-4c16-aafd-e6c2cb4e4871",
    "stage": "negotiation",
    "result": "won",
    "version": 6
  }
}
```

### 9.3 API-CNV-006 会话转接
Request:
```json
{
  "version": 2,
  "target_user_id": "2f7bce91-6423-4e99-9b8a-eaa3fef14f71",
  "reason": "需要英语支持"
}
```
Response:
```json
{
  "code": "OK",
  "message": "success",
  "request_id": "req_03",
  "data": {
    "id": "a18a3f1b-7dd4-4916-94a2-6276b00f55f6",
    "status": "active",
    "assignee_user_id": "2f7bce91-6423-4e99-9b8a-eaa3fef14f71",
    "version": 3
  }
}
```

## 10. 变更规则
- 任何 API 增删改都必须先更新：`06_PRD` -> `07_RTM` -> 本文档 -> `32_页面实现规范` -> `23_测试与验收方案`。
- 不允许在 P0 增加 P1/P2 接口。
- 若改动状态或权限，必须同步更新 `27_状态机实现规范` 与 `17_权限模型设计.md`。

## 11. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v4.0 | 2026-04-05 | 升级为实现级 API 契约：补齐 schema 引用、状态码、错误码、权限、数据范围、幂等、事务、审计、并发更新规则 |
| v3.0 | 2026-04-05 | API 契约重建：统一 ID、方法、路径、权限、状态枚举与参数写法 |
