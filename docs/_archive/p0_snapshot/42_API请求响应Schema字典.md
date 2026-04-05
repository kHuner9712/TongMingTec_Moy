# MOY API 请求响应 Schema 字典

## 1. 文档元信息
| 属性 | 内容 |
| --- | --- |
| 文档编号 | MOY_API_SCHEMA_001 |
| 文档版本 | v1.0 |
| 文档状态 | 已确认（实现级冻结） |
| 日期 | 2026-04-05 |
| 依赖文档 | `11_API_接口设计说明.md`、`10_DBD_数据模型与数据字典.md` |

## 2. 基础类型与通用校验
| 类型 | 说明 |
| --- | --- |
| uuid | RFC4122 v4 |
| string | UTF-8 字符串 |
| enum | 固定枚举值 |
| integer | 32 位整数 |
| number | 小数 |
| boolean | 布尔 |
| datetime | ISO8601，UTC 存储 |
| date | `YYYY-MM-DD` |
| json | JSON 对象/数组 |

### 2.1 通用 Schema

#### SCH-PATH-ID
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| id | uuid | 是 | 路径参数 `{id}` |

#### SCH-PAGE-QUERY（复用）
| 字段 | 类型 | 必填 | 默认值 | 规则 |
| --- | --- | --- | --- | --- |
| page | integer | 否 | 1 | >=1 |
| page_size | integer | 否 | 20 | 1~100 |
| sort_by | string | 否 | created_at | 见各接口允许字段 |
| sort_order | enum | 否 | desc | `asc/desc` |

#### SCH-VERSION-FIELD（复用）
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |

#### SCH-LIST-META（响应）
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| page | integer | 是 |
| page_size | integer | 是 |
| total | integer | 是 |
| total_pages | integer | 是 |
| sort_by | string | 是 |
| sort_order | string | 是 |
| has_next | boolean | 是 |

## 3. AUTH

#### SCH-AUTH-LOGIN-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| username | string | 是 | 3~64 |
| password | string | 是 | 8~128 |

#### SCH-AUTH-LOGIN-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| access_token | string | 是 |
| refresh_token | string | 是 |
| expires_in | integer | 是 |
| user | object(SCH-USER-SUMMARY) | 是 |

#### SCH-AUTH-REFRESH-REQ
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| refresh_token | string | 是 |

#### SCH-AUTH-REFRESH-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| access_token | string | 是 |
| refresh_token | string | 是 |
| expires_in | integer | 是 |

#### SCH-AUTH-ME-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| org_id | uuid | 是 |
| username | string | 是 |
| display_name | string | 是 |
| roles | array(string) | 是 |
| permissions | array(string) | 是 |
| data_scope | enum | 是 |

## 4. ORG / USR

#### SCH-USER-SUMMARY
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| org_id | uuid | 是 |
| username | string | 是 |
| display_name | string | 是 |
| email | string | 否 |
| mobile | string | 否 |
| status | enum | 是 (`active/inactive/locked`) |
| department_id | uuid | 否 |
| roles | array(string) | 是 |

#### SCH-USR-LIST-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| keyword | string | 否 | <=64 |
| status | enum | 否 | `active/inactive/locked` |
| department_id | uuid | 否 | - |
| page/page_size/sort_by/sort_order | - | 否 | 继承 SCH-PAGE-QUERY；sort_by 允许 `created_at/display_name/status` |

#### SCH-USR-LIST-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-USER-SUMMARY) | 是 |
| meta | object(SCH-LIST-META) | 是 |

#### SCH-USR-ROLE-PERMS-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| permission_ids | array(uuid) | 是 | minItems=1, unique |

#### SCH-USR-ROLE-PERMS-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| role_id | uuid | 是 |
| permission_ids | array(uuid) | 是 |
| updated_at | datetime | 是 |

#### SCH-ORG-UPDATE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| name | string | 是 | 2~128 |
| timezone | string | 是 | IANA TZ |
| locale | string | 是 | 2~16 |
| status | enum | 是 | `active/disabled` |

#### SCH-ORG-UPDATE-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| code | string | 是 |
| name | string | 是 |
| timezone | string | 是 |
| locale | string | 是 |
| status | string | 是 |
| version | integer | 是 |
| updated_at | datetime | 是 |

#### SCH-USR-STATUS-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| status | enum | 是 | `active/inactive/locked` |
| reason | string | 否 | <=255 |

#### SCH-USR-ROLE-LIST-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| keyword | string | 否 | <=64 |
| page/page_size/sort_by/sort_order | - | 否 | sort_by 允许 `created_at/name/code` |

#### SCH-USR-ROLE-SUMMARY
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| code | string | 是 |
| name | string | 是 |
| data_scope | enum | 是 (`self/team/org`) |
| is_default | boolean | 是 |
| permission_ids | array(uuid) | 是 |
| version | integer | 是 |
| updated_at | datetime | 是 |

#### SCH-USR-ROLE-LIST-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-USR-ROLE-SUMMARY) | 是 |
| meta | object(SCH-LIST-META) | 是 |

#### SCH-USR-PERMISSION-LIST-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| module | string | 否 | <=32 |
| keyword | string | 否 | <=64 |

#### SCH-USR-PERMISSION
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| perm_id | string | 是 |
| module | string | 是 |
| action | string | 是 |
| description | string | 否 |

#### SCH-USR-PERMISSION-LIST-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-USR-PERMISSION) | 是 |

#### SCH-ORG-DEPT-LIST-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| parent_id | uuid | 否 | - |
| keyword | string | 否 | <=64 |
| is_active | boolean | 否 | - |

#### SCH-ORG-DEPT-DETAIL-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| org_id | uuid | 是 |
| parent_id | uuid | 否 |
| code | string | 是 |
| name | string | 是 |
| manager_user_id | uuid | 否 |
| sort_order | integer | 是 |
| is_active | boolean | 是 |
| version | integer | 是 |
| updated_at | datetime | 是 |

#### SCH-ORG-DEPT-LIST-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-ORG-DEPT-DETAIL-RESP) | 是 |

#### SCH-ORG-DEPT-CREATE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| parent_id | uuid | 否 | - |
| code | string | 是 | 2~64 |
| name | string | 是 | 2~128 |
| manager_user_id | uuid | 否 | - |
| sort_order | integer | 否 | 默认 0 |
| is_active | boolean | 否 | 默认 true |

#### SCH-ORG-DEPT-UPDATE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| parent_id | uuid | 否 | - |
| name | string | 否 | 2~128 |
| manager_user_id | uuid | 否 | - |
| sort_order | integer | 否 | - |
| is_active | boolean | 否 | - |

## 5. CM（客户）

#### SCH-CM-LIST-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| keyword | string | 否 | <=128 |
| status | array(enum) | 否 | `potential/active/silent/lost` |
| owner_user_id | uuid | 否 | - |
| industry | string | 否 | <=64 |
| page/page_size/sort_by/sort_order | - | 否 | sort_by 允许 `created_at/updated_at/name/status` |

#### SCH-CM-SUMMARY
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| name | string | 是 |
| owner_user_id | uuid | 是 |
| status | enum | 是 |
| industry | string | 否 |
| updated_at | datetime | 是 |
| version | integer | 是 |

#### SCH-CM-LIST-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-CM-SUMMARY) | 是 |
| meta | object(SCH-LIST-META) | 是 |

#### SCH-CM-CREATE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| name | string | 是 | 2~128 |
| owner_user_id | uuid | 是 | - |
| industry | string | 否 | <=64 |
| level | enum | 否 | `A/B/C/D` |
| phone | string | 否 | <=32 |
| email | string | 否 | email |
| address | string | 否 | <=255 |
| remark | string | 否 | <=1000 |

#### SCH-CM-UPDATE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| name | string | 否 | 2~128 |
| owner_user_id | uuid | 否 | - |
| industry | string | 否 | <=64 |
| level | enum | 否 | `A/B/C/D` |
| phone | string | 否 | <=32 |
| email | string | 否 | email |
| address | string | 否 | <=255 |
| remark | string | 否 | <=1000 |

#### SCH-CM-STATUS-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| status | enum | 是 | `potential/active/silent/lost` |
| reason | string | 否 | <=255 |

#### SCH-CM-DETAIL-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| org_id | uuid | 是 |
| name | string | 是 |
| owner_user_id | uuid | 是 |
| status | enum | 是 |
| industry | string | 否 |
| level | string | 否 |
| phone | string | 否 |
| email | string | 否 |
| address | string | 否 |
| remark | string | 否 |
| created_at | datetime | 是 |
| updated_at | datetime | 是 |
| version | integer | 是 |

## 6. LM（线索）

#### SCH-LM-LIST-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| keyword | string | 否 | <=128 |
| status | array(enum) | 否 | `new/assigned/following/converted/invalid` |
| source | array(string) | 否 | <=32 |
| owner_user_id | uuid | 否 | - |
| next_follow_from | datetime | 否 | - |
| next_follow_to | datetime | 否 | - |
| page/page_size/sort_by/sort_order | - | 否 | sort_by 允许 `created_at/updated_at/next_follow_up_at/status` |

#### SCH-LM-SUMMARY
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| name | string | 是 |
| source | string | 是 |
| owner_user_id | uuid | 否 |
| status | enum | 是 |
| next_follow_up_at | datetime | 否 |
| version | integer | 是 |

#### SCH-LM-LIST-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-LM-SUMMARY) | 是 |
| meta | object(SCH-LIST-META) | 是 |

#### SCH-LM-CREATE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| name | string | 是 | 2~128 |
| source | string | 是 | 2~32 |
| contact_name | string | 否 | <=64 |
| phone | string | 否 | <=32 |
| email | string | 否 | email |
| owner_user_id | uuid | 否 | - |
| next_follow_up_at | datetime | 否 | - |

#### SCH-LM-ASSIGN-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| assignee_user_id | uuid | 是 | - |

#### SCH-LM-FOLLOWUP-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| follow_type | enum | 是 | `call/message/visit/other` |
| content | string | 是 | 1~2000 |
| next_follow_time | datetime | 否 | - |

#### SCH-LM-FOLLOWUP-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| lead_id | uuid | 是 |
| follow_type | enum | 是 |
| content | string | 是 |
| next_follow_time | datetime | 否 |
| created_at | datetime | 是 |
| created_by | uuid | 否 |

#### SCH-LM-CONVERT-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| opportunity.name | string | 是 | 2~128 |
| opportunity.amount | number | 是 | >=0 |
| opportunity.currency | string | 否 | 默认 CNY |
| opportunity.expected_close_date | date | 否 | - |
| opportunity.owner_user_id | uuid | 否 | 默认当前线索 owner |

#### SCH-LM-CONVERT-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| lead_id | uuid | 是 |
| opportunity_id | uuid | 是 |
| lead_status | enum | 是 (`converted`) |
| opportunity_stage | enum | 是 (`discovery`) |

#### SCH-LM-DETAIL-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| org_id | uuid | 是 |
| name | string | 是 |
| source | string | 是 |
| contact_name | string | 否 |
| phone | string | 否 |
| email | string | 否 |
| owner_user_id | uuid | 否 |
| status | enum | 是 |
| converted_opportunity_id | uuid | 否 |
| next_follow_up_at | datetime | 否 |
| invalid_reason | string | 否 |
| created_at | datetime | 是 |
| updated_at | datetime | 是 |
| version | integer | 是 |

## 7. OM（商机）

#### SCH-OM-LIST-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| keyword | string | 否 | <=128 |
| stage | array(enum) | 否 | `discovery/qualification/proposal/negotiation` |
| result | array(enum) | 否 | `won/lost` |
| owner_user_id | uuid | 否 | - |
| customer_id | uuid | 否 | - |
| amount_min | number | 否 | >=0 |
| amount_max | number | 否 | >=0 |
| page/page_size/sort_by/sort_order | - | 否 | sort_by 允许 `created_at/updated_at/amount/stage` |

#### SCH-OM-SUMMARY
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| customer_id | uuid | 是 |
| name | string | 是 |
| amount | number | 是 |
| stage | enum | 是 |
| result | enum | 否 |
| owner_user_id | uuid | 是 |
| updated_at | datetime | 是 |
| version | integer | 是 |

#### SCH-OM-LIST-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-OM-SUMMARY) | 是 |
| meta | object(SCH-LIST-META) | 是 |

#### SCH-OM-CREATE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| customer_id | uuid | 是 | - |
| lead_id | uuid | 否 | - |
| name | string | 是 | 2~128 |
| amount | number | 是 | >=0 |
| currency | string | 否 | 默认 CNY |
| owner_user_id | uuid | 是 | - |
| expected_close_date | date | 否 | - |

#### SCH-OM-UPDATE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| name | string | 否 | 2~128 |
| amount | number | 否 | >=0 |
| owner_user_id | uuid | 否 | - |
| expected_close_date | date | 否 | - |

#### SCH-OM-STAGE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| stage | enum | 是 | `discovery/qualification/proposal/negotiation` |
| note | string | 否 | <=255 |

#### SCH-OM-RESULT-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| result | enum | 是 | `won/lost` |
| reason | string | 否 | <=255 |

#### SCH-OM-DETAIL-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| org_id | uuid | 是 |
| customer_id | uuid | 是 |
| lead_id | uuid | 否 |
| name | string | 是 |
| amount | number | 是 |
| currency | string | 是 |
| stage | enum | 是 |
| result | enum | 否 |
| owner_user_id | uuid | 是 |
| expected_close_date | date | 否 |
| loss_reason | string | 否 |
| created_at | datetime | 是 |
| updated_at | datetime | 是 |
| version | integer | 是 |

## 8. CNV（会话）

#### SCH-CNV-LIST-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| status | array(enum) | 否 | `queued/active/closed` |
| channel_id | uuid | 否 | - |
| assignee_user_id | uuid | 否 | - |
| customer_id | uuid | 否 | - |
| keyword | string | 否 | <=128 |
| last_message_from | datetime | 否 | - |
| last_message_to | datetime | 否 | - |
| page/page_size/sort_by/sort_order | - | 否 | sort_by 允许 `last_message_at/created_at/status` |

#### SCH-CNV-SUMMARY
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| channel_id | uuid | 是 |
| customer_id | uuid | 否 |
| status | enum | 是 |
| assignee_user_id | uuid | 否 |
| last_message_at | datetime | 否 |
| version | integer | 是 |

#### SCH-CNV-LIST-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-CNV-SUMMARY) | 是 |
| meta | object(SCH-LIST-META) | 是 |

#### SCH-CNV-DETAIL-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| org_id | uuid | 是 |
| channel_id | uuid | 是 |
| customer_id | uuid | 否 |
| status | enum | 是 |
| assignee_user_id | uuid | 否 |
| accepted_at | datetime | 否 |
| closed_at | datetime | 否 |
| close_reason | string | 否 |
| last_message_at | datetime | 否 |
| version | integer | 是 |

#### SCH-CNV-MESSAGES-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| before_seq | integer | 否 | >0 |
| limit | integer | 否 | 默认 50，1~100 |

#### SCH-CNV-MESSAGE
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| conversation_id | uuid | 是 |
| seq_no | integer | 是 |
| sender_type | enum | 是 |
| sender_user_id | uuid | 否 |
| content_type | enum | 是 |
| content | string | 是 |
| attachments | array(json) | 是 |
| is_internal | boolean | 是 |
| client_msg_id | string | 否 |
| sent_at | datetime | 是 |

#### SCH-CNV-MESSAGES-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-CNV-MESSAGE) | 是 |
| meta.has_more | boolean | 是 |
| meta.next_before_seq | integer | 否 |

#### SCH-CNV-SEND-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| content_type | enum | 是 | `text/image/file/template` |
| content | string | 是 | text 类型 1~4000 |
| attachments | array(json) | 否 | 默认 [] |
| client_msg_id | string | 否 | <=64 |
| is_internal | boolean | 否 | 默认 false |

#### SCH-CNV-SEND-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| message | object(SCH-CNV-MESSAGE) | 是 |
| conversation_version | integer | 是 |

#### SCH-CNV-ACCEPT-REQ
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| version | integer | 是 |

#### SCH-CNV-TRANSFER-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| target_user_id | uuid | 是 | 同 org |
| reason | string | 否 | <=255 |

#### SCH-CNV-CLOSE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| close_reason | string | 是 | 1~255 |

#### SCH-CNV-CREATE-TICKET-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| title | string | 是 | 2~255 |
| description | string | 否 | <=4000 |
| priority | enum | 是 | `low/medium/high/urgent` |

## 9. TK（工单）

#### SCH-TK-LIST-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| status | array(enum) | 否 | `pending/assigned/processing/resolved/closed` |
| priority | array(enum) | 否 | `low/medium/high/urgent` |
| assignee_user_id | uuid | 否 | - |
| source_type | enum | 否 | `conversation/manual` |
| keyword | string | 否 | <=128 |
| page/page_size/sort_by/sort_order | - | 否 | sort_by 允许 `created_at/updated_at/priority/status` |

#### SCH-TK-SUMMARY
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| ticket_no | string | 是 |
| title | string | 是 |
| status | enum | 是 |
| priority | enum | 是 |
| assignee_user_id | uuid | 否 |
| updated_at | datetime | 是 |
| version | integer | 是 |

#### SCH-TK-LIST-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-TK-SUMMARY) | 是 |
| meta | object(SCH-LIST-META) | 是 |

#### SCH-TK-CREATE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| source_type | enum | 是 | `conversation/manual` |
| source_id | uuid | 否 | source_type=conversation 时必填 |
| title | string | 是 | 2~255 |
| description | string | 否 | <=4000 |
| priority | enum | 是 | `low/medium/high/urgent` |
| assignee_user_id | uuid | 否 | - |

#### SCH-TK-ASSIGN-REQ
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| version | integer | 是 |
| assignee_user_id | uuid | 是 |

#### SCH-TK-START-REQ
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| version | integer | 是 |

#### SCH-TK-RESOLVE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| solution | string | 是 | 1~4000 |

#### SCH-TK-CLOSE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| close_reason | string | 是 | 1~255 |

#### SCH-TK-DETAIL-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| org_id | uuid | 是 |
| ticket_no | string | 是 |
| source_type | string | 是 |
| source_id | uuid | 否 |
| title | string | 是 |
| description | string | 否 |
| status | enum | 是 |
| priority | enum | 是 |
| assignee_user_id | uuid | 否 |
| reporter_user_id | uuid | 否 |
| sla_due_at | datetime | 否 |
| resolved_at | datetime | 否 |
| closed_at | datetime | 否 |
| close_reason | string | 否 |
| created_at | datetime | 是 |
| updated_at | datetime | 是 |
| version | integer | 是 |

## 10. TSK（任务）

#### SCH-TSK-LIST-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| status | array(enum) | 否 | `pending/in_progress/completed/cancelled` |
| priority | array(enum) | 否 | `low/medium/high` |
| assignee_user_id | uuid | 否 | - |
| due_from | datetime | 否 | - |
| due_to | datetime | 否 | - |
| keyword | string | 否 | <=128 |
| page/page_size/sort_by/sort_order | - | 否 | sort_by 允许 `created_at/updated_at/due_at/priority/status` |

#### SCH-TSK-SUMMARY
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| title | string | 是 |
| status | enum | 是 |
| priority | enum | 是 |
| assignee_user_id | uuid | 是 |
| due_at | datetime | 否 |
| version | integer | 是 |

#### SCH-TSK-LIST-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-TSK-SUMMARY) | 是 |
| meta | object(SCH-LIST-META) | 是 |

#### SCH-TSK-CREATE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| title | string | 是 | 2~255 |
| description | string | 否 | <=4000 |
| priority | enum | 否 | `low/medium/high` 默认 medium |
| assignee_user_id | uuid | 是 | - |
| due_at | datetime | 否 | - |
| source_type | enum | 否 | `manual/lead/opportunity/ticket/conversation/system` |
| source_id | uuid | 否 | - |

#### SCH-TSK-UPDATE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| title | string | 否 | 2~255 |
| description | string | 否 | <=4000 |
| priority | enum | 否 | `low/medium/high` |
| assignee_user_id | uuid | 否 | - |
| due_at | datetime | 否 | - |

#### SCH-TSK-STATUS-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| status | enum | 是 | `pending/in_progress/completed/cancelled` |
| reason | string | 否 | <=255 |

#### SCH-TSK-DETAIL-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| org_id | uuid | 是 |
| title | string | 是 |
| description | string | 否 |
| status | enum | 是 |
| priority | enum | 是 |
| assignee_user_id | uuid | 是 |
| creator_user_id | uuid | 否 |
| due_at | datetime | 否 |
| completed_at | datetime | 否 |
| source_type | string | 是 |
| source_id | uuid | 否 |
| created_at | datetime | 是 |
| updated_at | datetime | 是 |
| version | integer | 是 |

## 11. NTF / CHN

#### SCH-NTF-LIST-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| is_read | boolean | 否 | - |
| type | array(enum) | 否 | `system/business/alert` |
| page/page_size/sort_by/sort_order | - | 否 | sort_by 允许 `created_at/read_at` |

#### SCH-NTF-DETAIL-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| user_id | uuid | 是 |
| type | string | 是 |
| title | string | 是 |
| content | string | 是 |
| is_read | boolean | 是 |
| read_at | datetime | 否 |
| source_type | string | 否 |
| source_id | uuid | 否 |
| created_at | datetime | 是 |

#### SCH-NTF-LIST-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-NTF-DETAIL-RESP) | 是 |
| meta | object(SCH-LIST-META) | 是 |

#### SCH-NTF-READ-REQ
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| read_at | datetime | 否 |

#### SCH-CHN-LIST-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| type | array(enum) | 否 | `webchat/wechat/whatsapp/facebook/custom` |
| status | array(enum) | 否 | `enabled/disabled` |
| keyword | string | 否 | <=64 |
| page/page_size/sort_by/sort_order | - | 否 | sort_by 允许 `created_at/updated_at/name/status` |

#### SCH-CHN-DETAIL-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| org_id | uuid | 是 |
| name | string | 是 |
| type | string | 是 |
| status | string | 是 |
| callback_url | string | 否 |
| config | json | 是 |
| version | integer | 是 |
| created_at | datetime | 是 |
| updated_at | datetime | 是 |

#### SCH-CHN-LIST-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-CHN-DETAIL-RESP) | 是 |
| meta | object(SCH-LIST-META) | 是 |

#### SCH-CHN-CREATE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| name | string | 是 | 2~64 |
| type | enum | 是 | `webchat/wechat/whatsapp/facebook/custom` |
| status | enum | 否 | 默认 enabled |
| callback_url | string | 否 | url |
| config | json | 是 | 渠道配置 |
| secret | string | 否 | <=128（服务端加密） |

#### SCH-CHN-UPDATE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| name | string | 否 | 2~64 |
| status | enum | 否 | `enabled/disabled` |
| callback_url | string | 否 | url |
| config | json | 否 | - |
| secret | string | 否 | <=128 |

## 12. AI / AUD / SYS

#### SCH-AI-SMART-REPLY-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| conversation_id | uuid | 是 | - |
| message_id | uuid | 是 | 触发消息 |
| instruction | string | 否 | <=1000，用户附加指令 |
| language | string | 否 | 默认 zh-CN |

#### SCH-AI-TASK-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| org_id | uuid | 是 |
| conversation_id | uuid | 否 |
| trigger_message_id | uuid | 否 |
| task_type | string | 是 |
| status | enum | 是 |
| provider | string | 是 |
| model | string | 是 |
| prompt_template_id | string | 是 |
| prompt_vars | json | 是 |
| output_text | string | 否 |
| output_payload | json | 否 |
| error_code | string | 否 |
| error_message | string | 否 |
| token_input | integer | 是 |
| token_output | integer | 是 |
| cost_amount | number | 是 |
| currency | string | 是 |
| retry_count | integer | 是 |
| started_at | datetime | 否 |
| finished_at | datetime | 否 |
| created_at | datetime | 是 |
| updated_at | datetime | 是 |

#### SCH-AUD-LIST-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| action | string | 否 | <=64 |
| operator_id | uuid | 否 | - |
| target_type | string | 否 | <=64 |
| target_id | string | 否 | <=64 |
| result | enum | 否 | `success/failed` |
| date_from | datetime | 否 | - |
| date_to | datetime | 否 | - |
| page/page_size/sort_by/sort_order | - | 否 | sort_by 允许 `created_at` |

#### SCH-AUD-ITEM
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | integer | 是 |
| request_id | string | 是 |
| operator_id | uuid | 否 |
| api_id | string | 否 |
| action | string | 是 |
| target_type | string | 否 |
| target_id | string | 否 |
| result | string | 是 |
| error_code | string | 否 |
| created_at | datetime | 是 |

#### SCH-AUD-LIST-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-AUD-ITEM) | 是 |
| meta | object(SCH-LIST-META) | 是 |

#### SCH-SYS-DASHBOARD-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| date_from | date | 是 | - |
| date_to | date | 是 | date_to >= date_from |

#### SCH-SYS-DASHBOARD-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| customer_total | integer | 是 |
| lead_total | integer | 是 |
| opportunity_total | integer | 是 |
| opportunity_won_total | integer | 是 |
| open_ticket_total | integer | 是 |
| unread_notification_total | integer | 是 |
| ai_task_running_total | integer | 是 |

#### SCH-SYS-CONFIG-LIST-QUERY
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| module | string | 否 | <=32 |
| keyword | string | 否 | <=64 |
| page/page_size/sort_by/sort_order | - | 否 | sort_by 允许 `module/config_key/updated_at` |

#### SCH-SYS-CONFIG-DETAIL-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| id | uuid | 是 |
| org_id | uuid | 是 |
| module | string | 是 |
| config_key | string | 是 |
| value_type | enum | 是 |
| config_value | json | 是 |
| is_secret | boolean | 是 |
| description | string | 否 |
| version | integer | 是 |
| updated_at | datetime | 是 |

#### SCH-SYS-CONFIG-LIST-RESP
| 字段 | 类型 | 必填 |
| --- | --- | --- |
| items | array(SCH-SYS-CONFIG-DETAIL-RESP) | 是 |
| meta | object(SCH-LIST-META) | 是 |

#### SCH-SYS-CONFIG-UPDATE-REQ
| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| version | integer | 是 | >=1 |
| config_value | json | 是 | 与 value_type 匹配 |
| description | string | 否 | <=255 |

## 13. 字段校验补充
- 手机号：`^[0-9+\-]{6,32}$`。
- 用户名：`^[a-zA-Z0-9._-]{3,64}$`。
- PERM ID：`^PERM-[A-Z]+-[A-Z_]+$`。
- 金额字段最多两位小数。
- 所有字符串输入需去除首尾空白后再校验。

## 14. 示例 DTO 生成建议（NestJS）
- 每个 `SCH-*REQ` 对应一个 DTO 类。
- 可复用装饰器：`@IsUUID() @IsEnum() @IsOptional() @Length() @IsInt() @Min() @Max()`。
- 列表查询统一继承 `PageQueryDto`。

## 15. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-04-05 | 新增实现级 Schema 字典：支持 DTO/前端类型/自动化校验直接生成 |
