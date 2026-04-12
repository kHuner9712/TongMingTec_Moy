# MOY 原子 API 与 Schema 展开

## 1. 文档定位
本文档是 [08_API契约与Schema字典.md](./08_API契约与Schema字典.md) 的实现级子文档。

约束：
- 仅本文中的原子 `API-ID` 与 `SCH-*` 可以作为 codegen / 前后端联调 / contract test 的最终实现输入。
- `08` 主文中的区间 API、资源族级 schema 仅保留为索引说明，不再构成实现输入。
- 模块级字段化 schema 字典见 [08B_原子Schema字段字典.md](./08B_原子Schema字段字典.md)。
- 所有条目都继承 `introduced_in / required_in / release_scope / status`；本文默认 `status=implementation-ready`。

记法：
- Schema 字段摘要：`字段:类型[长度]`，`!`=必填，`?`=可空，`=默认值`，`enum(...)`=枚举，`map(table.field)`=DB 映射。
- API 示例写法：`req={...}; resp={...}`。

## 2. 公共 Schema 原子字典
| Schema | introduced_in / required_in / release_scope / status | 字段摘要 |
| --- | --- | --- |
| `SCH-HEADER-AUTH` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `Authorization:string! Bearer token` |
| `SCH-HEADER-REQID` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `X-Request-Id:uuid!` |
| `SCH-HEADER-IDEMPOTENCY` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `Idempotency-Key:string[128]!` |
| `SCH-HEADER-PORTAL` | `S3 / S3 / S3,S4 / implementation-ready` | `X-Portal-Token:string!` |
| `SCH-PATH-ID` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `id:uuid!` |
| `SCH-PAGE-QUERY` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `page:int!=1; page_size:int!=20; sort_by:string?; sort_order:string? enum(asc|desc)` |
| `SCH-VERSION-BODY` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `version:int! >=1` |
| `SCH-LIST-META` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `page:int!; page_size:int!; total:int!; total_pages:int!; sort_by:string?; sort_order:string?; has_next:boolean!` |
| `SCH-ACK` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `code:string!=OK; message:string!=success; request_id:string!` |
| `SCH-ERROR` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `code:string!; message:string!; request_id:string!; details:object?` |

## 3. 原子 API 矩阵
| API-ID | 模块 | method | path | introduced_in / required_in / release_scope / status | request schema | response schema | success / failure / error codes | permission / data scope | tx / idempotency / concurrency | audit / websocket / example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `API-AUTH-001` | `AUTH` | `POST` | `/api/v1/auth/login` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-AUTH-LOGIN-REQ` | `SCH-AUTH-SESSION-RESP` | `200 / 400,401 / AUTH_UNAUTHORIZED,PARAM_INVALID` | `- / SELF` | `Y / required / -` | `AUTH_LOGIN / - / req={username,password}; resp={access_token,refresh_token}` |
| `API-AUTH-002` | `AUTH` | `POST` | `/api/v1/auth/refresh` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-AUTH-REFRESH-REQ` | `SCH-AUTH-SESSION-RESP` | `200 / 400,401 / AUTH_UNAUTHORIZED,PARAM_INVALID` | `- / SELF` | `Y / required / -` | `AUTH_REFRESH / - / req={refresh_token}; resp={access_token}` |
| `API-AUTH-003` | `AUTH` | `GET` | `/api/v1/auth/me` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-HEADER-AUTH` | `SCH-AUTH-ME-RESP` | `200 / 401 / AUTH_UNAUTHORIZED` | `- / SELF` | `N / n/a / -` | `AUTH_ME_VIEW / - / req=headers; resp={user,roles}` |
| `API-AUTH-004` | `AUTH` | `POST` | `/api/v1/auth/forgot-password` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-AUTH-FORGOT-REQ` | `SCH-ACK` | `200 / 400,404 / PARAM_INVALID,RESOURCE_NOT_FOUND` | `- / SELF` | `Y / required / -` | `AUTH_PASSWORD_RESET_REQUEST / - / req={username_or_email}; resp={code:OK}` |
| `API-AUTH-005` | `AUTH` | `POST` | `/api/v1/auth/change-password` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-AUTH-CHANGE-PASSWORD-REQ` | `SCH-ACK` | `200 / 400,401 / AUTH_UNAUTHORIZED,PARAM_INVALID` | `- / SELF` | `Y / optional / -` | `AUTH_PASSWORD_CHANGE / - / req={old_password,new_password}; resp={code:OK}` |
| `API-AUTH-006` | `AUTH` | `GET` | `/api/v1/auth/sessions` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-AUTH-SESSION-LIST-QUERY` | `SCH-AUTH-SESSION-LIST-RESP` | `200 / 401,403 / AUTH_UNAUTHORIZED,AUTH_FORBIDDEN` | `PERM-AUTH-SESSION / SELF,ORG` | `N / n/a / -` | `AUTH_SESSION_LIST / - / req=?page=1; resp={items,meta}` |
| `API-AUTH-007` | `AUTH` | `POST` | `/api/v1/auth/sessions/{id}/revoke` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-AUTH-SESSION-REVOKE-REQ` | `SCH-ACK` | `200 / 401,403,404 / AUTH_UNAUTHORIZED,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-AUTH-SESSION / SELF,ORG` | `Y / required / version` | `AUTH_SESSION_REVOKE / - / req={id,version}; resp={code:OK}` |
| `API-ORG-001` | `ORG` | `PUT` | `/api/v1/organizations/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-ORG-UPDATE-REQ` | `SCH-ORG-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-ORG-MANAGE / ORG` | `Y / optional / version` | `ORG_UPDATE / - / req={name,timezone,locale,version}; resp={id,name,status}` |
| `API-ORG-002` | `ORG` | `GET` | `/api/v1/organizations/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-ORG-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-ORG-MANAGE / ORG` | `N / n/a / -` | `ORG_VIEW / - / req={id}; resp={organization}` |
| `API-ORG-003` | `ORG` | `GET` | `/api/v1/departments` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-ORG-DEPARTMENT-LIST-QUERY` | `SCH-ORG-DEPARTMENT-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-ORG-MANAGE / ORG` | `N / n/a / -` | `DEPARTMENT_LIST / - / req=?keyword=客服; resp={items}` |
| `API-ORG-004` | `ORG` | `POST` | `/api/v1/departments` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-ORG-DEPARTMENT-CREATE-REQ` | `SCH-ORG-DEPARTMENT-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-ORG-MANAGE / ORG` | `Y / required / -` | `DEPARTMENT_CREATE / - / req={code,name,parent_id}; resp={id,code}` |
| `API-ORG-005` | `ORG` | `PUT` | `/api/v1/departments/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-ORG-DEPARTMENT-UPDATE-REQ` | `SCH-ORG-DEPARTMENT-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-ORG-MANAGE / ORG` | `Y / optional / version` | `DEPARTMENT_UPDATE / - / req={name,manager_user_id,version}; resp={id,name}` |
| `API-ORG-006` | `ORG` | `POST` | `/api/v1/organizations/{id}/bootstrap` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-ORG-BOOTSTRAP-REQ` | `SCH-ORG-BOOTSTRAP-RESP` | `202 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-ORG-MANAGE / ORG` | `Y / required / -` | `ORG_BOOTSTRAP / - / req={admin_user,seed_modules}; resp={batch_id}` |
| `API-ORG-007` | `ORG` | `POST` | `/api/v1/organizations/{id}/configs` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-ORG-CONFIG-BULK-REQ` | `SCH-ACK` | `200 / 400,403 / PARAM_INVALID,AUTH_FORBIDDEN` | `PERM-ORG-MANAGE,PERM-SYS-MANAGE / ORG` | `Y / required / version` | `ORG_CONFIG_BULK_UPSERT / - / req={configs[],version}; resp={code:OK}` |
| `API-USR-001` | `USR` | `GET` | `/api/v1/users` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-USR-LIST-QUERY` | `SCH-USR-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-USR-MANAGE / ORG` | `N / n/a / -` | `USER_LIST / - / req=?status=active; resp={items}` |
| `API-USR-002` | `USR` | `POST` | `/api/v1/users` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-USR-CREATE-REQ` | `SCH-USR-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-USR-MANAGE / ORG` | `Y / required / -` | `USER_CREATE / - / req={username,display_name,...}; resp={id,status}` |
| `API-USR-003` | `USR` | `POST` | `/api/v1/users/{id}/status` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-USR-STATUS-ACTION-REQ` | `SCH-USR-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-USR-MANAGE / ORG` | `Y / optional / version` | `USER_STATUS_CHANGE / - / req={status,version}; resp={id,status}` |
| `API-USR-004` | `USR` | `GET` | `/api/v1/roles` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-USR-ROLE-LIST-QUERY` | `SCH-USR-ROLE-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-USR-MANAGE / ORG` | `N / n/a / -` | `ROLE_LIST / - / req=?keyword=销售; resp={items}` |
| `API-USR-005` | `USR` | `GET` | `/api/v1/permissions` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-USR-PERMISSION-LIST-QUERY` | `SCH-USR-PERMISSION-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-USR-MANAGE / ORG` | `N / n/a / -` | `PERMISSION_LIST / - / req=?module=CNV; resp={items}` |
| `API-USR-006` | `USR` | `POST` | `/api/v1/users/{id}/reset-password` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-USR-RESET-PASSWORD-REQ` | `SCH-ACK` | `200 / 400,403,404 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-USR-MANAGE / ORG` | `Y / required / -` | `USER_RESET_PASSWORD / - / req={id,temp_password}; resp={code:OK}` |
| `API-USR-007` | `USR` | `POST` | `/api/v1/permissions/resolve` | `S4 / S4 / S4 / implementation-ready` | `SCH-USR-PERMISSION-RESOLVE-REQ` | `SCH-USR-PERMISSION-RESOLVE-RESP` | `200 / 400,403 / PARAM_INVALID,AUTH_FORBIDDEN` | `PERM-USR-MANAGE / ORG` | `Y / optional / -` | `PERMISSION_RESOLVE / - / req={resource_type,field_name}; resp={effective_scope}` |
| `API-USR-008` | `USR` | `POST` | `/api/v1/permissions/rollback` | `S4 / S4 / S4 / implementation-ready` | `SCH-USR-PERMISSION-ROLLBACK-REQ` | `SCH-ACK` | `200 / 400,403,404 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-USR-MANAGE / ORG` | `Y / required / version` | `PERMISSION_ROLLBACK / - / req={change_log_id,version}; resp={code:OK}` |
| `API-USR-009` | `USR` | `GET` | `/api/v1/users/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-USR-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-USR-MANAGE / ORG` | `N / n/a / -` | `USER_DETAIL / - / req={id}; resp={id,username,status}` |
| `API-USR-010` | `USR` | `PUT` | `/api/v1/users/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-USR-UPDATE-REQ` | `SCH-USR-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-USR-MANAGE / ORG` | `Y / optional / version` | `USER_UPDATE / - / req={display_name,department_id,version}; resp={id,display_name}` |
| `API-USR-011` | `USR` | `PUT` | `/api/v1/roles/{id}/permissions` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-USR-ROLE-PERMISSION-UPDATE-REQ` | `SCH-USR-ROLE-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-USR-MANAGE / ORG` | `Y / optional / version` | `ROLE_PERMISSION_UPDATE / - / req={permission_ids,scope_override,version}; resp={id,permission_ids}` |
| `API-CM-001` | `CM` | `GET` | `/api/v1/customers` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-CM-LIST-QUERY` | `SCH-CM-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-CM-VIEW / SELF,TEAM,ORG` | `N / n/a / -` | `CUSTOMER_LIST / - / req=?keyword=Acme; resp={items,meta}` |
| `API-CM-002` | `CM` | `POST` | `/api/v1/customers` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-CM-CREATE-REQ` | `SCH-CM-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-CM-CREATE / ORG` | `Y / required / -` | `CUSTOMER_CREATE / - / req={name,owner_user_id}; resp={id,status}` |
| `API-CM-003` | `CM` | `GET` | `/api/v1/customers/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-CM-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-CM-VIEW / SELF,TEAM,ORG` | `N / n/a / -` | `CUSTOMER_DETAIL / - / req={id}; resp={customer,contacts}` |
| `API-CM-004` | `CM` | `PUT` | `/api/v1/customers/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-CM-UPDATE-REQ` | `SCH-CM-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-CM-UPDATE / SELF,TEAM,ORG` | `Y / optional / version` | `CUSTOMER_UPDATE / - / req={industry,level,version}; resp={id,updated_at}` |
| `API-CM-005` | `CM` | `POST` | `/api/v1/customers/{id}/status` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-CM-STATUS-ACTION-REQ` | `SCH-CM-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-CM-STATUS / SELF,TEAM,ORG` | `Y / optional / version` | `CUSTOMER_STATUS_CHANGE / - / req={status,reason,version}; resp={id,status}` |
| `API-CM-006` | `CM` | `POST` | `/api/v1/customers/{id}/tags` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-CM-TAG-BIND-REQ` | `SCH-ACK` | `200 / 400,403,404 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-CM-TAG / ORG` | `Y / required / version` | `CUSTOMER_TAG_BIND / - / req={tag_ids,version}; resp={code:OK}` |
| `API-CM-007` | `CM` | `POST` | `/api/v1/customer-groups` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-CM-GROUP-CREATE-REQ` | `SCH-CM-GROUP-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-CM-GROUP / ORG` | `Y / required / -` | `CUSTOMER_GROUP_CREATE / - / req={code,name,rule_json}; resp={id}` |
| `API-CM-008` | `CM` | `POST` | `/api/v1/customers/{id}/merge` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-CM-MERGE-REQ` | `SCH-ACK` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-CM-MERGE / ORG` | `Y / required / version` | `CUSTOMER_MERGE / - / req={target_customer_id,version}; resp={code:OK}` |
| `API-CM-009` | `CM` | `POST` | `/api/v1/customers/export` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-CM-EXPORT-REQ` | `SCH-CM-EXPORT-JOB-RESP` | `202 / 400,403 / PARAM_INVALID,AUTH_FORBIDDEN` | `PERM-CM-EXPORT / ORG` | `Y / required / -` | `CUSTOMER_EXPORT / - / req={filters,columns}; resp={job_id}` |
| `API-LM-001` | `LM` | `GET` | `/api/v1/leads` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-LM-LIST-QUERY` | `SCH-LM-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-LM-CREATE / SELF,TEAM,ORG` | `N / n/a / -` | `LEAD_LIST / - / req=?source=web; resp={items}` |
| `API-LM-002` | `LM` | `POST` | `/api/v1/leads` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-LM-CREATE-REQ` | `SCH-LM-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-LM-CREATE / ORG` | `Y / required / -` | `LEAD_CREATE / - / req={name,source}; resp={id,status}` |
| `API-LM-003` | `LM` | `POST` | `/api/v1/leads/{id}/assign` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-LM-ASSIGN-REQ` | `SCH-LM-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-LM-ASSIGN / TEAM,ORG` | `Y / optional / version` | `LEAD_ASSIGN / - / req={owner_user_id,version}; resp={id,owner_user_id}` |
| `API-LM-004` | `LM` | `POST` | `/api/v1/leads/{id}/follow-ups` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-LM-FOLLOW-UP-CREATE-REQ` | `SCH-LM-FOLLOW-UP-RESP` | `201 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-LM-FOLLOW_UP / SELF,TEAM,ORG` | `Y / required / version` | `LEAD_FOLLOW_UP / - / req={content,next_action_at,version}; resp={id,created_at}` |
| `API-LM-005` | `LM` | `POST` | `/api/v1/leads/{id}/convert` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-LM-CONVERT-REQ` | `SCH-LM-CONVERT-RESP` | `201 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-LM-CONVERT / SELF,TEAM,ORG` | `Y / required / version` | `LEAD_CONVERT / - / req={customer_payload,opportunity_payload,version}; resp={lead_id,customer_id,opportunity_id}` |
| `API-LM-006` | `LM` | `GET` | `/api/v1/leads/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-LM-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-LM-CREATE / SELF,TEAM,ORG` | `N / n/a / -` | `LEAD_DETAIL / - / req={id}; resp={lead,follow_ups}` |
| `API-LM-007` | `LM` | `POST` | `/api/v1/leads/import` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-LM-IMPORT-REQ` | `SCH-LM-IMPORT-JOB-RESP` | `202 / 400,403 / PARAM_INVALID,AUTH_FORBIDDEN` | `PERM-LM-IMPORT / ORG` | `Y / required / -` | `LEAD_IMPORT / - / req={file_url,mapping}; resp={job_id}` |
| `API-LM-008` | `LM` | `POST` | `/api/v1/leads/{id}/score` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-LM-SCORE-REQ` | `SCH-LM-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-LM-SCORE / ORG` | `Y / optional / version` | `LEAD_SCORE / - / req={score,score_reason,version}; resp={id,score}` |
| `API-LM-009` | `LM` | `POST` | `/api/v1/leads/{id}/recycle` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-LM-RECYCLE-REQ` | `SCH-LM-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-LM-RECYCLE / ORG` | `Y / optional / version` | `LEAD_RECYCLE / - / req={reason,version}; resp={id,status}` |
| `API-OM-001` | `OM` | `GET` | `/api/v1/opportunities` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-OM-LIST-QUERY` | `SCH-OM-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-OM-VIEW / SELF,TEAM,ORG` | `N / n/a / -` | `OPPORTUNITY_LIST / opportunity.stage.changed / req=?stage=proposal; resp={items}` |
| `API-OM-002` | `OM` | `POST` | `/api/v1/opportunities` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-OM-CREATE-REQ` | `SCH-OM-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-OM-CREATE / ORG` | `Y / required / -` | `OPPORTUNITY_CREATE / opportunity.stage.changed / req={customer_id,name,amount}; resp={id,stage}` |
| `API-OM-003` | `OM` | `GET` | `/api/v1/opportunities/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-OM-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-OM-VIEW / SELF,TEAM,ORG` | `N / n/a / -` | `OPPORTUNITY_DETAIL / - / req={id}; resp={opportunity,stage_history}` |
| `API-OM-004` | `OM` | `PUT` | `/api/v1/opportunities/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-OM-UPDATE-REQ` | `SCH-OM-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-OM-UPDATE / SELF,TEAM,ORG` | `Y / optional / version` | `OPPORTUNITY_UPDATE / - / req={amount,expected_close_date,version}; resp={id}` |
| `API-OM-005` | `OM` | `POST` | `/api/v1/opportunities/{id}/stage` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-OM-STAGE-ACTION-REQ` | `SCH-OM-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-OM-STAGE / SELF,TEAM,ORG` | `Y / required / version` | `OPPORTUNITY_STAGE_CHANGE / opportunity.stage.changed / req={to_stage,reason,version}; resp={stage}` |
| `API-OM-006` | `OM` | `POST` | `/api/v1/opportunities/{id}/result` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-OM-RESULT-ACTION-REQ` | `SCH-OM-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-OM-RESULT / SELF,TEAM,ORG` | `Y / required / version` | `OPPORTUNITY_RESULT_CHANGE / opportunity.result.changed / req={result,reason,version}; resp={result}` |
| `API-OM-007` | `OM` | `GET` | `/api/v1/opportunities/{id}/forecast` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-OM-FORECAST-QUERY` | `SCH-OM-FORECAST-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-OM-FORECAST / SELF,TEAM,ORG` | `N / n/a / -` | `OPPORTUNITY_FORECAST / - / req={id}; resp={win_rate,drivers}` |
| `API-OM-008` | `OM` | `POST` | `/api/v1/opportunities/{id}/pause` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-OM-PAUSE-REQ` | `SCH-OM-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-OM-UPDATE / SELF,TEAM,ORG` | `Y / required / version` | `OPPORTUNITY_PAUSE / opportunity.stage.changed / req={pause_reason,version}; resp={stage}` |
| `API-OM-009` | `OM` | `POST` | `/api/v1/opportunities/{id}/quotes` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-OM-CREATE-QUOTE-REQ` | `SCH-OM-CREATE-QUOTE-RESP` | `201 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-OM-UPDATE,PERM-QT-MANAGE / SELF,TEAM,ORG` | `Y / required / version` | `OPPORTUNITY_CREATE_QUOTE / quote.status.changed / req={template_id,version}; resp={quote_id}` |
| `API-CNV-001` | `CNV` | `GET` | `/api/v1/conversations` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-CNV-LIST-QUERY` | `SCH-CNV-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-CNV-VIEW / SELF,TEAM,ORG` | `N / n/a / -` | `CONVERSATION_LIST / conversation.message.created,conversation.status.changed / req=?status=queued; resp={items}` |
| `API-CNV-002` | `CNV` | `GET` | `/api/v1/conversations/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-CNV-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-CNV-VIEW / SELF,TEAM,ORG` | `N / n/a / -` | `CONVERSATION_DETAIL / - / req={id}; resp={conversation,customer,ticket}` |
| `API-CNV-003` | `CNV` | `GET` | `/api/v1/conversations/{id}/messages` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-CNV-MESSAGE-LIST-QUERY` | `SCH-CNV-MESSAGE-LIST-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-CNV-VIEW / SELF,TEAM,ORG` | `N / n/a / -` | `CONVERSATION_MESSAGE_LIST / conversation.message.created / req={id,page}; resp={items}` |
| `API-CNV-004` | `CNV` | `POST` | `/api/v1/conversations/{id}/messages` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-CNV-SEND-REQ` | `SCH-CNV-MESSAGE-RESP` | `201 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-CNV-SEND / SELF,TEAM,ORG` | `Y / required / version` | `MESSAGE_SEND / conversation.message.created / req={message_type,content,version}; resp={message_id}` |
| `API-CNV-005` | `CNV` | `POST` | `/api/v1/conversations/{id}/accept` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-CNV-ACCEPT-REQ` | `SCH-CNV-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-CNV-ACCEPT / TEAM,ORG` | `Y / optional / version` | `CONVERSATION_ACCEPT / conversation.status.changed / req={assignee_user_id,version}; resp={id,status}` |
| `API-CNV-006` | `CNV` | `POST` | `/api/v1/conversations/{id}/transfer` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-CNV-TRANSFER-REQ` | `SCH-CNV-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-CNV-TRANSFER / TEAM,ORG` | `Y / optional / version` | `CONVERSATION_TRANSFER / conversation.status.changed / req={target_user_id,reason,version}; resp={id,assignee_user_id}` |
| `API-CNV-007` | `CNV` | `POST` | `/api/v1/conversations/{id}/close` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-CNV-CLOSE-REQ` | `SCH-CNV-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-CNV-CLOSE / SELF,TEAM,ORG` | `Y / optional / version` | `CONVERSATION_CLOSE / conversation.status.changed / req={close_reason,version}; resp={id,status}` |
| `API-CNV-008` | `CNV` | `POST` | `/api/v1/conversations/{id}/tickets` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-CNV-CREATE-TICKET-REQ` | `SCH-TK-DETAIL-RESP` | `201 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-CNV-CREATE_TICKET / SELF,TEAM,ORG` | `Y / required / version` | `CONVERSATION_CREATE_TICKET / ticket.created / req={title,priority,version}; resp={ticket_id}` |
| `API-CNV-009` | `CNV` | `GET` | `/api/v1/conversations/monitor` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-CNV-MONITOR-QUERY` | `SCH-CNV-MONITOR-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-CNV-MONITOR / TEAM,ORG` | `N / n/a / -` | `CONVERSATION_MONITOR / conversation.message.created,conversation.status.changed / req=?waiting_gt=60; resp={items}` |
| `API-CNV-010` | `CNV` | `POST` | `/api/v1/conversations/{id}/rating` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-CNV-RATING-REQ` | `SCH-CNV-RATING-RESP` | `201 / 400,403,404 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-CNV-RATE / SELF,TEAM,ORG` | `Y / required / -` | `CONVERSATION_RATE / - / req={score,comment}; resp={score}` |
| `API-TK-001` | `TK` | `GET` | `/api/v1/tickets` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-TK-LIST-QUERY` | `SCH-TK-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-TK-VIEW / SELF,TEAM,ORG` | `N / n/a / -` | `TICKET_LIST / ticket.created,ticket.status.changed / req=?status=pending; resp={items}` |
| `API-TK-002` | `TK` | `POST` | `/api/v1/tickets` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-TK-CREATE-REQ` | `SCH-TK-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-TK-CREATE / ORG` | `Y / required / -` | `TICKET_CREATE / ticket.created / req={title,priority}; resp={id,status}` |
| `API-TK-003` | `TK` | `GET` | `/api/v1/tickets/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-TK-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-TK-VIEW / SELF,TEAM,ORG` | `N / n/a / -` | `TICKET_DETAIL / - / req={id}; resp={ticket,logs}` |
| `API-TK-004` | `TK` | `POST` | `/api/v1/tickets/{id}/assign` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-TK-ASSIGN-REQ` | `SCH-TK-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-TK-ASSIGN / TEAM,ORG` | `Y / optional / version` | `TICKET_ASSIGN / ticket.status.changed / req={assignee_user_id,version}; resp={id,assignee_user_id}` |
| `API-TK-005` | `TK` | `POST` | `/api/v1/tickets/{id}/start` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-TK-START-REQ` | `SCH-TK-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-TK-START / SELF,TEAM,ORG` | `Y / optional / version` | `TICKET_START / ticket.status.changed / req={version}; resp={id,status}` |
| `API-TK-006` | `TK` | `POST` | `/api/v1/tickets/{id}/resolve` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-TK-RESOLVE-REQ` | `SCH-TK-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-TK-RESOLVE / SELF,TEAM,ORG` | `Y / optional / version` | `TICKET_RESOLVE / ticket.status.changed / req={solution,version}; resp={id,status}` |
| `API-TK-007` | `TK` | `POST` | `/api/v1/tickets/{id}/close` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-TK-CLOSE-REQ` | `SCH-TK-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-TK-CLOSE / SELF,TEAM,ORG` | `Y / optional / version` | `TICKET_CLOSE / ticket.status.changed / req={close_reason,version}; resp={id,status}` |
| `API-TK-008` | `TK` | `PUT` | `/api/v1/sla-configs/{id}` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-TK-SLA-UPDATE-REQ` | `SCH-TK-SLA-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-TK-SLA / ORG` | `Y / optional / version` | `SLA_CONFIG_UPDATE / - / req={response_minutes,resolve_minutes,version}; resp={id}` |
| `API-TK-009` | `TK` | `GET` | `/api/v1/tickets/metrics` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-TK-METRIC-QUERY` | `SCH-TK-METRIC-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-TK-ESCALATE / TEAM,ORG` | `N / n/a / -` | `TICKET_METRICS / ticket.status.changed / req=?date_range=this_month; resp={kpis}` |
| `API-TSK-001` | `TSK` | `GET` | `/api/v1/tasks` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-TSK-LIST-QUERY` | `SCH-TSK-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-TSK-CREATE / SELF,TEAM,ORG` | `N / n/a / -` | `TASK_LIST / notification.created / req=?assignee=me; resp={items}` |
| `API-TSK-002` | `TSK` | `POST` | `/api/v1/tasks` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-TSK-CREATE-REQ` | `SCH-TSK-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-TSK-CREATE / ORG` | `Y / required / -` | `TASK_CREATE / notification.created / req={title,assignee_user_id}; resp={id,status}` |
| `API-TSK-003` | `TSK` | `PUT` | `/api/v1/tasks/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-TSK-UPDATE-REQ` | `SCH-TSK-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-TSK-UPDATE / SELF,TEAM,ORG` | `Y / optional / version` | `TASK_UPDATE / - / req={description,due_at,version}; resp={id}` |
| `API-TSK-004` | `TSK` | `POST` | `/api/v1/tasks/{id}/status` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-TSK-STATUS-ACTION-REQ` | `SCH-TSK-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-TSK-STATUS / SELF,TEAM,ORG` | `Y / optional / version` | `TASK_STATUS_CHANGE / notification.created / req={status,version}; resp={id,status}` |
| `API-TSK-005` | `TSK` | `POST` | `/api/v1/tasks/{id}/remind` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-TSK-REMIND-REQ` | `SCH-ACK` | `200 / 400,403,404 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-TSK-UPDATE / SELF,TEAM,ORG` | `Y / required / -` | `TASK_REMIND / notification.created / req={message}; resp={code:OK}` |
| `API-NTF-001` | `NTF` | `GET` | `/api/v1/notifications` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-NTF-LIST-QUERY` | `SCH-NTF-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-NTF-VIEW / SELF` | `N / n/a / -` | `NOTIFICATION_LIST / notification.created / req=?is_read=false; resp={items}` |
| `API-NTF-002` | `NTF` | `POST` | `/api/v1/notifications/{id}/read` | `S1 / S2 / S1,S2,S3,S4 / implementation-ready` | `SCH-NTF-READ-REQ` | `SCH-ACK` | `200 / 400,403,404 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-NTF-READ / SELF` | `Y / optional / -` | `NOTIFICATION_READ / - / req={id}; resp={code:OK}` |
| `API-NTF-003` | `NTF` | `PUT` | `/api/v1/notification-preferences` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-NTF-PREFERENCE-UPDATE-REQ` | `SCH-ACK` | `200 / 400,403 / PARAM_INVALID,AUTH_FORBIDDEN` | `PERM-NTF-READ / SELF` | `Y / optional / version` | `NOTIFICATION_PREFERENCE_UPDATE / - / req={channels,version}; resp={code:OK}` |
| `API-KB-001` | `KB` | `GET` | `/api/v1/knowledge/items` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-KB-LIST-QUERY` | `SCH-KB-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-KB-READ / ORG,PORTAL` | `N / n/a / -` | `KNOWLEDGE_LIST / - / req=?keyword=退款; resp={items}` |
| `API-KB-002` | `KB` | `GET` | `/api/v1/knowledge/items/{id}` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-KB-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-KB-READ / ORG,PORTAL` | `N / n/a / -` | `KNOWLEDGE_DETAIL / - / req={id}; resp={id,title,content_md}` |
| `API-KB-003` | `KB` | `POST` | `/api/v1/knowledge/items` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-KB-CREATE-REQ` | `SCH-KB-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-KB-MANAGE / ORG` | `Y / required / -` | `KNOWLEDGE_CREATE / - / req={title,content_md}; resp={id,status}` |
| `API-KB-004` | `KB` | `PUT` | `/api/v1/knowledge/items/{id}` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-KB-UPDATE-REQ` | `SCH-KB-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-KB-MANAGE / ORG` | `Y / optional / version` | `KNOWLEDGE_UPDATE / - / req={content_md,status,version}; resp={id}` |
| `API-KB-005` | `KB` | `POST` | `/api/v1/knowledge/items/{id}/review` | `S2 / S3 / S2,S3,S4 / implementation-ready` | `SCH-KB-REVIEW-REQ` | `SCH-KB-REVIEW-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-KB-AUDIT / ORG` | `Y / required / version` | `KNOWLEDGE_REVIEW / - / req={decision,comment,version}; resp={status}` |
| `API-KB-006` | `KB` | `POST` | `/api/v1/knowledge/ask` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-KB-ASK-REQ` | `SCH-KB-ASK-RESP` | `202 / 400,403,429 / PARAM_INVALID,AUTH_FORBIDDEN,AI_TASK_TIMEOUT,RATE_LIMITED` | `PERM-KB-READ,PERM-AI-EXECUTE / ORG,PORTAL` | `Y / required / -` | `KNOWLEDGE_ASK / ai.task.status.changed / req={question,context_ids}; resp={task_id}` |
| `API-AI-001` | `AI` | `POST` | `/api/v1/ai/smart-reply` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-AI-SMART-REPLY-REQ` | `SCH-AI-TASK-RESP` | `202 / 400,403,429 / PARAM_INVALID,AUTH_FORBIDDEN,AI_TASK_TIMEOUT,RATE_LIMITED` | `PERM-AI-EXECUTE / SELF,TEAM,ORG` | `Y / required / -` | `AI_SMART_REPLY / ai.task.status.changed / req={conversation_id,prompt}; resp={task_id}` |
| `API-AI-002` | `AI` | `GET` | `/api/v1/ai/tasks/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-AI-TASK-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-AI-EXECUTE / SELF,TEAM,ORG` | `N / n/a / -` | `AI_TASK_DETAIL / ai.task.status.changed / req={id}; resp={status,output_payload}` |
| `API-AI-003` | `AI` | `GET` | `/api/v1/ai/agents` | `S2 / S2 / S2,S3,S4 / implemented` | `SCH-AI-AGENT-LIST-QUERY` | `SCH-AI-AGENT-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-AI-AGENT_MANAGE / ORG` | `N / n/a / -` | `AI_AGENT_LIST / - / req=?status=active; resp={items}` |
| `API-AI-004` | `AI` | `POST` | `/api/v1/ai/agents/{id}/run` | `S2 / S4 / S2,S3,S4 / implementation-ready` | `SCH-AI-AGENT-RUN-REQ` | `SCH-AI-AGENT-RUN-RESP` | `202 / 400,403,404,429 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,RATE_LIMITED` | `PERM-AI-AGENT_MANAGE / ORG` | `Y / required / version` | `AI_AGENT_RUN / ai.task.status.changed / req={task_type,input,version}; resp={run_id}` |
| `API-AI-005` | `AI` | `GET` | `/api/v1/ai/approval-requests` | `S2 / S2 / S2,S3,S4 / implemented` | `SCH-AI-APPROVAL-LIST-QUERY` | `SCH-AI-APPROVAL-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-AI-APPROVE / ORG` | `N / n/a / -` | `AI_APPROVAL_LIST / - / req=?status=pending; resp={items}` |
| `API-AI-006` | `AI` | `POST` | `/api/v1/ai/approval-requests/{id}/decision` | `S2 / S2 / S2,S3,S4 / implemented` | `SCH-AI-APPROVAL-DECISION-REQ` | `SCH-AI-APPROVAL-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-AI-APPROVE / ORG` | `Y / required / version` | `AI_APPROVAL_DECIDE / approval.status_changed / req={decision,comment,version}; resp={status}` |
| `API-AI-007` | `AI` | `GET` | `/api/v1/ai/quality-rules` | `S2 / S3 / S2,S3,S4 / implementation-ready` | `SCH-AI-QUALITY-RULE-LIST-QUERY` | `SCH-AI-QUALITY-RULE-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-AI-QUALITY / ORG` | `N / n/a / -` | `AI_QUALITY_RULE_LIST / - / req=?resource_type=conversation; resp={items}` |
| `API-AI-008` | `AI` | `GET` | `/api/v1/ai/quality-reports` | `S2 / S3 / S2,S3,S4 / implementation-ready` | `SCH-AI-QUALITY-REPORT-QUERY` | `SCH-AI-QUALITY-REPORT-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-AI-QUALITY / ORG` | `N / n/a / -` | `AI_QUALITY_REPORT_LIST / - / req=?date_range=this_week; resp={items}` |
| `API-AI-009` | `AI` | `POST` | `/api/v1/ai/rollbacks` | `S2 / S4 / S2,S3,S4 / implementation-ready` | `SCH-AI-ROLLBACK-REQ` | `SCH-ACK` | `202 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-AI-ROLLBACK / ORG` | `Y / required / version` | `AI_ROLLBACK / ai.task.status.changed / req={run_id,reason,version}; resp={code:OK}` |
| `API-AI-010` | `AI` | `POST` | `/api/v1/ai/takeovers` | `S2 / S4 / S2,S3,S4 / implementation-ready` | `SCH-AI-TAKEOVER-REQ` | `SCH-ACK` | `202 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-AI-TAKEOVER / ORG` | `Y / required / version` | `AI_TAKEOVER / ai.task.status.changed / req={run_id,operator_note,version}; resp={code:OK}` |
| `API-AI-011` | `AI` | `PATCH` | `/api/v1/ai/agents/{id}/status` | `S2 / S2 / S2,S3,S4 / implemented` | `SCH-AI-AGENT-STATUS-ACTION-REQ` | `SCH-AI-AGENT-LIST-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-AI-AGENT_MANAGE / ORG` | `Y / required / version` | `AI_AGENT_STATUS_CHANGE / agent.status_changed / req={action:enum(activate|pause|archive),version}; resp={agent}` |
| `API-AI-012` | `AI` | `POST` | `/api/v1/ai/approval-requests/{id}/cancel` | `S2 / S2 / S2,S3,S4 / implemented` | `SCH-AI-APPROVAL-CANCEL-REQ` | `SCH-AI-APPROVAL-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-AI-APPROVE / ORG` | `Y / required / version` | `AI_APPROVAL_CANCEL / approval.status_changed / req={version}; resp={status}` |
| `API-CHN-001` | `CHN` | `GET` | `/api/v1/channels` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-CHN-LIST-QUERY` | `SCH-CHN-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-CHN-VIEW / ORG` | `N / n/a / -` | `CHANNEL_LIST / - / req=?channel_type=wechat; resp={items}` |
| `API-CHN-002` | `CHN` | `POST` | `/api/v1/channels` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-CHN-CREATE-REQ` | `SCH-CHN-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-CHN-MANAGE / ORG` | `Y / required / -` | `CHANNEL_CREATE / - / req={code,channel_type,config_json}; resp={id}` |
| `API-CHN-003` | `CHN` | `PUT` | `/api/v1/channels/{id}` | `S1 / S1 / S1,S2,S3,S4 / implementation-ready` | `SCH-CHN-UPDATE-REQ` | `SCH-CHN-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-CHN-MANAGE / ORG` | `Y / optional / version` | `CHANNEL_UPDATE / - / req={config_json,status,version}; resp={id,status}` |
| `API-CHN-004` | `CHN` | `POST` | `/api/v1/channels/extended` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-CHN-EXTENDED-CREATE-REQ` | `SCH-CHN-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-CHN-MANAGE / ORG` | `Y / required / -` | `CHANNEL_EXTENDED_CREATE / - / req={provider,channel_type}; resp={id}` |
| `API-CHN-005` | `CHN` | `POST` | `/api/v1/channels/{id}/verify` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-CHN-VERIFY-REQ` | `SCH-CHN-VERIFY-RESP` | `200 / 400,403,404 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-CHN-MANAGE / ORG` | `Y / required / version` | `CHANNEL_VERIFY / - / req={version}; resp={verified_at,status}` |
| `API-CHN-006` | `CHN` | `POST` | `/api/v1/routing-rules` | `S3 / S4 / S3,S4 / implementation-ready` | `SCH-CHN-ROUTING-CREATE-REQ` | `SCH-CHN-ROUTING-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-CHN-ROUTE / ORG` | `Y / required / -` | `ROUTING_RULE_CREATE / - / req={channel_id,target_type,target_id}; resp={id}` |
| `API-AUTO-001` | `AUTO` | `GET` | `/api/v1/campaigns` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-AUTO-CAMPAIGN-LIST-QUERY` | `SCH-AUTO-CAMPAIGN-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-AUTO-MANAGE / ORG` | `N / n/a / -` | `CAMPAIGN_LIST / - / req=?status=active; resp={items}` |
| `API-AUTO-002` | `AUTO` | `POST` | `/api/v1/campaigns` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-AUTO-CAMPAIGN-CREATE-REQ` | `SCH-AUTO-CAMPAIGN-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-AUTO-MANAGE / ORG` | `Y / required / -` | `CAMPAIGN_CREATE / - / req={code,name,objective}; resp={id}` |
| `API-AUTO-003` | `AUTO` | `GET` | `/api/v1/automation-flows` | `S2 / S3 / S2,S3,S4 / implementation-ready` | `SCH-AUTO-FLOW-LIST-QUERY` | `SCH-AUTO-FLOW-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-AUTO-MANAGE / ORG` | `N / n/a / -` | `AUTOMATION_FLOW_LIST / - / req=?trigger_type=event; resp={items}` |
| `API-AUTO-004` | `AUTO` | `POST` | `/api/v1/automation-flows/{id}/execute` | `S2 / S3 / S2,S3,S4 / implementation-ready` | `SCH-AUTO-FLOW-EXECUTE-REQ` | `SCH-AUTO-FLOW-EXECUTE-RESP` | `202 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-AUTO-EXECUTE / ORG` | `Y / required / version` | `AUTOMATION_FLOW_EXECUTE / notification.created / req={dry_run,version}; resp={run_id}` |
| `API-AUTO-005` | `AUTO` | `POST` | `/api/v1/segments` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-AUTO-SEGMENT-CREATE-REQ` | `SCH-AUTO-SEGMENT-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-AUTO-MANAGE / ORG` | `Y / required / -` | `SEGMENT_CREATE / - / req={code,name,rule_json}; resp={id}` |
| `API-AUTO-006` | `AUTO` | `GET` | `/api/v1/campaigns/{id}/metrics` | `S2 / S3 / S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-AUTO-CAMPAIGN-METRIC-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-AUTO-MANAGE,PERM-DASH-VIEW / ORG` | `N / n/a / -` | `CAMPAIGN_METRICS / - / req={id}; resp={delivered,clicked,converted}` |
| `API-QT-001` | `QT` | `GET` | `/api/v1/quotes` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-QT-LIST-QUERY` | `SCH-QT-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-QT-MANAGE / SELF,TEAM,ORG` | `N / n/a / -` | `QUOTE_LIST / - / req=?status=draft; resp={items}` |
| `API-QT-002` | `QT` | `POST` | `/api/v1/quotes` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-QT-CREATE-REQ` | `SCH-QT-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-QT-MANAGE / ORG` | `Y / required / -` | `QUOTE_CREATE / - / req={opportunity_id,total_amount}; resp={id,status}` |
| `API-QT-003` | `QT` | `POST` | `/api/v1/quotes/{id}/submit-approval` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-QT-SUBMIT-APPROVAL-REQ` | `SCH-QT-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-QT-APPROVE / ORG` | `Y / required / version` | `QUOTE_SUBMIT_APPROVAL / - / req={approver_ids,version}; resp={status}` |
| `API-QT-004` | `QT` | `POST` | `/api/v1/quotes/{id}/send` | `S2 / S3 / S2,S3,S4 / implementation-ready` | `SCH-QT-SEND-REQ` | `SCH-QT-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-QT-SEND / ORG` | `Y / required / version` | `QUOTE_SEND / - / req={channel,receiver,version}; resp={status,sent_at}` |
| `API-QT-005` | `QT` | `GET` | `/api/v1/quotes/{id}` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-QT-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-QT-MANAGE / SELF,TEAM,ORG` | `N / n/a / -` | `QUOTE_DETAIL / - / req={id}; resp={quote,versions}` |
| `API-QT-006` | `QT` | `PUT` | `/api/v1/quotes/{id}` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-QT-UPDATE-REQ` | `SCH-QT-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-QT-MANAGE / ORG` | `Y / optional / version` | `QUOTE_UPDATE / - / req={items,valid_until,version}; resp={id,current_version_no}` |
| `API-CT-001` | `CT` | `GET` | `/api/v1/contracts` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-CT-LIST-QUERY` | `SCH-CT-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-CT-MANAGE / SELF,TEAM,ORG` | `N / n/a / -` | `CONTRACT_LIST / - / req=?status=active; resp={items}` |
| `API-CT-002` | `CT` | `POST` | `/api/v1/contracts` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-CT-CREATE-REQ` | `SCH-CT-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-CT-MANAGE / ORG` | `Y / required / -` | `CONTRACT_CREATE / - / req={customer_id,quote_id}; resp={id,status}` |
| `API-CT-003` | `CT` | `POST` | `/api/v1/contracts/{id}/submit-approval` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-CT-SUBMIT-APPROVAL-REQ` | `SCH-CT-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-CT-APPROVE / ORG` | `Y / required / version` | `CONTRACT_SUBMIT_APPROVAL / - / req={approver_ids,version}; resp={status}` |
| `API-CT-004` | `CT` | `POST` | `/api/v1/contracts/{id}/sign` | `S2 / S3 / S2,S3,S4 / implementation-ready` | `SCH-CT-SIGN-REQ` | `SCH-CT-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-CT-SIGN / ORG` | `Y / required / version` | `CONTRACT_SIGN / - / req={sign_provider,version}; resp={status,sign_status}` |
| `API-CT-005` | `CT` | `POST` | `/api/v1/contracts/{id}/expire-check` | `S2 / S3 / S2,S3,S4 / implementation-ready` | `SCH-CT-EXPIRE-CHECK-REQ` | `SCH-ACK` | `200 / 400,403,404 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-CT-ARCHIVE / ORG` | `Y / required / version` | `CONTRACT_EXPIRE_CHECK / notification.created / req={version}; resp={code:OK}` |
| `API-CT-006` | `CT` | `GET` | `/api/v1/contracts/{id}` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-CT-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-CT-MANAGE / SELF,TEAM,ORG` | `N / n/a / -` | `CONTRACT_DETAIL / - / req={id}; resp={contract,documents}` |
| `API-CT-007` | `CT` | `PUT` | `/api/v1/contracts/{id}` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-CT-UPDATE-REQ` | `SCH-CT-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-CT-MANAGE / ORG` | `Y / optional / version` | `CONTRACT_UPDATE / - / req={starts_on,ends_on,version}; resp={id}` |
| `API-ORD-001` | `ORD` | `GET` | `/api/v1/orders` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-ORD-LIST-QUERY` | `SCH-ORD-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-ORD-MANAGE / ORG` | `N / n/a / -` | `ORDER_LIST / subscription.status.changed / req=?status=confirmed; resp={items}` |
| `API-ORD-002` | `ORD` | `POST` | `/api/v1/orders` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-ORD-CREATE-REQ` | `SCH-ORD-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-ORD-MANAGE / ORG` | `Y / required / -` | `ORDER_CREATE / - / req={customer_id,items}; resp={id,status}` |
| `API-ORD-003` | `ORD` | `POST` | `/api/v1/orders/{id}/confirm` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-ORD-CONFIRM-REQ` | `SCH-ORD-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-ORD-MANAGE / ORG` | `Y / required / version` | `ORDER_CONFIRM / - / req={version}; resp={status}` |
| `API-ORD-004` | `ORD` | `POST` | `/api/v1/orders/{id}/activate` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-ORD-ACTIVATE-REQ` | `SCH-ORD-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-ORD-ACTIVATE / ORG` | `Y / required / version` | `ORDER_ACTIVATE / subscription.status.changed / req={activation_mode,version}; resp={status}` |
| `API-ORD-005` | `ORD` | `POST` | `/api/v1/orders/{id}/cancel` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-ORD-CANCEL-REQ` | `SCH-ORD-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-ORD-MANAGE / ORG` | `Y / required / version` | `ORDER_CANCEL / - / req={reason,version}; resp={status}` |
| `API-ORD-006` | `ORD` | `GET` | `/api/v1/orders/{id}` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-ORD-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-ORD-MANAGE / ORG` | `N / n/a / -` | `ORDER_DETAIL / - / req={id}; resp={order,payments}` |
| `API-ORD-007` | `ORD` | `PUT` | `/api/v1/orders/{id}` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-ORD-UPDATE-REQ` | `SCH-ORD-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-ORD-MANAGE / ORG` | `Y / optional / version` | `ORDER_UPDATE / - / req={items,version}; resp={id}` |
| `API-ORD-008` | `ORD` | `POST` | `/api/v1/orders/{id}/refund` | `S3 / S4 / S3,S4 / implementation-ready` | `SCH-ORD-REFUND-REQ` | `SCH-ORD-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-ORD-MANAGE,PERM-PAY-MANAGE / ORG` | `Y / required / version` | `ORDER_REFUND / payment.status.changed / req={amount,reason,version}; resp={status}` |
| `API-PLAN-001` | `PLAN` | `GET` | `/api/v1/plans` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-PLAN-LIST-QUERY` | `SCH-PLAN-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-PLAN-MANAGE / ORG` | `N / n/a / -` | `PLAN_LIST / - / req=?status=active; resp={items}` |
| `API-PLAN-002` | `PLAN` | `POST` | `/api/v1/plans` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-PLAN-CREATE-REQ` | `SCH-PLAN-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-PLAN-MANAGE / ORG` | `Y / required / -` | `PLAN_CREATE / - / req={code,name,base_price}; resp={id}` |
| `API-PLAN-003` | `PLAN` | `GET` | `/api/v1/add-ons` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-PLAN-ADDON-LIST-QUERY` | `SCH-PLAN-ADDON-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-PLAN-MANAGE / ORG` | `N / n/a / -` | `ADDON_LIST / - / req=?billing_type=usage; resp={items}` |
| `API-PLAN-004` | `PLAN` | `POST` | `/api/v1/add-ons` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-PLAN-ADDON-CREATE-REQ` | `SCH-PLAN-ADDON-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-PLAN-MANAGE / ORG` | `Y / required / -` | `ADDON_CREATE / - / req={code,name,unit_price}; resp={id}` |
| `API-PLAN-005` | `PLAN` | `PUT` | `/api/v1/quota-policies/{id}` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-PLAN-QUOTA-POLICY-UPDATE-REQ` | `SCH-PLAN-QUOTA-POLICY-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-PLAN-MANAGE / ORG` | `Y / optional / version` | `QUOTA_POLICY_UPDATE / - / req={limits,version}; resp={id}` |
| `API-SUB-001` | `SUB` | `GET` | `/api/v1/subscriptions` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-SUB-LIST-QUERY` | `SCH-SUB-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-SUB-MANAGE / ORG` | `N / n/a / -` | `SUBSCRIPTION_LIST / subscription.status.changed / req=?status=active; resp={items}` |
| `API-SUB-002` | `SUB` | `POST` | `/api/v1/subscriptions` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-SUB-CREATE-REQ` | `SCH-SUB-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-SUB-MANAGE / ORG` | `Y / required / -` | `SUBSCRIPTION_CREATE / subscription.status.changed / req={order_id,plan_id}; resp={id,status}` |
| `API-SUB-003` | `SUB` | `GET` | `/api/v1/subscriptions/{id}` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-SUB-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-SUB-MANAGE / ORG` | `N / n/a / -` | `SUBSCRIPTION_DETAIL / - / req={id}; resp={subscription,renewals}` |
| `API-SUB-004` | `SUB` | `PUT` | `/api/v1/subscriptions/{id}` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-SUB-UPDATE-REQ` | `SCH-SUB-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-SUB-MANAGE / ORG` | `Y / optional / version` | `SUBSCRIPTION_UPDATE / - / req={seat_count,auto_renew,version}; resp={id}` |
| `API-SUB-005` | `SUB` | `POST` | `/api/v1/subscriptions/{id}/renew` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-SUB-RENEW-REQ` | `SCH-SUB-RENEW-RESP` | `202 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-SUB-RENEW / ORG` | `Y / required / version` | `SUBSCRIPTION_RENEW / bill.status.changed,subscription.status.changed / req={target_end_at,version}; resp={renewal_id}` |
| `API-SUB-006` | `SUB` | `POST` | `/api/v1/subscriptions/{id}/suspend` | `S3 / S4 / S3,S4 / implementation-ready` | `SCH-SUB-SUSPEND-REQ` | `SCH-SUB-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-SUB-SUSPEND / ORG` | `Y / required / version` | `SUBSCRIPTION_SUSPEND / subscription.status.changed / req={reason,version}; resp={status}` |
| `API-BILL-001` | `BILL` | `GET` | `/api/v1/bills` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-BILL-LIST-QUERY` | `SCH-BILL-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-BILL-READ / ORG` | `N / n/a / -` | `BILL_LIST / bill.status.changed / req=?status=open; resp={items}` |
| `API-BILL-002` | `BILL` | `POST` | `/api/v1/bills` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-BILL-CREATE-REQ` | `SCH-BILL-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-BILL-MANAGE / ORG` | `Y / required / -` | `BILL_CREATE / bill.status.changed / req={subscription_id,billing_period}; resp={id,status}` |
| `API-BILL-003` | `BILL` | `GET` | `/api/v1/bills/{id}` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-BILL-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-BILL-READ / ORG` | `N / n/a / -` | `BILL_DETAIL / - / req={id}; resp={bill,bill_items}` |
| `API-BILL-004` | `BILL` | `GET` | `/api/v1/bills/{id}/export` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-BILL-EXPORT-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-BILL-EXPORT / ORG` | `N / n/a / -` | `BILL_EXPORT / - / req={id}; resp={file_url}` |
| `API-BILL-005` | `BILL` | `POST` | `/api/v1/bills/{id}/collect` | `S3 / S4 / S3,S4 / implementation-ready` | `SCH-BILL-COLLECT-REQ` | `SCH-ACK` | `202 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-BILL-COLLECT / ORG` | `Y / required / version` | `BILL_COLLECT / bill.status.changed,subscription.status.changed / req={action,version}; resp={code:OK}` |
| `API-PAY-001` | `PAY` | `POST` | `/api/v1/payments` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-PAY-CREATE-REQ` | `SCH-PAY-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-PAY-MANAGE / ORG` | `Y / required / -` | `PAYMENT_CREATE / payment.status.changed / req={payment_scene,amount}; resp={id,status}` |
| `API-PAY-002` | `PAY` | `POST` | `/api/v1/payments/{id}/confirm` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-PAY-CONFIRM-REQ` | `SCH-PAY-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-PAY-CONFIRM / ORG` | `Y / required / version` | `PAYMENT_CONFIRM / payment.status.changed / req={paid_at,version}; resp={status}` |
| `API-PAY-003` | `PAY` | `GET` | `/api/v1/payments` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-PAY-LIST-QUERY` | `SCH-PAY-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-PAY-MANAGE / ORG` | `N / n/a / -` | `PAYMENT_LIST / payment.status.changed / req=?status=succeeded; resp={items}` |
| `API-PAY-004` | `PAY` | `GET` | `/api/v1/payments/{id}` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-PAY-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-PAY-MANAGE / ORG` | `N / n/a / -` | `PAYMENT_DETAIL / - / req={id}; resp={payment}` |
| `API-PAY-005` | `PAY` | `POST` | `/api/v1/payments/{id}/refund` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-PAY-REFUND-REQ` | `SCH-PAY-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-PAY-REFUND / ORG` | `Y / required / version` | `PAYMENT_REFUND / payment.status.changed / req={version}; resp={status}` |
| `API-PAY-006` | `PAY` | `POST` | `/api/v1/payments/{id}/void` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-PAY-VOID-REQ` | `SCH-PAY-DETAIL-RESP` | `200 / 400,403,404,409,422 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION,STATUS_TRANSITION_INVALID` | `PERM-PAY-MANAGE / ORG` | `Y / required / version` | `PAYMENT_VOID / payment.status.changed / req={version}; resp={status}` |
| `API-PAY-007` | `PAY` | `POST` | `/api/v1/payments/{id}/reconcile` | `S3 / S4 / S3,S4 / implementation-ready` | `SCH-PAY-RECONCILE-REQ` | `SCH-PAY-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-PAY-RECONCILE / ORG` | `Y / required / version` | `PAYMENT_RECONCILE / payment.status.changed,bill.status.changed / req={provider_ref,version}; resp={status}` |
| `API-INV-001` | `INV` | `GET` | `/api/v1/invoices` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-INV-LIST-QUERY` | `SCH-INV-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-INV-MANAGE / ORG` | `N / n/a / -` | `INVOICE_LIST / invoice.status.changed / req=?status=requested; resp={items}` |
| `API-INV-002` | `INV` | `POST` | `/api/v1/invoices` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-INV-CREATE-REQ` | `SCH-INV-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-INV-MANAGE / ORG` | `Y / required / -` | `INVOICE_CREATE / invoice.status.changed / req={bill_id,title,tax_no}; resp={id,status}` |
| `API-INV-003` | `INV` | `POST` | `/api/v1/invoices/{id}/issue` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-INV-ISSUE-REQ` | `SCH-INV-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-INV-ISSUE / ORG` | `Y / required / version` | `INVOICE_ISSUE / invoice.status.changed / req={invoice_no,version}; resp={status,issued_at}` |
| `API-INV-004` | `INV` | `POST` | `/api/v1/invoices/{id}/deliver` | `S3 / S4 / S3,S4 / implementation-ready` | `SCH-INV-DELIVER-REQ` | `SCH-INV-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-INV-ISSUE / ORG,PORTAL` | `Y / required / version` | `INVOICE_DELIVER / invoice.status.changed / req={channel,receiver,version}; resp={status,delivered_at}` |
| `API-CSM-001` | `CSM` | `GET` | `/api/v1/customers/{id}/health` | `S2 / S2 / S2,S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-CSM-HEALTH-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-CSM-VIEW / TEAM,ORG` | `N / n/a / -` | `CUSTOMER_HEALTH / - / req={id}; resp={score,drivers}` |
| `API-CSM-002` | `CSM` | `POST` | `/api/v1/success-plans` | `S2 / S3 / S2,S3,S4 / implementation-ready` | `SCH-CSM-SUCCESS-PLAN-CREATE-REQ` | `SCH-CSM-SUCCESS-PLAN-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-CSM-MANAGE / ORG` | `Y / required / -` | `SUCCESS_PLAN_CREATE / notification.created / req={customer_id,title}; resp={id,status}` |
| `API-CSM-003` | `CSM` | `GET` | `/api/v1/renewals/workbench` | `S2 / S3 / S2,S3,S4 / implementation-ready` | `SCH-CSM-RENEWAL-WORKBENCH-QUERY` | `SCH-CSM-RENEWAL-WORKBENCH-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-CSM-RENEW / TEAM,ORG` | `N / n/a / -` | `RENEWAL_WORKBENCH / bill.status.changed,subscription.status.changed / req=?target_end_lt=30d; resp={items}` |
| `API-CSM-004` | `CSM` | `POST` | `/api/v1/customers/{id}/expansion-recommendations` | `S2 / S4 / S2,S3,S4 / implementation-ready` | `SCH-CSM-EXPANSION-REQ` | `SCH-CSM-EXPANSION-RESP` | `202 / 400,403,404 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-CSM-MANAGE / TEAM,ORG` | `Y / required / -` | `EXPANSION_RECOMMEND / notification.created / req={id}; resp={task_id}` |
| `API-INT-001` | `INT` | `GET` | `/api/v1/integrations` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-INT-LIST-QUERY` | `SCH-INT-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-INT-MANAGE / ORG` | `N / n/a / -` | `INTEGRATION_LIST / - / req=?provider=feishu; resp={items}` |
| `API-INT-002` | `INT` | `POST` | `/api/v1/integrations` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-INT-CREATE-REQ` | `SCH-INT-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-INT-MANAGE / ORG` | `Y / required / -` | `INTEGRATION_CREATE / - / req={code,provider,config_json}; resp={id}` |
| `API-INT-003` | `INT` | `POST` | `/api/v1/integration-flows` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-INT-FLOW-CREATE-REQ` | `SCH-INT-FLOW-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-INT-MANAGE / ORG` | `Y / required / -` | `INTEGRATION_FLOW_CREATE / - / req={integration_id,flow_code,direction}; resp={id}` |
| `API-INT-004` | `INT` | `POST` | `/api/v1/webhooks` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-INT-WEBHOOK-CREATE-REQ` | `SCH-INT-WEBHOOK-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-INT-WEBHOOK / ORG` | `Y / required / -` | `WEBHOOK_CREATE / - / req={integration_id,event_type,url}; resp={id}` |
| `API-INT-005` | `INT` | `POST` | `/api/v1/api-clients` | `S3 / S4 / S3,S4 / implementation-ready` | `SCH-INT-CLIENT-CREATE-REQ` | `SCH-INT-CLIENT-DETAIL-RESP` | `201 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-INT-APIKEY / ORG` | `Y / required / -` | `API_CLIENT_CREATE / - / req={code,name,client_type}; resp={id,key_prefix}` |
| `API-PLT-001` | `PLT` | `GET` | `/api/v1/portal/home` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-HEADER-PORTAL` | `SCH-PLT-PORTAL-HOME-RESP` | `200 / 401,403 / AUTH_UNAUTHORIZED,AUTH_FORBIDDEN` | `PERM-PLT-MANAGE / PORTAL` | `N / n/a / -` | `PORTAL_HOME / ticket.status.changed,bill.status.changed / req=headers; resp={cards}` |
| `API-PLT-002` | `PLT` | `GET` | `/api/v1/mobile/workspace` | `S3 / S3 / S3,S4 / implementation-ready` | `SCH-HEADER-AUTH` | `SCH-PLT-MOBILE-WORKSPACE-RESP` | `200 / 401,403 / AUTH_UNAUTHORIZED,AUTH_FORBIDDEN` | `PERM-PLT-MANAGE / SELF,ORG` | `N / n/a / -` | `MOBILE_WORKSPACE / notification.created,conversation.message.created / req=headers; resp={cards}` |
| `API-PLT-003` | `PLT` | `GET` | `/api/v1/miniapp/home` | `S3 / S4 / S3,S4 / implementation-ready` | `SCH-HEADER-AUTH` | `SCH-PLT-MINIAPP-HOME-RESP` | `200 / 401,403 / AUTH_UNAUTHORIZED,AUTH_FORBIDDEN` | `PERM-PLT-MANAGE / SELF,ORG` | `N / n/a / -` | `MINIAPP_HOME / notification.created / req=headers; resp={widgets}` |
| `API-PLT-004` | `PLT` | `PUT` | `/api/v1/terminal-profiles/{id}` | `S3 / S4 / S3,S4 / implementation-ready` | `SCH-PLT-TERMINAL-PROFILE-UPDATE-REQ` | `SCH-PLT-TERMINAL-PROFILE-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-PLT-MANAGE / ORG` | `Y / optional / version` | `TERMINAL_PROFILE_UPDATE / - / req={theme_json,feature_flags_json,version}; resp={id}` |
| `API-I18N-001` | `I18N` | `GET` | `/api/v1/locale-resources` | `S4 / S4 / S4 / implementation-ready` | `SCH-I18N-LOCALE-LIST-QUERY` | `SCH-I18N-LOCALE-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-I18N-MANAGE / ORG` | `N / n/a / -` | `LOCALE_RESOURCE_LIST / - / req=?locale_code=zh-CN; resp={items}` |
| `API-I18N-002` | `I18N` | `PUT` | `/api/v1/locale-resources/{id}` | `S4 / S4 / S4 / implementation-ready` | `SCH-I18N-LOCALE-UPDATE-REQ` | `SCH-I18N-LOCALE-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-I18N-MANAGE / ORG` | `Y / optional / version` | `LOCALE_RESOURCE_UPDATE / - / req={text_value,status,version}; resp={id}` |
| `API-I18N-003` | `I18N` | `GET` | `/api/v1/region-policies` | `S4 / S4 / S4 / implementation-ready` | `SCH-I18N-REGION-LIST-QUERY` | `SCH-I18N-REGION-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-I18N-MANAGE / ORG` | `N / n/a / -` | `REGION_POLICY_LIST / - / req=?region_code=CN; resp={items}` |
| `API-I18N-004` | `I18N` | `PUT` | `/api/v1/region-policies/{id}` | `S4 / S4 / S4 / implementation-ready` | `SCH-I18N-REGION-UPDATE-REQ` | `SCH-I18N-REGION-DETAIL-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-I18N-MANAGE / ORG` | `Y / optional / version` | `REGION_POLICY_UPDATE / - / req={currency,tax_mode,policy_json,version}; resp={id}` |
| `API-I18N-005` | `I18N` | `POST` | `/api/v1/consent-records` | `S4 / S4 / S4 / implementation-ready` | `SCH-I18N-CONSENT-CREATE-REQ` | `SCH-I18N-CONSENT-RESP` | `201 / 400,403 / PARAM_INVALID,AUTH_FORBIDDEN` | `PERM-I18N-MANAGE / ORG` | `Y / required / -` | `CONSENT_RECORD_CREATE / - / req={subject_type,consent_type,status}; resp={id}` |
| `API-DEPLOY-001` | `DEPLOY` | `GET` | `/api/v1/deployment-profiles` | `S3 / S4 / S3,S4 / implementation-ready` | `SCH-DEPLOY-PROFILE-LIST-QUERY` | `SCH-DEPLOY-PROFILE-LIST-RESP` | `200 / 403 / AUTH_FORBIDDEN` | `PERM-DEPLOY-MANAGE / ORG` | `N / n/a / -` | `DEPLOYMENT_PROFILE_LIST / - / req=?deploy_mode=onprem; resp={items}` |
| `API-DEPLOY-002` | `DEPLOY` | `PUT` | `/api/v1/deployment-profiles/{id}` | `S3 / S4 / S3,S4 / implementation-ready` | `SCH-DEPLOY-PROFILE-UPDATE-REQ` | `SCH-DEPLOY-PROFILE-RESP` | `200 / 400,403,404,409 / PARAM_INVALID,AUTH_FORBIDDEN,RESOURCE_NOT_FOUND,CONFLICT_VERSION` | `PERM-DEPLOY-MANAGE / ORG` | `Y / optional / version` | `DEPLOYMENT_PROFILE_UPDATE / - / req={domain,status,version}; resp={id}` |
| `API-DEPLOY-003` | `DEPLOY` | `POST` | `/api/v1/migration-batches` | `S3 / S4 / S3,S4 / implementation-ready` | `SCH-DEPLOY-MIGRATION-CREATE-REQ` | `SCH-DEPLOY-MIGRATION-RESP` | `202 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-DEPLOY-MANAGE / ORG` | `Y / required / -` | `MIGRATION_BATCH_CREATE / - / req={deployment_profile_id,from_version,to_version}; resp={batch_id}` |
| `API-DEPLOY-004` | `DEPLOY` | `GET` | `/api/v1/migration-batches/{id}` | `S3 / S4 / S3,S4 / implementation-ready` | `SCH-PATH-ID` | `SCH-DEPLOY-MIGRATION-DETAIL-RESP` | `200 / 403,404 / AUTH_FORBIDDEN,RESOURCE_NOT_FOUND` | `PERM-DEPLOY-MANAGE / ORG` | `N / n/a / -` | `MIGRATION_BATCH_DETAIL / - / req={id}; resp={status,rollback_token}` |
| `API-DEPLOY-005` | `DEPLOY` | `POST` | `/api/v1/license-tokens/activate` | `S3 / S4 / S3,S4 / implementation-ready` | `SCH-DEPLOY-LICENSE-ACTIVATE-REQ` | `SCH-DEPLOY-LICENSE-ACTIVATE-RESP` | `200 / 400,403,409 / PARAM_INVALID,AUTH_FORBIDDEN,CONFLICT_VERSION` | `PERM-DEPLOY-MANAGE / ORG` | `Y / required / -` | `LICENSE_ACTIVATE / - / req={token_code,bound_fingerprint}; resp={status,activated_at}` |

## 4. S2 新增模块原子 API 合同

## QT 报价管理

### API-QT-001 创建报价

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /quotes |
| 认证 | Bearer JWT |
| 权限 | PERM-QT-CREATE |
| 阶段 | S2 |

**请求体**：
```json
{
  "opportunityId": "uuid",
  "customerId": "uuid",
  "currency": "CNY",
  "items": [
    { "itemType": "plan", "refId": "uuid", "quantity": 1, "unitPrice": 10000.00 }
  ]
}
```

**响应体**（201）：
```json
{
  "id": "uuid",
  "quoteNo": "QT-2026-00001",
  "opportunityId": "uuid",
  "customerId": "uuid",
  "currentVersionNo": 1,
  "currency": "CNY",
  "amount": 10000.00,
  "status": "draft",
  "createdAt": "2026-04-12T10:00:00Z"
}
```

### API-QT-002 获取报价详情

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /quotes/{id} |
| 认证 | Bearer JWT |
| 权限 | PERM-QT-VIEW |
| 阶段 | S2 |

**响应体**（200）：
```json
{
  "id": "uuid",
  "quoteNo": "QT-2026-00001",
  "opportunityId": "uuid",
  "customerId": "uuid",
  "currentVersionNo": 1,
  "currency": "CNY",
  "amount": 10000.00,
  "status": "draft",
  "versions": [
    { "versionNo": 1, "totalAmount": 10000.00, "createdAt": "2026-04-12T10:00:00Z" }
  ],
  "createdAt": "2026-04-12T10:00:00Z",
  "updatedAt": "2026-04-12T10:00:00Z"
}
```

### API-QT-003 提交报价审批

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /quotes/{id}/submit |
| 认证 | Bearer JWT |
| 权限 | PERM-QT-CREATE |
| 阶段 | S2 |

**响应体**（200）：
```json
{ "id": "uuid", "status": "pending_approval" }
```

### API-QT-004 报价审批

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /quotes/{id}/approve |
| 认证 | Bearer JWT |
| 权限 | PERM-QT-APPROVE |
| 阶段 | S2 |

**请求体**：
```json
{ "action": "approved|rejected", "comment": "string" }
```

**响应体**（200）：
```json
{ "id": "uuid", "status": "approved|rejected" }
```

### API-QT-005 发送报价

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /quotes/{id}/send |
| 认证 | Bearer JWT |
| 权限 | PERM-QT-CREATE |
| 阶段 | S2 |

**响应体**（200）：
```json
{ "id": "uuid", "status": "sent" }
```

### API-QT-006 报价列表

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /quotes |
| 认证 | Bearer JWT |
| 权限 | PERM-QT-VIEW |
| 阶段 | S2 |

**查询参数**：`status`, `customerId`, `opportunityId`, `page`, `pageSize`

**响应体**（200）：
```json
{
  "items": [
    { "id": "uuid", "quoteNo": "QT-2026-00001", "customerId": "uuid", "status": "draft", "amount": 10000.00, "createdAt": "2026-04-12T10:00:00Z" }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

## CT 合同管理

### API-CT-001 创建合同

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /contracts |
| 认证 | Bearer JWT |
| 权限 | PERM-CT-CREATE |
| 阶段 | S2 |

**请求体**：
```json
{
  "quoteId": "uuid|null",
  "opportunityId": "uuid",
  "customerId": "uuid",
  "startsOn": "2026-05-01",
  "endsOn": "2027-04-30"
}
```

**响应体**（201）：
```json
{
  "id": "uuid",
  "contractNo": "CT-2026-00001",
  "quoteId": "uuid|null",
  "opportunityId": "uuid",
  "customerId": "uuid",
  "status": "draft",
  "startsOn": "2026-05-01",
  "endsOn": "2027-04-30",
  "createdAt": "2026-04-12T10:00:00Z"
}
```

### API-CT-002 获取合同详情

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /contracts/{id} |
| 认证 | Bearer JWT |
| 权限 | PERM-CT-VIEW |
| 阶段 | S2 |

**响应体**（200）：
```json
{
  "id": "uuid",
  "contractNo": "CT-2026-00001",
  "quoteId": "uuid|null",
  "opportunityId": "uuid",
  "customerId": "uuid",
  "status": "draft",
  "startsOn": "2026-05-01",
  "endsOn": "2027-04-30",
  "documents": [],
  "createdAt": "2026-04-12T10:00:00Z",
  "updatedAt": "2026-04-12T10:00:00Z"
}
```

### API-CT-003 提交合同审批

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /contracts/{id}/submit |
| 认证 | Bearer JWT |
| 权限 | PERM-CT-CREATE |
| 阶段 | S2 |

**响应体**（200）：
```json
{ "id": "uuid", "status": "pending_approval" }
```

### API-CT-004 合同审批

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /contracts/{id}/approve |
| 认证 | Bearer JWT |
| 权限 | PERM-CT-APPROVE |
| 阶段 | S2 |

**请求体**：
```json
{ "action": "approved|rejected", "comment": "string" }
```

**响应体**（200）：
```json
{ "id": "uuid", "status": "approved|rejected" }
```

### API-CT-005 合同签署

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /contracts/{id}/sign |
| 认证 | Bearer JWT |
| 权限 | PERM-CT-SIGN |
| 阶段 | S2 |

**请求体**：
```json
{ "signedAt": "2026-04-12T10:00:00Z" }
```

**响应体**（200）：
```json
{ "id": "uuid", "status": "active", "signedAt": "2026-04-12T10:00:00Z" }
```

### API-CT-006 上传合同文档

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /contracts/{id}/documents |
| 认证 | Bearer JWT |
| 权限 | PERM-CT-CREATE |
| 阶段 | S2 |

**请求体**（multipart/form-data）：`file`, `docType`

**响应体**（201）：
```json
{ "id": "uuid", "contractId": "uuid", "fileUrl": "string", "docType": "original" }
```

### API-CT-007 合同列表

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /contracts |
| 认证 | Bearer JWT |
| 权限 | PERM-CT-VIEW |
| 阶段 | S2 |

**查询参数**：`status`, `customerId`, `opportunityId`, `page`, `pageSize`

**响应体**（200）：
```json
{
  "items": [
    { "id": "uuid", "contractNo": "CT-2026-00001", "customerId": "uuid", "status": "draft", "createdAt": "2026-04-12T10:00:00Z" }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

## ORD 订单管理

### API-ORD-001 创建订单

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /orders |
| 认证 | Bearer JWT |
| 权限 | PERM-ORD-CREATE |
| 阶段 | S2 |

**请求体**：
```json
{
  "contractId": "uuid|null",
  "quoteId": "uuid|null",
  "customerId": "uuid",
  "orderType": "new",
  "items": [
    { "itemType": "plan", "refId": "uuid", "quantity": 1, "unitPrice": 10000.00 }
  ]
}
```

**响应体**（201）：
```json
{
  "id": "uuid",
  "orderNo": "ORD-2026-00001",
  "contractId": "uuid|null",
  "quoteId": "uuid|null",
  "customerId": "uuid",
  "orderType": "new",
  "status": "draft",
  "currency": "CNY",
  "totalAmount": 10000.00,
  "createdAt": "2026-04-12T10:00:00Z"
}
```

### API-ORD-002 获取订单详情

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /orders/{id} |
| 认证 | Bearer JWT |
| 权限 | PERM-ORD-VIEW |
| 阶段 | S2 |

**响应体**（200）：
```json
{
  "id": "uuid",
  "orderNo": "ORD-2026-00001",
  "contractId": "uuid|null",
  "quoteId": "uuid|null",
  "customerId": "uuid",
  "orderType": "new",
  "status": "draft",
  "currency": "CNY",
  "totalAmount": 10000.00,
  "items": [
    { "id": "uuid", "itemType": "plan", "refId": "uuid", "quantity": 1, "unitPrice": 10000.00 }
  ],
  "payments": [],
  "createdAt": "2026-04-12T10:00:00Z",
  "updatedAt": "2026-04-12T10:00:00Z"
}
```

### API-ORD-003 确认订单

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /orders/{id}/confirm |
| 认证 | Bearer JWT |
| 权限 | PERM-ORD-CONFIRM |
| 阶段 | S2 |

**响应体**（200）：
```json
{ "id": "uuid", "status": "confirmed" }
```

### API-ORD-004 激活订单

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /orders/{id}/activate |
| 认证 | Bearer JWT |
| 权限 | PERM-ORD-CONFIRM |
| 阶段 | S2 |

**响应体**（200）：
```json
{ "id": "uuid", "status": "active" }
```

### API-ORD-005 取消订单

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /orders/{id}/cancel |
| 认证 | Bearer JWT |
| 权限 | PERM-ORD-CANCEL |
| 阶段 | S2 |

**请求体**：
```json
{ "reason": "string" }
```

**响应体**（200）：
```json
{ "id": "uuid", "status": "cancelled" }
```

### API-ORD-006 订单列表

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /orders |
| 认证 | Bearer JWT |
| 权限 | PERM-ORD-VIEW |
| 阶段 | S2 |

**查询参数**：`status`, `customerId`, `orderType`, `page`, `pageSize`

**响应体**（200）：
```json
{
  "items": [
    { "id": "uuid", "orderNo": "ORD-2026-00001", "customerId": "uuid", "orderType": "new", "status": "draft", "totalAmount": 10000.00, "createdAt": "2026-04-12T10:00:00Z" }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

## PAY 付款确认

### API-PAY-001 创建付款记录

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /payments |
| 认证 | Bearer JWT |
| 权限 | PERM-PAY-CREATE |
| 阶段 | S2 |

**请求体**：
```json
{
  "paymentScene": "order",
  "sceneId": "uuid",
  "channel": "bank_transfer",
  "amount": 10000.00,
  "currency": "CNY"
}
```

**响应体**（201）：
```json
{
  "id": "uuid",
  "paymentNo": "PAY-2026-00001",
  "paymentScene": "order",
  "sceneId": "uuid",
  "channel": "bank_transfer",
  "status": "pending",
  "amount": 10000.00,
  "currency": "CNY",
  "createdAt": "2026-04-12T10:00:00Z"
}
```

### API-PAY-002 确认付款

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /payments/{id}/confirm |
| 认证 | Bearer JWT |
| 权限 | PERM-PAY-CONFIRM |
| 阶段 | S2 |

**请求体**：
```json
{ "paidAt": "2026-04-12T10:00:00Z" }
```

**响应体**（200）：
```json
{ "id": "uuid", "status": "succeeded", "paidAt": "2026-04-12T10:00:00Z" }
```

### API-PAY-003 付款列表

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /payments |
| 认证 | Bearer JWT |
| 权限 | PERM-PAY-VIEW |
| 阶段 | S2 |

**查询参数**：`status`, `paymentScene`, `sceneId`, `page`, `pageSize`

**响应体**（200）：
```json
{
  "items": [
    { "id": "uuid", "paymentNo": "PAY-2026-00001", "paymentScene": "order", "sceneId": "uuid", "status": "pending", "amount": 10000.00, "createdAt": "2026-04-12T10:00:00Z" }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

## SUB 订阅管理

### API-SUB-001 开通订阅

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /subscriptions |
| 认证 | Bearer JWT |
| 权限 | PERM-SUB-CREATE |
| 阶段 | S2 |

**请求体**：
```json
{
  "customerId": "uuid",
  "orderId": "uuid",
  "planId": "uuid|null",
  "startsAt": "2026-05-01T00:00:00Z",
  "endsAt": "2027-04-30T23:59:59Z",
  "autoRenew": false
}
```

**响应体**（201）：
```json
{
  "id": "uuid",
  "customerId": "uuid",
  "orderId": "uuid",
  "planId": "uuid|null",
  "status": "active",
  "startsAt": "2026-05-01T00:00:00Z",
  "endsAt": "2027-04-30T23:59:59Z",
  "autoRenew": false,
  "createdAt": "2026-04-12T10:00:00Z"
}
```

### API-SUB-002 获取订阅详情

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /subscriptions/{id} |
| 认证 | Bearer JWT |
| 权限 | PERM-SUB-VIEW |
| 阶段 | S2 |

**响应体**（200）：
```json
{
  "id": "uuid",
  "customerId": "uuid",
  "orderId": "uuid",
  "planId": "uuid|null",
  "status": "active",
  "startsAt": "2026-05-01T00:00:00Z",
  "endsAt": "2027-04-30T23:59:59Z",
  "autoRenew": false,
  "seats": [],
  "createdAt": "2026-04-12T10:00:00Z",
  "updatedAt": "2026-04-12T10:00:00Z"
}
```

### API-SUB-003 暂停订阅

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /subscriptions/{id}/suspend |
| 认证 | Bearer JWT |
| 权限 | PERM-SUB-MANAGE |
| 阶段 | S2 |

**请求体**：
```json
{ "reason": "string" }
```

**响应体**（200）：
```json
{ "id": "uuid", "status": "suspended" }
```

### API-SUB-004 恢复订阅

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /subscriptions/{id}/resume |
| 认证 | Bearer JWT |
| 权限 | PERM-SUB-MANAGE |
| 阶段 | S2 |

**响应体**（200）：
```json
{ "id": "uuid", "status": "active" }
```

### API-SUB-005 取消订阅

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /subscriptions/{id}/cancel |
| 认证 | Bearer JWT |
| 权限 | PERM-SUB-MANAGE |
| 阶段 | S2 |

**请求体**：
```json
{ "reason": "string" }
```

**响应体**（200）：
```json
{ "id": "uuid", "status": "cancelled" }
```

### API-SUB-006 订阅列表

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /subscriptions |
| 认证 | Bearer JWT |
| 权限 | PERM-SUB-VIEW |
| 阶段 | S2 |

**查询参数**：`status`, `customerId`, `page`, `pageSize`

**响应体**（200）：
```json
{
  "items": [
    { "id": "uuid", "customerId": "uuid", "status": "active", "startsAt": "2026-05-01T00:00:00Z", "endsAt": "2027-04-30T23:59:59Z", "createdAt": "2026-04-12T10:00:00Z" }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

## CSM 客户成功

### API-CSM-001 获取客户健康度

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /customers/{id}/health |
| 认证 | Bearer JWT |
| 权限 | PERM-CSM-VIEW |
| 阶段 | S2 |

**响应体**（200）：
```json
{
  "id": "uuid",
  "customerId": "uuid",
  "score": 75.00,
  "level": "medium",
  "factors": { "engagement": 80, "support": 60, "payment": 85 },
  "evaluatedAt": "2026-04-12T10:00:00Z"
}
```

### API-CSM-002 创建成功计划

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /customers/{id}/success-plans |
| 认证 | Bearer JWT |
| 权限 | PERM-CSM-MANAGE |
| 阶段 | S2 |

**请求体**：
```json
{ "title": "string", "ownerUserId": "uuid", "payload": {} }
```

**响应体**（201）：
```json
{ "id": "uuid", "customerId": "uuid", "title": "string", "status": "draft", "ownerUserId": "uuid", "createdAt": "2026-04-12T10:00:00Z" }
```

### API-CSM-003 创建回访记录

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /customers/{id}/return-visits |
| 认证 | Bearer JWT |
| 权限 | PERM-CSM-MANAGE |
| 阶段 | S2 |

**请求体**：
```json
{ "visitType": "phone", "summary": "string", "nextVisitAt": "2026-05-12T10:00:00Z" }
```

**响应体**（201）：
```json
{ "id": "uuid", "customerId": "uuid", "visitType": "phone", "summary": "string", "createdAt": "2026-04-12T10:00:00Z" }
```

### API-CSM-004 续费提醒列表

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /csm/renewal-reminders |
| 认证 | Bearer JWT |
| 权限 | PERM-CSM-VIEW |
| 阶段 | S2 |

**查询参数**：`daysBeforeExpiry`, `page`, `pageSize`

**响应体**（200）：
```json
{
  "items": [
    { "customerId": "uuid", "customerName": "string", "subscriptionId": "uuid", "endsAt": "2027-04-30T23:59:59Z", "daysLeft": 30 }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

## KB 知识库

### API-KB-001 创建知识分类

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /knowledge/categories |
| 认证 | Bearer JWT |
| 权限 | PERM-KB-MANAGE |
| 阶段 | S2 |

**请求体**：
```json
{ "code": "string", "name": "string", "parentId": "uuid|null", "sortOrder": 0 }
```

**响应体**（201）：
```json
{ "id": "uuid", "code": "string", "name": "string", "parentId": "uuid|null", "sortOrder": 0, "status": "active", "createdAt": "2026-04-12T10:00:00Z" }
```

### API-KB-002 创建知识条目

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /knowledge/items |
| 认证 | Bearer JWT |
| 权限 | PERM-KB-MANAGE |
| 阶段 | S2 |

**请求体**：
```json
{ "categoryId": "uuid", "title": "string", "contentMd": "string", "keywords": ["string"], "sourceType": "manual" }
```

**响应体**（201）：
```json
{ "id": "uuid", "categoryId": "uuid", "title": "string", "status": "draft", "sourceType": "manual", "createdAt": "2026-04-12T10:00:00Z" }
```

### API-KB-003 提交知识审核

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /knowledge/items/{id}/submit |
| 认证 | Bearer JWT |
| 权限 | PERM-KB-MANAGE |
| 阶段 | S2 |

**响应体**（200）：
```json
{ "id": "uuid", "status": "review" }
```

### API-KB-004 知识审核

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /knowledge/items/{id}/review |
| 认证 | Bearer JWT |
| 权限 | PERM-KB-REVIEW |
| 阶段 | S2 |

**请求体**：
```json
{ "action": "approved|rejected", "comment": "string" }
```

**响应体**（200）：
```json
{ "id": "uuid", "status": "published|draft" }
```

### API-KB-005 知识搜索

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /knowledge/search |
| 认证 | Bearer JWT |
| 权限 | PERM-KB-VIEW |
| 阶段 | S2 |

**查询参数**：`q`, `categoryId`, `page`, `pageSize`

**响应体**（200）：
```json
{
  "items": [
    { "id": "uuid", "title": "string", "categoryId": "uuid", "status": "published", "createdAt": "2026-04-12T10:00:00Z" }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

### API-KB-006 AI 知识问答

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /knowledge/ask |
| 认证 | Bearer JWT |
| 权限 | PERM-KB-VIEW |
| 阶段 | S2 |

**请求体**：
```json
{ "question": "string", "categoryId": "uuid|null" }
```

**响应体**（200）：
```json
{ "answer": "string", "sources": [{ "itemId": "uuid", "title": "string", "relevance": 0.95 }] }
```

## DASH 经营驾驶舱

### API-DASH-001 销售看板

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /dashboard/sales |
| 认证 | Bearer JWT |
| 权限 | PERM-DASH-VIEW |
| 阶段 | S2 |

**查询参数**：`period`, `ownerUserId`

**响应体**（200）：
```json
{
  "pipelineSummary": { "totalLeads": 100, "totalOpportunities": 50, "wonAmount": 500000.00 },
  "conversionRates": { "leadToOpportunity": 0.3, "opportunityToWon": 0.2 },
  "monthlyTrend": [{ "month": "2026-04", "wonAmount": 100000.00, "newLeads": 30 }]
}
```

### API-DASH-002 服务看板

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /dashboard/service |
| 认证 | Bearer JWT |
| 权限 | PERM-DASH-VIEW |
| 阶段 | S2 |

**响应体**（200）：
```json
{
  "activeSubscriptions": 120,
  "expiringIn30Days": 15,
  "healthDistribution": { "high": 60, "medium": 40, "low": 15, "critical": 5 },
  "pendingReturnVisits": 8
}
```

### API-DASH-003 指标快照

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /dashboard/metrics/{metricCode} |
| 认证 | Bearer JWT |
| 权限 | PERM-DASH-VIEW |
| 阶段 | S2 |

**查询参数**：`from`, `to`

**响应体**（200）：
```json
{
  "metricCode": "won_amount_monthly",
  "snapshots": [{ "snapshotAt": "2026-04-01T00:00:00Z", "metricValue": 100000.00 }]
}
```

## AUTO 触发式自动化

### API-AUTO-001 创建自动化流程

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /automation/flows |
| 认证 | Bearer JWT |
| 权限 | PERM-AUTO-MANAGE |
| 阶段 | S2 |

**请求体**：
```json
{ "code": "string", "name": "string", "triggerType": "event", "definition": { "trigger": { "event": "opportunity.won" }, "steps": [{ "stepCode": "create_quote", "stepType": "action", "config": {} }] } }
```

**响应体**（201）：
```json
{ "id": "uuid", "code": "string", "name": "string", "triggerType": "event", "status": "draft", "createdAt": "2026-04-12T10:00:00Z" }
```

### API-AUTO-002 获取自动化流程详情

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /automation/flows/{id} |
| 认证 | Bearer JWT |
| 权限 | PERM-AUTO-VIEW |
| 阶段 | S2 |

**响应体**（200）：
```json
{ "id": "uuid", "code": "string", "name": "string", "triggerType": "event", "status": "draft", "definition": {}, "createdAt": "2026-04-12T10:00:00Z", "updatedAt": "2026-04-12T10:00:00Z" }
```

### API-AUTO-003 启用自动化流程

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /automation/flows/{id}/activate |
| 认证 | Bearer JWT |
| 权限 | PERM-AUTO-MANAGE |
| 阶段 | S2 |

**响应体**（200）：
```json
{ "id": "uuid", "status": "active" }
```

### API-AUTO-004 暂停自动化流程

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /automation/flows/{id}/pause |
| 认证 | Bearer JWT |
| 权限 | PERM-AUTO-MANAGE |
| 阶段 | S2 |

**响应体**（200）：
```json
{ "id": "uuid", "status": "paused" }
```

### API-AUTO-005 获取执行记录

| 字段 | 值 |
|---|---|
| 方法 | GET |
| 路径 | /automation/flows/{id}/runs |
| 认证 | Bearer JWT |
| 权限 | PERM-AUTO-VIEW |
| 阶段 | S2 |

**查询参数**：`status`, `page`, `pageSize`

**响应体**（200）：
```json
{
  "items": [
    { "id": "uuid", "flowId": "uuid", "status": "succeeded", "startedAt": "2026-04-12T10:00:00Z", "finishedAt": "2026-04-12T10:00:01Z" }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

### API-AUTO-006 重试失败执行

| 字段 | 值 |
|---|---|
| 方法 | POST |
| 路径 | /automation/runs/{id}/retry |
| 认证 | Bearer JWT |
| 权限 | PERM-AUTO-MANAGE |
| 阶段 | S2 |

**响应体**（200）：
```json
{ "id": "uuid", "status": "pending" }
```
