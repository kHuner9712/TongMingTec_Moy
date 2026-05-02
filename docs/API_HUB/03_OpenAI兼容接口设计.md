# MOY API OpenAI 兼容接口设计

## 1. 文档用途

本文档定义 MOY API 的 OpenAI 兼容 Chat Completions 接口规格。供后端实现、前端联调、开发者文档编写参考。

## 2. 设计原则

1. **请求格式与 OpenAI API 完全兼容**：开发者无需修改现有 SDK 调用方式，只需替换 base_url 和 api_key
2. **响应格式与 OpenAI API 一致**：现有解析逻辑无需修改
3. **错误格式兼容**：错误返回结构与 OpenAI 一致，便于统一处理
4. **扩展字段以 `x-moy-` 前缀标识**：不与 OpenAI 标准字段冲突

## 3. 基础信息

| 项目 | 内容 |
| --- | --- |
| Base URL | `https://api.moy.com` |
| API Version | `v1` |
| 认证方式 | Bearer Token (API Key) |
| Content-Type | `application/json` |

## 4. Chat Completions

### 4.1 接口定义

```
POST /v1/chat/completions
```

### 4.2 Headers

| Header | 必填 | 说明 |
| --- | --- | --- |
| `Authorization` | 是 | `Bearer sk-moy-xxxxxxxx` |
| `Content-Type` | 是 | `application/json` |
| `X-MOY-Request-Id` | 否 | 客户端幂等键，建议 UUID，用于去重和链路追踪 |

### 4.3 Request Body

```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1024,
  "top_p": 1,
  "n": 1,
  "stop": null,
  "stream": false
}
```

#### 请求参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `model` | string | 是 | - | 模型标识，如 `gpt-4o`、`moonshot-v1-8k`。完整模型列表见 `GET /v1/models` |
| `messages` | array | 是 | - | 消息列表，标准 `[{role, content}]` 格式 |
| `messages[].role` | string | 是 | - | `system` / `user` / `assistant` |
| `messages[].content` | string | 是 | - | 消息内容文本 |
| `temperature` | number | 否 | 1.0 | 0-2 之间，越高越随机 |
| `max_tokens` | integer | 否 | 模型上限 | 限制输出 token 数 |
| `top_p` | number | 否 | 1.0 | nucleus sampling |
| `n` | integer | 否 | 1 | MVP 仅支持 1 |
| `stop` | string\|array | 否 | null | 停止词 |
| `stream` | boolean | 否 | false | MVP 阶段不支持，传入 `true` 返回错误提示 |

#### 模型选择

MOY API 使用自己的模型命名空间。支持的模型由 `/v1/models` 接口动态返回。模型 ID 格式：

- `gpt-4o` — OpenAI GPT-4o
- `gpt-4o-mini` — OpenAI GPT-4o mini
- `moonshot-v1-8k` — 月之暗面 Moonshot v1 8K
- `moonshot-v1-32k` — 月之暗面 Moonshot v1 32K
- `glm-4-flash` — 智谱 GLM-4 Flash
- `deepseek-chat` — DeepSeek Chat

实际可用模型以运行时 `/v1/models` 返回为准。

### 4.4 Response（成功）

```json
{
  "id": "chatcmpl-xxxxxxxx",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking. How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 18,
    "total_tokens": 38
  }
}
```

### 4.5 Response（错误）

错误返回兼容 OpenAI 错误格式：

```json
{
  "error": {
    "message": "Incorrect API key provided. Check your API key in the Authorization header.",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

#### 错误码映射

| HTTP Status | OpenAI Error Type | 触发条件 |
| --- | --- | --- |
| 400 | `invalid_request_error` | 请求参数格式错误 / model 不存在 |
| 401 | `invalid_api_key` | API Key 无效、已禁用、格式错误 |
| 402 | `insufficient_quota` | 额度不足 |
| 429 | `rate_limit_exceeded` | 触发限流 / 额度耗尽 |
| 500 | `api_error` | 上游供应商错误 / 内部服务错误 |
| 502 | `upstream_error` | 上游供应商不可用 |
| 503 | `service_unavailable` | 模型维护中 |

## 5. 模型列表

### 5.1 接口定义

```
GET /v1/models
```

### 5.2 Headers

| Header | 必填 | 说明 |
| --- | --- | --- |
| `Authorization` | 是 | `Bearer sk-moy-xxxxxxxx` |

### 5.3 Response

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4o",
      "object": "model",
      "created": 1700000000,
      "owned_by": "openai",
      "display_name": "GPT-4o",
      "description": "OpenAI 最先进的多模态模型",
      "context_window": 128000,
      "max_output_tokens": 16384,
      "pricing": {
        "prompt_per_1k_tokens": 0.015,
        "completion_per_1k_tokens": 0.06,
        "currency": "CNY"
      },
      "status": "available"
    },
    {
      "id": "moonshot-v1-8k",
      "object": "model",
      "created": 1700000000,
      "owned_by": "moonshot",
      "display_name": "Moonshot v1 8K",
      "description": "月之暗面 Moonshot 模型，8K 上下文",
      "context_window": 8192,
      "max_output_tokens": 4096,
      "pricing": {
        "prompt_per_1k_tokens": 0.012,
        "completion_per_1k_tokens": 0.012,
        "currency": "CNY"
      },
      "status": "available"
    }
  ]
}
```

## 6. Stream 支持规划

MVP 阶段**不实现** stream。传入 `"stream": true` 时返回：

```json
{
  "error": {
    "message": "Streaming is not yet supported. It is planned for the next release.",
    "type": "invalid_request_error",
    "code": "stream_not_supported"
  }
}
```

Stream 将在 MVP+1 版本实现，采用标准 SSE（Server-Sent Events）格式，与 OpenAI 的 stream 响应 `data: {...}\n\n` + `data: [DONE]` 格式完全一致。

## 7. 转发处理流程

```
客户端请求
  │
  ▼
[1] 认证中间件
  │  从 Authorization header 提取 Bearer token
  │  SHA-256(token) → 查 api_key 表
  │  验证 enabled = true
  │  注入 project_id / user_id 到请求上下文
  │
  ▼
[2] 限流中间件
  │  按 api_key_id 检查 QPS
  │  超限返回 429
  │
  ▼
[3] 参数校验
  │  校验 model 是否存在且可用
  │  校验 messages 格式
  │  校验 temperature / max_tokens 范围
  │
  ▼
[4] 额度检查
  │  查询 api_quota_account
  │  余额 <= 0 返回 402
  │
  ▼
[5] 模型适配
  │  将 model 映射到 provider + upstream_model
  │  转换请求格式（如不同供应商的差异字段）
  │
  ▼
[6] 上游调用
  │  构造 OpenAI 格式请求
  │  发送到供应商 API
  │  接收响应
  │
  ▼
[7] 用量记录
  │  从响应提取 usage tokens
  │  计算成本 = tokens * 定价
  │  INSERT api_usage_log
  │  UPDATE api_quota_account (扣减)
  │  INSERT api_quota_ledger
  │
  ▼
[8] 响应返回
     返回 OpenAI 兼容格式的 JSON
```

### 含重试的超时策略

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| 上游超时 | 60s | 单次请求超时 |
| 重试次数 | 1 | 仅对 5xx 和网络错误重试 |
| 重试退避 | 指数退避 | 1s → 2s |

## 8. cURL 示例

```bash
# 获取模型列表
curl https://api.moy.com/v1/models \
  -H "Authorization: Bearer sk-moy-xxxxxxxx"

# 发送对话请求
curl https://api.moy.com/v1/chat/completions \
  -H "Authorization: Bearer sk-moy-xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "介绍一下 MOY API"}
    ],
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

## 9. Python SDK 示例

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.moy.com/v1",
    api_key="sk-moy-xxxxxxxx"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "介绍一下 MOY API"}
    ]
)

print(response.choices[0].message.content)
print(f"Tokens: {response.usage.total_tokens}")
```

## 10. Node.js SDK 示例

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.moy.com/v1',
  apiKey: 'sk-moy-xxxxxxxx',
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: '介绍一下 MOY API' }],
});

console.log(response.choices[0].message.content);
console.log(`Tokens: ${response.usage.total_tokens}`);
```
