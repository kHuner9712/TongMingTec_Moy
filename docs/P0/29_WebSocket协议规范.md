# MOY WebSocket 协议规范

---

## 文档元信息

| 属性 | 内容 |
|------|------|
| 文档名称 | MOY WebSocket 协议规范 |
| 文档编号 | MOY_WS_001 |
| 版本号 | v1.0 |
| 状态 | 已确认 |
| 作者 | MOY 文档架构组 |
| 日期 | 2026-04-05 |
| 目标读者 | 后端开发、前端开发 |
| 输入来源 | [API接口设计说明](./11_API_接口设计说明.md)、[HLD](./09_HLD_系统高层设计.md) |

---

## 一、文档目的

本文档定义 MOY 系统的 WebSocket 协议规范，用于：

1. 实时消息推送
2. 会话实时通信
3. 系统通知推送
4. 状态变更通知
5. AI对话流式输出

---

## 二、连接管理

### 2.1 连接地址

```
wss://api.moy.example.com/ws
```

### 2.2 认证方式

#### 2.2.1 连接时认证

```
wss://api.moy.example.com/ws?token={jwt_token}
```

#### 2.2.2 连接后认证

```json
{
  "type": "auth",
  "payload": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**认证成功响应：**

```json
{
  "type": "auth:success",
  "payload": {
    "userId": 1,
    "orgId": 1,
    "sessionId": "ws-abc123"
  }
}
```

**认证失败响应：**

```json
{
  "type": "auth:failed",
  "payload": {
    "code": "020203",
    "message": "Token无效"
  }
}
```

### 2.3 心跳机制

#### 2.3.1 客户端心跳

客户端每30秒发送心跳：

```json
{
  "type": "ping",
  "payload": {
    "timestamp": 1712304000000
  }
}
```

#### 2.3.2 服务端响应

```json
{
  "type": "pong",
  "payload": {
    "timestamp": 1712304000001
  }
}
```

#### 2.3.3 心跳超时

- 客户端超过60秒未收到pong响应，应主动重连
- 服务端超过90秒未收到ping请求，主动断开连接

### 2.4 重连机制

#### 2.4.1 重连策略

| 重连次数 | 延迟时间 |
|----------|----------|
| 1 | 1秒 |
| 2 | 2秒 |
| 3 | 4秒 |
| 4 | 8秒 |
| 5+ | 30秒 |

#### 2.4.2 重连流程

```typescript
class WebSocketClient {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onclose = (event) => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        setTimeout(() => this.connect(), delay);
        this.reconnectAttempts++;
      }
    };
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.authenticate();
    };
  }
}
```

---

## 三、消息格式

### 3.1 基础消息格式

```typescript
interface WebSocketMessage {
  type: string;
  id?: string;
  payload: any;
  timestamp?: number;
}
```

### 3.2 消息类型定义

| 类型 | 方向 | 说明 |
|------|------|------|
| ping | C→S | 心跳请求 |
| pong | S→C | 心跳响应 |
| auth | C→S | 认证请求 |
| auth:success | S→C | 认证成功 |
| auth:failed | S→C | 认证失败 |
| subscribe | C→S | 订阅频道 |
| unsubscribe | C→S | 取消订阅 |
| message | C→S / S→C | 业务消息 |
| notification | S→C | 系统通知 |
| event | S→C | 事件推送 |
| error | S→C | 错误消息 |

### 3.3 消息ID规范

消息ID用于请求-响应匹配：

```json
{
  "type": "message",
  "id": "msg-uuid-123",
  "payload": {
    "content": "Hello"
  }
}
```

响应消息携带相同的ID：

```json
{
  "type": "message:ack",
  "id": "msg-uuid-123",
  "payload": {
    "status": "success"
  }
}
```

---

## 四、订阅机制

### 4.1 频道定义

| 频道 | 说明 | 权限 |
|------|------|------|
| `org:{orgId}` | 组织频道 | 组织成员 |
| `user:{userId}` | 用户频道 | 用户本人 |
| `conversation:{conversationId}` | 会话频道 | 会话参与者 |
| `lead:{leadId}` | 线索频道 | 线索负责人 |
| `opportunity:{opportunityId}` | 商机频道 | 商机负责人 |
| `ticket:{ticketId}` | 工单频道 | 工单参与者 |

### 4.2 订阅请求

```json
{
  "type": "subscribe",
  "id": "sub-001",
  "payload": {
    "channels": [
      "org:1",
      "user:123",
      "conversation:456"
    ]
  }
}
```

### 4.3 订阅响应

```json
{
  "type": "subscribe:success",
  "id": "sub-001",
  "payload": {
    "channels": [
      "org:1",
      "user:123",
      "conversation:456"
    ]
  }
}
```

### 4.4 取消订阅

```json
{
  "type": "unsubscribe",
  "id": "unsub-001",
  "payload": {
    "channels": ["conversation:456"]
  }
}
```

---

## 五、业务场景

### 5.1 会话消息

#### 5.1.1 发送消息

```json
{
  "type": "message",
  "id": "msg-001",
  "payload": {
    "conversationId": 456,
    "contentType": "text",
    "content": "您好，请问有什么可以帮助您的？",
    "metadata": {}
  }
}
```

#### 5.1.2 消息确认

```json
{
  "type": "message:ack",
  "id": "msg-001",
  "payload": {
    "messageId": 789,
    "status": "delivered",
    "timestamp": 1712304000000
  }
}
```

#### 5.1.3 接收消息

```json
{
  "type": "message",
  "payload": {
    "id": 790,
    "conversationId": 456,
    "senderId": 999,
    "senderType": "customer",
    "contentType": "text",
    "content": "我想咨询一下产品价格",
    "timestamp": 1712304001000
  }
}
```

### 5.2 系统通知

#### 5.2.1 通知推送

```json
{
  "type": "notification",
  "payload": {
    "id": "ntf-001",
    "category": "lead",
    "title": "新线索分配",
    "content": "您有一个新线索待处理",
    "data": {
      "leadId": 123,
      "leadName": "张三"
    },
    "priority": "high",
    "createdAt": "2026-04-05T10:00:00Z"
  }
}
```

#### 5.2.2 通知类型

| category | 说明 |
|----------|------|
| lead | 线索相关 |
| opportunity | 商机相关 |
| customer | 客户相关 |
| ticket | 工单相关 |
| task | 任务相关 |
| system | 系统通知 |

### 5.3 状态变更事件

#### 5.3.1 状态变更推送

```json
{
  "type": "event",
  "payload": {
    "event": "status:changed",
    "entity": "lead",
    "entityId": 123,
    "data": {
      "from": "new",
      "to": "assigned",
      "operator": {
        "id": 1,
        "name": "管理员"
      }
    },
    "timestamp": 1712304000000
  }
}
```

#### 5.3.2 事件类型

| event | 说明 |
|-------|------|
| status:changed | 状态变更 |
| entity:created | 实体创建 |
| entity:updated | 实体更新 |
| entity:deleted | 实体删除 |
| assignment:changed | 分配变更 |

### 5.4 AI对话流式输出

#### 5.4.1 开始流式输出

```json
{
  "type": "ai:stream:start",
  "payload": {
    "taskId": "ai-task-001",
    "conversationId": 456
  }
}
```

#### 5.4.2 流式内容

```json
{
  "type": "ai:stream:chunk",
  "payload": {
    "taskId": "ai-task-001",
    "content": "您好",
    "index": 0
  }
}
```

```json
{
  "type": "ai:stream:chunk",
  "payload": {
    "taskId": "ai-task-001",
    "content": "，我是",
    "index": 1
  }
}
```

#### 5.4.3 流式结束

```json
{
  "type": "ai:stream:end",
  "payload": {
    "taskId": "ai-task-001",
    "fullContent": "您好，我是AI助手，请问有什么可以帮助您的？",
    "tokenCount": 15,
    "duration": 1200
  }
}
```

#### 5.4.4 流式错误

```json
{
  "type": "ai:stream:error",
  "payload": {
    "taskId": "ai-task-001",
    "code": "160506",
    "message": "AI响应超时"
  }
}
```

---

## 六、错误处理

### 6.1 错误消息格式

```json
{
  "type": "error",
  "id": "msg-001",
  "payload": {
    "code": "070502",
    "message": "会话非活跃状态",
    "details": {
      "conversationId": 456,
      "status": "closed"
    }
  }
}
```

### 6.2 常见错误码

| 错误码 | 说明 |
|--------|------|
| 020201 | 未认证 |
| 020203 | Token无效 |
| 020301 | 权限不足 |
| 010801 | 请求频率超限 |
| 070502 | 会话非活跃 |
| 070503 | 客服不在线 |

### 6.3 连接关闭码

| 代码 | 说明 |
|------|------|
| 1000 | 正常关闭 |
| 1001 | 端点离开 |
| 1003 | 不支持的数据类型 |
| 1008 | 策略违规 |
| 1009 | 消息过大 |
| 1011 | 内部错误 |
| 4000 | 认证失败 |
| 4001 | 会话过期 |
| 4002 | 重复连接 |
| 4003 | 被踢出 |

---

## 七、安全规范

### 7.1 连接安全

- 必须使用 WSS (WebSocket Secure)
- 必须验证 JWT Token
- 必须验证用户权限

### 7.2 消息安全

- 消息大小限制：最大 1MB
- 消息频率限制：每秒最多 100 条
- 必须验证频道订阅权限

### 7.3 频道权限验证

```typescript
async function validateChannelAccess(userId: bigint, channel: string): Promise<boolean> {
  const [type, id] = channel.split(':');
  
  switch (type) {
    case 'org':
      return await isOrgMember(userId, BigInt(id));
    case 'user':
      return userId === BigInt(id);
    case 'conversation':
      return await isConversationParticipant(userId, BigInt(id));
    case 'lead':
      return await isLeadOwner(userId, BigInt(id));
    default:
      return false;
  }
}
```

---

## 八、实现示例

### 8.1 前端实现

```typescript
class MoyWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, (payload: any) => void> = new Map();
  
  constructor(private url: string, private token: string) {}
  
  connect() {
    this.ws = new WebSocket(`${this.url}?token=${this.token}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.stopHeartbeat();
      this.scheduleReconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send('ping', { timestamp: Date.now() });
    }, 30000);
  }
  
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  private scheduleReconnect() {
    if (this.reconnectAttempts < 10) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => this.connect(), delay);
      this.reconnectAttempts++;
    }
  }
  
  send(type: string, payload: any, id?: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, id, payload, timestamp: Date.now() }));
    }
  }
  
  subscribe(channels: string[]) {
    this.send('subscribe', { channels });
  }
  
  unsubscribe(channels: string[]) {
    this.send('unsubscribe', { channels });
  }
  
  on(type: string, handler: (payload: any) => void) {
    this.messageHandlers.set(type, handler);
  }
  
  off(type: string) {
    this.messageHandlers.delete(type);
  }
  
  private handleMessage(message: WebSocketMessage) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.payload);
    }
  }
  
  disconnect() {
    this.stopHeartbeat();
    this.ws?.close(1000, 'Client disconnect');
  }
}
```

### 8.2 后端实现

```typescript
@WebSocketGateway({
  path: '/ws',
  cors: { origin: '*' },
})
export class MoyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  constructor(
    private authService: AuthService,
    private channelService: ChannelService,
    private messageService: MessageService,
  ) {}
  
  async handleConnection(client: WebSocket, request: IncomingMessage) {
    const token = this.extractToken(request);
    
    try {
      const user = await this.authService.verifyToken(token);
      client.userId = user.id;
      client.orgId = user.orgId;
      
      this.sendMessage(client, 'auth:success', {
        userId: user.id,
        orgId: user.orgId,
        sessionId: generateSessionId(),
      });
      
    } catch (error) {
      this.sendMessage(client, 'auth:failed', {
        code: '020203',
        message: 'Token无效',
      });
      client.close(4000, 'Authentication failed');
    }
  }
  
  async handleDisconnect(client: WebSocket) {
    await this.channelService.unsubscribeAll(client.userId);
  }
  
  @SubscribeMessage('ping')
  handlePing(client: WebSocket, payload: any) {
    this.sendMessage(client, 'pong', { timestamp: Date.now() });
  }
  
  @SubscribeMessage('subscribe')
  async handleSubscribe(client: WebSocket, payload: { channels: string[] }) {
    const results = [];
    
    for (const channel of payload.channels) {
      const hasAccess = await this.channelService.validateAccess(
        client.userId,
        channel
      );
      
      if (hasAccess) {
        await this.channelService.subscribe(client.userId, channel);
        results.push(channel);
      }
    }
    
    this.sendMessage(client, 'subscribe:success', { channels: results });
  }
  
  @SubscribeMessage('message')
  async handleMessage(client: WebSocket, payload: any) {
    const message = await this.messageService.create({
      ...payload,
      senderId: client.userId,
    });
    
    this.broadcastToChannel(
      `conversation:${payload.conversationId}`,
      'message',
      message
    );
    
    this.sendMessage(client, 'message:ack', {
      messageId: message.id,
      status: 'delivered',
    });
  }
  
  private sendMessage(client: WebSocket, type: string, payload: any) {
    client.send(JSON.stringify({
      type,
      payload,
      timestamp: Date.now(),
    }));
  }
  
  private broadcastToChannel(channel: string, type: string, payload: any) {
    this.channelService.broadcast(channel, { type, payload, timestamp: Date.now() });
  }
}
```

---

## 九、版本与变更记录

| 版本 | 日期 | 作者 | 变更摘要 | 状态 |
|------|------|------|----------|------|
| v1.0 | 2026-04-05 | MOY 文档架构组 | 初稿 | 已确认 |

---

## 十、依赖文档

| 文档 | 版本 | 用途 |
|------|------|------|
| [11_API_接口设计说明.md](./11_API_接口设计说明.md) | v2.0 | 接口设计 |
| [09_HLD_系统高层设计.md](./09_HLD_系统高层设计.md) | v1.0 | 架构设计 |
| [28_API错误码清单.md](./28_API错误码清单.md) | v1.0 | 错误码 |

---

## 十一、待确认事项

1. 是否需要支持消息持久化？
2. 是否需要支持离线消息推送？
3. 是否需要支持消息加密？
