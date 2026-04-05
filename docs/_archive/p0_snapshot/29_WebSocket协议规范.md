# MOY WebSocket 协议规范

## 1. 文档元信息
| 属性 | 内容 |
| --- | --- |
| 文档编号 | MOY_WS_001 |
| 文档版本 | v3.0 |
| 文档状态 | 已确认（实现级冻结） |
| 日期 | 2026-04-05 |
| 上游输入 | `11_API_接口设计说明.md`、`27_状态机实现规范.md` |
| 下游约束 | WebSocket Gateway、前端实时 Store、联调测试 |

## 2. 范围与原则
- WebSocket 仅用于实时事件通知，不执行业务写操作。
- 所有写操作必须走 HTTP API。
- 所有事件必须携带 `org_id`，并通过 token 校验租户与权限。

## 3. 连接协议

### 3.1 连接地址
- `wss://{host}/ws`

### 3.2 认证
- 客户端在握手携带 `Authorization: Bearer <token>`。
- token 无效时断开并返回 `WS_UNAUTHORIZED`。

### 3.3 连接生命周期
1. `CONNECTING`：发起握手。
2. `AUTHENTICATED`：认证通过，建立会话上下文（user_id/org_id/permissions）。
3. `SUBSCRIBED`：完成频道订阅。
4. `ACTIVE`：正常收发事件。
5. `STALE`：超过心跳窗口未响应。
6. `CLOSED`：主动或被动断开。

### 3.4 心跳
- 服务端每 25 秒发送 `ping`。
- 客户端 10 秒内返回 `pong`。
- 连续 2 个周期无响应，服务端关闭连接并标记 `WS_HEARTBEAT_TIMEOUT`。

### 3.5 断线重连
- 退避策略：`1s -> 2s -> 5s -> 10s -> 20s`（上限 20s）。
- 重连后自动恢复订阅。
- 恢复订阅时携带 `last_event_seq`，服务端按需补发。

## 4. 消息信封（统一）
```json
{
  "event_id": "evt_01HXYZ...",
  "event": "conversation.message.created",
  "org_id": "a4f1e0d2-0fce-4f6f-8f86-7f6f5a7f6e2d",
  "channel": "conversation.8eec5f1f-0d4b-4e71-b363-90f3fbe47b95",
  "seq": 1203,
  "request_id": "req_8cb6...",
  "ts": "2026-04-05T12:00:00Z",
  "data": {}
}
```

字段说明：
- `event_id`：全局唯一事件 ID（幂等去重键）。
- `seq`：频道内单调递增序号（排序依据）。
- `org_id`：租户上下文。
- `request_id`：与 HTTP 请求链路关联。

## 5. 订阅与退订

### 5.1 订阅请求
```json
{ "action": "subscribe", "channels": ["conversation.{id}", "ticket.{id}"] }
```

### 5.2 退订请求
```json
{ "action": "unsubscribe", "channels": ["ticket.{id}"] }
```

### 5.3 频道规则
| 频道 | 说明 | 权限校验 |
| --- | --- | --- |
| `conversation.{id}` | 会话消息与会话状态 | `PERM-CNV-VIEW` + 数据范围 |
| `ticket.{id}` | 工单状态变化 | `PERM-TK-VIEW` + 数据范围 |
| `notification.user.{id}` | 用户通知 | `PERM-NTF-VIEW` 且 user_id 匹配 |
| `dashboard.org.{id}` | 仪表盘增量 | `PERM-SYS-VIEW` |
| `ai.task.{id}` | AI 任务状态 | `PERM-AI-EXECUTE` + 数据范围 |

### 5.4 订阅失败码
| 错误码 | 含义 |
| --- | --- |
| WS_UNAUTHORIZED | 鉴权失败 |
| WS_FORBIDDEN | 无频道权限或数据范围不匹配 |
| WS_INVALID_CHANNEL | 频道名称非法 |
| WS_RATE_LIMITED | 订阅频率超限 |

## 6. 事件定义与 Payload Schema

### 6.1 `conversation.message.created`
触发：`API-CNV-004`
```json
{
  "conversation_id": "uuid",
  "message": {
    "id": "uuid",
    "seq_no": 99,
    "sender_type": "agent",
    "sender_user_id": "uuid",
    "content_type": "text",
    "content": "您好，我来协助您",
    "attachments": [],
    "sent_at": "2026-04-05T12:00:00Z"
  }
}
```

### 6.2 `conversation.status.changed`
触发：`API-CNV-005/006/007`
```json
{
  "conversation_id": "uuid",
  "from_status": "queued",
  "to_status": "active",
  "assignee_user_id": "uuid",
  "close_reason": null
}
```

### 6.3 `ticket.created`
触发：`API-CNV-008`、`API-TK-002`
```json
{
  "ticket": {
    "id": "uuid",
    "ticket_no": "TK202604050001",
    "source_type": "conversation",
    "source_id": "uuid",
    "status": "pending",
    "priority": "medium"
  }
}
```

### 6.4 `ticket.status.changed`
触发：`API-TK-004/005/006/007`
```json
{
  "ticket_id": "uuid",
  "from_status": "assigned",
  "to_status": "processing",
  "operator_id": "uuid",
  "note": null
}
```

### 6.5 `notification.created`
触发：通知中心写入
```json
{
  "notification": {
    "id": "uuid",
    "user_id": "uuid",
    "type": "business",
    "title": "工单已分配",
    "content": "您有新的工单待处理",
    "created_at": "2026-04-05T12:00:00Z"
  }
}
```

### 6.6 `ai.task.status.changed`
触发：`API-AI-001` 后台任务更新
```json
{
  "task_id": "uuid",
  "conversation_id": "uuid",
  "from_status": "running",
  "to_status": "succeeded",
  "output_text": "建议回复内容",
  "error_code": null
}
```

## 7. 幂等、去重与乱序处理

### 7.1 客户端去重
- 去重键优先级：`event_id` -> (`channel`,`seq`)。
- 若 `event_id` 已处理，直接丢弃。

### 7.2 乱序处理
- 维护 `last_seq[channel]`。
- 收到 `seq <= last_seq[channel]`：丢弃。
- 收到 `seq > last_seq[channel] + 1`：标记缺口并触发补拉（HTTP 查询最新快照）。

### 7.3 幂等消费
- Store reducer 必须具备幂等性（同一事件重复消费结果一致）。

## 8. 前端 Store 更新策略
| 页面 | 事件 | 更新策略 |
| --- | --- | --- |
| PAGE-CNV-001 | conversation.* | 更新对应行状态/最后消息时间 |
| PAGE-CNV-002 | conversation.message.created | 追加消息并滚动到底部（用户未上翻时） |
| PAGE-CNV-002 | conversation.status.changed | 刷新操作按钮显隐 |
| PAGE-TK-001 | ticket.created/ticket.status.changed | 更新/插入 ticket 行 |
| PAGE-TK-002 | ticket.status.changed | 刷新状态标签与操作区 |
| PAGE-NTF-001 | notification.created | 顶部插入通知并更新未读数 |
| PAGE-SYS-001 | notification/ticket/ai 事件 | 触发指标增量刷新 |

## 9. 服务端校验点（必须实现）
- 握手时校验 token 与 `org_id`。
- 订阅时校验频道资源所属 org。
- 发布事件前校验事件 `org_id` 与订阅连接 `org_id` 一致。
- 对每个事件附加 `event_id + seq`。

## 10. 错误码映射
| WS 错误码 | HTTP 对应 | 前端行为 |
| --- | --- | --- |
| WS_UNAUTHORIZED | AUTH_UNAUTHORIZED | 清理会话并跳转登录 |
| WS_FORBIDDEN | AUTH_FORBIDDEN | 停止订阅并提示无权限 |
| WS_INVALID_EVENT | PARAM_INVALID | 打印告警并忽略消息 |
| WS_RATE_LIMITED | RATE_LIMITED | 指数退避重试 |
| WS_HEARTBEAT_TIMEOUT | INTERNAL_ERROR | 自动重连并补拉数据 |

## 11. 测试要求
- 连接认证成功/失败。
- 订阅权限校验。
- 心跳超时断连与自动重连。
- 事件重复投递去重。
- 乱序事件补拉。

## 12. 版本记录
| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v3.0 | 2026-04-05 | 升级为实现级协议：补齐生命周期、心跳重连、订阅规则、幂等去重、乱序处理、payload schema、前端 store 更新 |
| v2.0 | 2026-04-05 | 协议冻结：统一频道、事件命名与 API 绑定关系 |
