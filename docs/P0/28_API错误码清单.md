# MOY API 错误码清单

## 1. 错误码规则
- 统一返回：`code/message/request_id`
- 业务错误不使用 200 包错

## 2. 通用错误码
| 错误码 | 含义 |
| --- | --- |
| AUTH_UNAUTHORIZED | 未认证 |
| AUTH_FORBIDDEN | 无权限 |
| PARAM_INVALID | 参数非法 |
| RESOURCE_NOT_FOUND | 资源不存在 |
| STATUS_TRANSITION_INVALID | 状态流转非法 |
| RATE_LIMITED | 频控触发 |
| INTERNAL_ERROR | 系统内部错误 |

## 3. 关键业务错误码
| 错误码 | 场景 |
| --- | --- |
| CNV_TRANSFER_TARGET_INVALID | 会话转接目标非法 |
| OM_RESULT_INVALID | 商机结果值非法（仅允许 won/lost） |
| TK_STATUS_INVALID | 工单状态流转非法 |
| AI_TASK_TIMEOUT | AI任务执行超时 |

## 4. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v2.0 | 2026-04-05 | 错误码收口，与 API/状态机一致 |
