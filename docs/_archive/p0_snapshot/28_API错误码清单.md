# MOY API 错误码清单

## 1. 文档元信息
| 属性 | 内容 |
| --- | --- |
| 文档编号 | MOY_ERR_001 |
| 文档版本 | v3.0 |
| 文档状态 | 已确认（实现级冻结） |
| 日期 | 2026-04-05 |
| 上游输入 | `11_API_接口设计说明.md`、`27_状态机实现规范.md`、`29_WebSocket协议规范.md` |

## 2. 返回规范
- 错误响应统一：`code/message/request_id/error.field/error.detail`。
- 业务错误不允许 `200` 包错。

## 3. 错误码总表（含可重试分类）
| 错误码 | HTTP | 可重试 | 说明 |
| --- | --- | --- | --- |
| AUTH_UNAUTHORIZED | 401 | 否 | 未认证或 token 无效 |
| AUTH_TOKEN_EXPIRED | 401 | 是（刷新后） | token 过期 |
| AUTH_FORBIDDEN | 403 | 否 | 权限不足或数据范围不符 |
| RESOURCE_NOT_FOUND | 404 | 否 | 资源不存在或不可见 |
| PARAM_INVALID | 400 | 否 | 参数校验失败 |
| CONFLICT_VERSION | 409 | 是（刷新后） | 乐观锁版本冲突 |
| DUPLICATE_REQUEST | 409 | 否 | 幂等键重复提交 |
| STATUS_TRANSITION_INVALID | 422 | 否 | 状态机非法流转 |
| OM_RESULT_INVALID | 422 | 否 | 商机结果非 won/lost |
| CNV_TRANSFER_TARGET_INVALID | 422 | 否 | 转接目标不合法 |
| TK_STATUS_INVALID | 422 | 否 | 工单状态非法 |
| AI_TASK_TIMEOUT | 504 | 是（建议重试） | AI 超时 |
| AI_PROVIDER_CIRCUIT_OPEN | 503 | 是（延迟重试） | AI 熔断中 |
| AI_OUTPUT_INVALID | 502 | 否 | AI 输出结构不合法 |
| RATE_LIMITED | 429 | 是（退避） | 触发频控 |
| INTERNAL_ERROR | 500 | 是（有限重试） | 未分类服务端错误 |
| WS_UNAUTHORIZED | 4401 | 是（重连后认证） | WS 认证失败 |
| WS_FORBIDDEN | 4403 | 否 | WS 频道权限不足 |
| WS_INVALID_EVENT | 4400 | 否 | WS 事件格式非法 |
| WS_RATE_LIMITED | 4429 | 是（退避） | WS 频控 |
| WS_HEARTBEAT_TIMEOUT | 4508 | 是（重连） | WS 心跳超时 |

## 4. 错误码 -> API -> 场景映射
| 错误码 | API ID | 典型场景 |
| --- | --- | --- |
| AUTH_UNAUTHORIZED | API-AUTH-001/002/003 及所有受保护 API | token 缺失/无效 |
| AUTH_FORBIDDEN | 所有带 PERM 的 API | 权限不足或跨租户访问 |
| PARAM_INVALID | 全量 API | DTO 校验失败 |
| RESOURCE_NOT_FOUND | API-CM-003/004/005, API-LM-003~006, API-OM-003~006, API-CNV-002~008, API-TK-003~007, API-TSK-003/004, API-ORG-002/005 | id 不存在或不可见 |
| CONFLICT_VERSION | API-ORG-001/005, API-CM-004/005, API-OM-004/005/006, API-CNV-004~008, API-TK-004~007, API-TSK-003/004, API-CHN-003, API-SYS-003 | version 不匹配 |
| DUPLICATE_REQUEST | API-ORG-004, API-CM-002, API-LM-002/004/005, API-OM-002, API-CNV-004/008, API-TK-002, API-TSK-002, API-CHN-002, API-AI-001 | 幂等键重复 |
| STATUS_TRANSITION_INVALID | API-CM-005, API-LM-003/004/005, API-OM-005/006, API-CNV-004~007, API-TK-004~007, API-TSK-004 | 非法状态流转 |
| OM_RESULT_INVALID | API-OM-006 | result 传入 win/lose 等非法值 |
| CNV_TRANSFER_TARGET_INVALID | API-CNV-006 | 目标用户不可转接 |
| TK_STATUS_INVALID | API-TK-004~007 | 工单流转不符 SM-ticket |
| AI_TASK_TIMEOUT | API-AI-001 | Provider 超时 |
| AI_OUTPUT_INVALID | API-AI-001 | 输出 schema 校验失败 |
| RATE_LIMITED | API-AI-001、高频写接口 | 频率超阈值 |

## 5. 前端展示策略
| 错误码分类 | 展示方式 | 用户动作建议 |
| --- | --- | --- |
| AUTH_* | 全局跳转登录或无权限页 | 重新登录/联系管理员 |
| PARAM_INVALID | 表单字段错误提示 | 修正输入后提交 |
| CONFLICT_VERSION | 弹窗提示“数据已更新” | 刷新后重试 |
| STATUS_TRANSITION_INVALID | 操作区提示状态冲突 | 刷新详情，按新状态操作 |
| RATE_LIMITED | toast 警告 | 等待后自动重试 |
| AI_TASK_TIMEOUT/AI_PROVIDER_CIRCUIT_OPEN | 会话页警告 + 保留输入框 | 改为人工回复或稍后重试 |
| INTERNAL_ERROR | 通用错误页/消息 | 重试一次，失败后上报 request_id |

## 6. 表单字段错误映射
- `error.field` 映射到同名 FormItem。
- 常见映射：
  - `status` -> 状态选择器
  - `result` -> 商机结果单选
  - `assignee_user_id` -> 人员选择器
  - `config_value` -> 配置编辑器

## 7. 权限错误映射
| 场景 | 返回码 | 前端行为 |
| --- | --- | --- |
| 页面访问无权限 | AUTH_FORBIDDEN | 渲染 403 页面 |
| 按钮操作无权限 | AUTH_FORBIDDEN | 禁止点击并提示“无操作权限” |
| 跨租户数据访问 | AUTH_FORBIDDEN/RESOURCE_NOT_FOUND | 不暴露真实资源存在性 |

## 8. 状态流转错误映射
| 实体 | 典型错误码 | 示例 |
| --- | --- | --- |
| customer | STATUS_TRANSITION_INVALID | `lost -> active` |
| lead | STATUS_TRANSITION_INVALID | `converted -> assigned` |
| opportunity | STATUS_TRANSITION_INVALID / OM_RESULT_INVALID | `discovery -> proposal`、`result=win` |
| conversation | STATUS_TRANSITION_INVALID | `closed -> accept` |
| ticket | TK_STATUS_INVALID / STATUS_TRANSITION_INVALID | `pending -> resolved` |
| task | STATUS_TRANSITION_INVALID | `completed -> in_progress` |

## 9. AI 错误与降级映射
| 错误码 | 后端行为 | 前端行为 |
| --- | --- | --- |
| AI_TASK_TIMEOUT | ai_task=failed | toast 提示并保留人工输入 |
| AI_PROVIDER_CIRCUIT_OPEN | 快速失败 | 提示“AI 服务暂不可用” |
| AI_OUTPUT_INVALID | ai_task=failed + 记录原始输出摘要 | 提示“AI 结果不可用，请手动回复” |

## 10. WebSocket 错误映射
| WS 错误码 | 场景 | 前端处理 |
| --- | --- | --- |
| WS_UNAUTHORIZED | token 失效 | 刷新 token 或跳转登录 |
| WS_FORBIDDEN | 订阅越权 | 取消频道订阅并提示 |
| WS_INVALID_EVENT | payload 不合法 | 记录日志并忽略 |
| WS_RATE_LIMITED | 高频订阅/重连 | 退避重试 |
| WS_HEARTBEAT_TIMEOUT | 心跳超时 | 自动重连并补拉数据 |

## 11. 测试要求
- 每个业务错误码至少 1 条自动化用例。
- 所有状态机非法流转都要命中对应错误码。
- AI 超时与降级路径必须覆盖。

## 12. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v3.0 | 2026-04-05 | 升级为实现级错误码规范：补齐 API 映射、前端策略、可重试分类、字段/权限/状态机/AI/WS 映射 |
| v2.0 | 2026-04-05 | 错误码收口，与 API/状态机一致 |
