# MOY 接口设计说明（API）

## 1. 文档元信息
| 属性 | 内容 |
| --- | --- |
| 文档编号 | MOY_API_001 |
| 文档版本 | v3.0 |
| 文档状态 | 已确认（冻结） |
| 日期 | 2026-04-05 |
| 上游输入 | `06_PRD`、`07_RTM`、`10_DBD`、`17_权限模型设计` |
| 下游约束 | 后端实现、前端联调、测试用例、验收用例 |

## 2. API 契约总规则（唯一）
- 路径参数统一为 `{id}`，禁止 `:id`。
- 接口 ID 规则：`API-{MOD}-{NNN}`。
- 认证方式：`Authorization: Bearer <token>`。
- 商机结果枚举只允许：`won`、`lost`。
- 知识问答术语统一使用 `qa`（P0 不启用）。

## 3. 统一响应格式

### 3.1 成功
```json
{
  "code": "OK",
  "message": "success",
  "request_id": "req_xxx",
  "data": {},
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 0
  }
}
```

### 3.2 失败
```json
{
  "code": "BIZ_ERROR",
  "message": "human readable message",
  "request_id": "req_xxx",
  "error": {
    "field": "status",
    "detail": "invalid transition"
  }
}
```

## 4. 状态枚举约束（接口层）
| 实体 | 字段 | 枚举 |
| --- | --- | --- |
| customer | `status` | `potential, active, silent, lost` |
| lead | `status` | `new, assigned, following, converted, invalid` |
| opportunity | `stage/result` | `discovery, qualification, proposal, negotiation, won, lost` |
| conversation | `status` | `queued, active, closed` |
| ticket | `status` | `pending, assigned, processing, resolved, closed` |
| task | `status` | `pending, in_progress, completed, cancelled` |
| ai_task | `status` | `pending, running, succeeded, failed, cancelled` |

## 5. 接口总览（P0）
| API ID | Method | Path | 权限 | 请求摘要 | 响应摘要 |
| --- | --- | --- | --- | --- | --- |
| API-AUTH-001 | POST | `/api/v1/auth/login` | - | username, password | access_token, refresh_token, user |
| API-AUTH-002 | POST | `/api/v1/auth/refresh` | - | refresh_token | access_token |
| API-AUTH-003 | GET | `/api/v1/auth/me` | - | - | current user profile |
| API-USR-001 | GET | `/api/v1/users` | PERM-USR-MANAGE | page, keyword | user list |
| API-USR-002 | PUT | `/api/v1/roles/{id}/permissions` | PERM-USR-MANAGE | permission_ids[] | role permission set |
| API-ORG-001 | PUT | `/api/v1/organizations/{id}` | PERM-ORG-MANAGE | name, config | organization profile |
| API-CM-001 | GET | `/api/v1/customers` | PERM-CM-VIEW | filters, pagination | customer list |
| API-CM-002 | POST | `/api/v1/customers` | PERM-CM-CREATE | name, owner_user_id | customer |
| API-CM-003 | GET | `/api/v1/customers/{id}` | PERM-CM-VIEW | - | customer detail |
| API-CM-004 | PUT | `/api/v1/customers/{id}` | PERM-CM-UPDATE | mutable fields | customer |
| API-CM-005 | POST | `/api/v1/customers/{id}/status` | PERM-CM-STATUS | status | customer |
| API-LM-001 | GET | `/api/v1/leads` | PERM-LM-VIEW | filters, pagination | lead list |
| API-LM-002 | POST | `/api/v1/leads` | PERM-LM-CREATE | lead payload | lead |
| API-LM-003 | POST | `/api/v1/leads/{id}/assign` | PERM-LM-ASSIGN | assignee_user_id | lead |
| API-LM-004 | POST | `/api/v1/leads/{id}/follow-ups` | PERM-LM-FOLLOW_UP | content, next_follow_time | follow-up record |
| API-LM-005 | POST | `/api/v1/leads/{id}/convert` | PERM-LM-CONVERT | opportunity payload | converted ids |
| API-OM-001 | GET | `/api/v1/opportunities` | PERM-OM-VIEW | filters, pagination | opportunity list |
| API-OM-002 | POST | `/api/v1/opportunities` | PERM-OM-CREATE | customer_id, name, amount | opportunity |
| API-OM-003 | GET | `/api/v1/opportunities/{id}` | PERM-OM-VIEW | - | opportunity detail |
| API-OM-004 | PUT | `/api/v1/opportunities/{id}` | PERM-OM-UPDATE | mutable fields | opportunity |
| API-OM-005 | POST | `/api/v1/opportunities/{id}/stage` | PERM-OM-STAGE | stage | opportunity |
| API-OM-006 | POST | `/api/v1/opportunities/{id}/result` | PERM-OM-RESULT | result=`won|lost`, reason | opportunity |
| API-CNV-001 | GET | `/api/v1/conversations` | PERM-CNV-VIEW | filters, pagination | conversation list |
| API-CNV-002 | GET | `/api/v1/conversations/{id}` | PERM-CNV-VIEW | - | conversation detail |
| API-CNV-003 | GET | `/api/v1/conversations/{id}/messages` | PERM-CNV-VIEW | cursor | message list |
| API-CNV-004 | POST | `/api/v1/conversations/{id}/messages` | PERM-CNV-SEND | content, content_type | message |
| API-CNV-005 | POST | `/api/v1/conversations/{id}/accept` | PERM-CNV-ACCEPT | - | conversation |
| API-CNV-006 | POST | `/api/v1/conversations/{id}/transfer` | PERM-CNV-TRANSFER | target_user_id | conversation |
| API-CNV-007 | POST | `/api/v1/conversations/{id}/close` | PERM-CNV-CLOSE | close_reason | conversation |
| API-CNV-008 | POST | `/api/v1/conversations/{id}/tickets` | PERM-CNV-CREATE_TICKET | title, priority | ticket |
| API-TK-001 | GET | `/api/v1/tickets` | PERM-TK-VIEW | filters, pagination | ticket list |
| API-TK-002 | POST | `/api/v1/tickets` | PERM-TK-CREATE | title, source_type, source_id | ticket |
| API-TK-003 | GET | `/api/v1/tickets/{id}` | PERM-TK-VIEW | - | ticket detail |
| API-TK-004 | POST | `/api/v1/tickets/{id}/assign` | PERM-TK-ASSIGN | assignee_user_id | ticket |
| API-TK-005 | POST | `/api/v1/tickets/{id}/start` | PERM-TK-START | - | ticket |
| API-TK-006 | POST | `/api/v1/tickets/{id}/resolve` | PERM-TK-RESOLVE | solution | ticket |
| API-TK-007 | POST | `/api/v1/tickets/{id}/close` | PERM-TK-CLOSE | close_reason | ticket |
| API-TSK-001 | GET | `/api/v1/tasks` | PERM-TSK-VIEW | filters, pagination | task list |
| API-TSK-002 | POST | `/api/v1/tasks` | PERM-TSK-CREATE | title, assignee_user_id, due_at | task |
| API-TSK-003 | PUT | `/api/v1/tasks/{id}` | PERM-TSK-UPDATE | mutable fields | task |
| API-TSK-004 | POST | `/api/v1/tasks/{id}/status` | PERM-TSK-STATUS | status | task |
| API-NTF-001 | GET | `/api/v1/notifications` | PERM-NTF-VIEW | pagination | notification list |
| API-NTF-002 | POST | `/api/v1/notifications/{id}/read` | PERM-NTF-READ | - | notification |
| API-CHN-001 | GET | `/api/v1/channels` | PERM-CHN-VIEW | pagination | channel list |
| API-CHN-002 | POST | `/api/v1/channels` | PERM-CHN-MANAGE | channel payload | channel |
| API-CHN-003 | PUT | `/api/v1/channels/{id}` | PERM-CHN-MANAGE | mutable fields | channel |
| API-AI-001 | POST | `/api/v1/ai/smart-reply` | PERM-AI-EXECUTE | conversation_id, message | ai_task |
| API-AI-002 | GET | `/api/v1/ai/tasks/{id}` | PERM-AI-EXECUTE | - | ai_task detail |
| API-AUD-001 | GET | `/api/v1/audit-logs` | PERM-AUD-VIEW | filters, pagination | audit log list |

## 6. 关键接口样例

### 6.1 API-OM-006 商机结果标记
**Request**
```json
{
  "result": "won",
  "reason": "customer signed contract"
}
```

**约束**
- `result` 仅允许 `won` 或 `lost`。
- 禁止传入 `win`、`lose`。

### 6.2 API-CM-005 客户状态更新
**Request**
```json
{
  "status": "silent"
}
```

**约束**
- `status` 必须符合 `SM-customer`。

### 6.3 API-CNV-006 会话转接
**Request**
```json
{
  "target_user_id": "usr_123"
}
```

**约束**
- 需具备 `PERM-CNV-TRANSFER`。
- 目标用户必须属于同租户。

## 7. 兼容与变更规则
- 不允许在 P0 中新增 P1/P2 接口。
- 新增接口必须先新增 REQ 与 RTM 映射，再进入 API 文档。
- 任何接口变更必须回写 PRD/RTM/页面映射。

## 8. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v3.0 | 2026-04-05 | API 契约重建：统一 ID、方法、路径、权限、状态枚举与参数写法 |
