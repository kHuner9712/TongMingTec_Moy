# MOY WebSocket 协议规范

## 1. 文档元信息
| 属性 | 内容 |
| --- | --- |
| 文档编号 | MOY_WS_001 |
| 文档版本 | v2.0 |
| 文档状态 | 已确认（冻结） |
| 日期 | 2026-04-05 |
| 上游输入 | `06_PRD`、`11_API`、`27_状态机实现规范` |

## 2. 连接与认证
- URL：`wss://{host}/ws`
- 认证：连接时携带 `token`（Bearer JWT）。
- 租户隔离：服务端按 token 中 `org_id` 隔离订阅域。

## 3. 消息结构
```json
{
  "event": "conversation.message.created",
  "request_id": "req_xxx",
  "ts": "2026-04-05T12:00:00Z",
  "data": {}
}
```

## 4. 频道定义
| 频道 | 用途 |
| --- | --- |
| `conversation.{id}` | 会话消息与状态变更 |
| `ticket.{id}` | 工单状态变更 |
| `notification.user.{id}` | 用户通知推送 |

## 5. 事件定义（P0）
| 事件名 | 触发来源 | 关联接口 |
| --- | --- | --- |
| `conversation.message.created` | 新消息写入 | API-CNV-004 |
| `conversation.status.changed` | 会话状态变化 | API-CNV-005/006/007 |
| `ticket.created` | 会话转工单或直接建单 | API-CNV-008/API-TK-002 |
| `ticket.status.changed` | 工单流转 | API-TK-004/005/006/007 |
| `notification.created` | 通知创建 | API-NTF-001 |
| `ai.task.status.changed` | AI任务状态变化 | API-AI-001/API-AI-002 |

## 6. 错误处理
| code | 含义 |
| --- | --- |
| `WS_UNAUTHORIZED` | token 无效 |
| `WS_FORBIDDEN` | 无频道权限 |
| `WS_INVALID_EVENT` | 事件格式非法 |
| `WS_RATE_LIMITED` | 频控触发 |

## 7. 约束
- 禁止通过 WebSocket 直接执行业务写操作；写操作必须走 HTTP API。
- WebSocket 仅用于实时通知与状态同步。

## 8. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v2.0 | 2026-04-05 | 协议冻结：统一频道、事件命名与 API 绑定关系 |
