# OpenAI 兼容入口 MVP 实现说明

> **实施日期**：2026-05-07
> **阶段**：MOY API Hub 第二阶段 — OpenAI-Compatible Entry MVP
> **前置**：[08_API_Hub_Foundation实现说明](./08_API_Hub_Foundation实现说明.md)

## 1. 本阶段范围

在 Foundation 基础上新增 OpenAI-compatible 对外入口：

| 接口 | 方法 | 路径 | 鉴权 |
| --- | --- | --- | --- |
| 模型列表 | `GET` | `/v1/models` | Bearer API Key |
| 聊天补全 | `POST` | `/v1/chat/completions` | Bearer API Key |

**核心边界**：
- 不接真实模型供应商，chat/completions 返回 mock response
- 不做 stream、function calling、tool calling
- 不做 fallback、缓存、billing/payment
- 不开发 sites/api 前端控制台
- 不影响 MOY App、MOY GEO、Foundation 管理接口

## 2. 全局前缀处理

在 `backend/src/main.ts` 中：

```typescript
app.setGlobalPrefix("api/v1", {
  exclude: ["v1/(.*)", "api/geo/(.*)"],
});
```

效果：

| 路径 | 是否被 Global Prefix 影响 |
| --- | --- |
| `/v1/models` | ❌ 排除，直接暴露 |
| `/v1/chat/completions` | ❌ 排除，直接暴露 |
| `/api/v1/api-hub/projects` | ✅ 正常加前缀 |
| `/api/geo/leads` | ❌ 排除（GEO 已有） |

## 3. API Key Bearer 鉴权

### 3.1 ApiKeyGuard

文件：`backend/src/modules/api-hub/guards/api-key.guard.ts`

流程：
1. 从 `Authorization: Bearer {token}` 提取 token
2. 校验 token 以 `moy_sk_` 开头
3. 调用 `ApiKeysService.validateAndFind(rawKey)` 验证
4. 通过后将 `apiKey` 对象挂载到 `req.apiKey`

不支持 JWT，这是专为开放接口设计的鉴权方式。管理接口仍走 JWT `JwtAuthGuard`。

### 3.2 错误响应格式

所有鉴权错误使用 OpenAI-compatible 格式：

```json
{
  "error": {
    "message": "Invalid API key",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

| 场景 | HTTP 状态码 | error.code |
| --- | --- | --- |
| 缺少 Authorization | 401 | `missing_api_key` |
| 格式非 Bearer 或 token 不以 moy_sk_ 开头 | 401 | `invalid_api_key_format` |
| key 无效 | 401 | `invalid_api_key` |
| key 已吊销 | 401 | `invalid_api_key` |
| key 已过期 | 401 | `api_key_expired` |

## 4. GET /v1/models

### 4.1 逻辑

1. ApiKeyGuard 鉴权通过
2. 根据 `apiKey.projectId` 查询 `ApiProjectModelsService.findEnabledModelsForProject()`
3. 只返回 `enabled = true` 的模型
4. 如果没有启用模型，返回空 `data` 数组

### 4.2 响应格式

```json
{
  "object": "list",
  "data": [
    {
      "id": "moy-mock-chat",
      "object": "model",
      "created": 1714500000,
      "owned_by": "moy"
    }
  ]
}
```

- `id`：使用 `api_models.model_id`
- `owned_by`：使用 `api_models.provider`，默认 `"moy"`

### 4.3 Controller

```typescript
@Controller("v1")
@UseGuards(ApiKeyGuard)
export class OpenaiCompatibleController {
  @Get("models")
  async listModels(@Req() req: any) {
    return this.service.listModelsForProject(req.apiKey.projectId);
  }
}
```

## 5. POST /v1/chat/completions

### 5.1 请求格式

```json
{
  "model": "moy-mock-chat",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "temperature": 0.7
}
```

### 5.2 校验规则

| 校验项 | 失败时 |
| --- | --- |
| `stream: true` | 400, `stream_not_supported` |
| `messages` 为空或缺少 role/content | 400, `invalid_messages` |
| model 未在项目中启用 | 403, `model_not_enabled` |
| 当月额度未配置 | 403, `quota_not_configured` |
| 当月额度已用完 | 403, `quota_exceeded` |

### 5.3 Mock 响应

```json
{
  "id": "chatcmpl_mock_xxx",
  "object": "chat.completion",
  "created": 1714500000,
  "model": "moy-mock-chat",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "This is a mock response from MOY API Hub. Real provider forwarding is not enabled in this MVP."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 32,
    "total_tokens": 42
  }
}
```

### 5.4 Service 流程

```
POST /v1/chat/completions
  │
  ├─[1] ApiKeyGuard：提取 + 验证 Bearer token
  ├─[2] stream 检查：stream=true → 400
  ├─[3] messages 校验：非空 + 每条有 role/content
  ├─[4] 模型启用校验：findEnabledModelByModelId()
  ├─[5] Token 估算：prompt = ceil(chars/4), completion = 32
  ├─[6] 额度检查：assertQuotaAvailable()
  ├─[7] 额度扣减：consumeQuota()
  ├─[8] 写入 UsageRecord：writeUsageAndQuota()
  └─[9] 返回 mock completion JSON
```

## 6. Token 估算规则

| token 类型 | 计算方式 |
| --- | --- |
| `prompt_tokens` | `max(1, ceil(所有 messages.content 字符数总和 / 4))` |
| `completion_tokens` | 固定 32 |
| `total_tokens` | `prompt_tokens + completion_tokens` |

## 7. 额度 (Quota) 规则

### 7.1 ApiQuotaService 新增方法

| 方法 | 职责 |
| --- | --- |
| `getCurrentMonthlyQuota(projectId, modelId)` | 查询当前月份的额度记录 |
| `assertQuotaAvailable(projectId, modelId, totalTokens)` | 检查额度存在且未超额，否则抛 `QuotaNotConfiguredError` 或 `QuotaExceededError` |
| `consumeQuota(projectId, modelId, totalTokens)` | 从 `quotaUsed` 中扣减 `totalTokens` |

### 7.2 额度单位

当前按 token 计，`quotaLimit` / `quotaUsed` 使用 bigint 存储。

## 8. 调用记录 (Usage Record) 规则

每次成功调用写入 `api_usage_records` 表：

| 字段 | 值 |
| --- | --- |
| `projectId` | `apiKey.projectId` |
| `keyId` | `apiKey.id` |
| `modelId` | `api_models.id`（内部 UUID） |
| `requestId` | `chatcmpl_mock_` + 16 字节 hex |
| `inputTokens` | prompt_tokens |
| `outputTokens` | completion_tokens |
| `totalTokens` | total_tokens |
| `cost` | 0（mock 阶段） |
| `status` | `success` |

## 9. 新增文件清单

| 文件 | 类型 |
| --- | --- |
| `backend/src/modules/api-hub/dto/openai-compatible.dto.ts` | DTO |
| `backend/src/modules/api-hub/guards/api-key.guard.ts` | Guard |
| `backend/src/modules/api-hub/openai-compatible.service.ts` | Service |
| `backend/src/modules/api-hub/openai-compatible.controller.ts` | Controller |
| `backend/src/modules/api-hub/openai-compatible.service.spec.ts` | 单元测试 |
| `backend/src/modules/api-hub/api-key.guard.spec.ts` | 单元测试 |
| `backend/scripts/smoke-api-hub-openai-compatible.mjs` | Smoke Test |

## 10. 手动测试流程

本阶段不做 seed，按以下步骤创建测试数据：

### 10.1 准备数据

1. **创建 API Project**：
   ```
   POST /api/v1/api-hub/projects
   Authorization: Bearer {JWT}
   Body: { "name": "测试项目" }
   ```

2. **创建 ApiModel**：
   ```
   POST /api/v1/api-hub/models
   Authorization: Bearer {JWT}
   Body: {
     "name": "Mock Chat",
     "provider": "moy",
     "modelId": "moy-mock-chat",
     "category": "text",
     "pricingUnit": "token",
     "status": "public",
     "description": "MOY Mock Chat Model"
   }
   ```

3. **将模型启用到项目**：
   ```
   POST /api/v1/api-hub/projects/{projectId}/models
   Authorization: Bearer {JWT}
   Body: { "modelId": "{modelId}" }
   ```

4. **设置月度 quota**：
   ```
   POST /api/v1/api-hub/projects/{projectId}/quotas
   Authorization: Bearer {JWT}
   Body: {
     "modelId": "{modelId}",
     "quotaLimit": 100000,
     "quotaUnit": "token",
     "period": "2026-05"
   }
   ```

5. **创建 API Key**：
   ```
   POST /api/v1/api-hub/projects/{projectId}/keys
   Authorization: Bearer {JWT}
   Body: { "name": "smoke test key" }
   ```
   复制返回的 `key` 字段（唯一一次）。

### 10.2 测试调用

```bash
# 设置环境变量
$env:API_HUB_SMOKE_BASE_URL="http://localhost:3001"
$env:API_HUB_SMOKE_KEY="moy_sk_..."
$env:API_HUB_SMOKE_MODEL="moy-mock-chat"

# 运行 smoke test
npm run test:smoke:api-hub

# 或直接 cURL
curl -H "Authorization: Bearer moy_sk_xxx" http://localhost:3001/v1/models
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Authorization: Bearer moy_sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{"model":"moy-mock-chat","messages":[{"role":"user","content":"Hello"}]}'
```

## 11. Smoke Test

脚本：`backend/scripts/smoke-api-hub-openai-compatible.mjs`

支持环境变量：

| 变量 | 默认值 |
| --- | --- |
| `API_HUB_SMOKE_BASE_URL` | `http://localhost:3001` |
| `API_HUB_SMOKE_KEY` | (必填) |
| `API_HUB_SMOKE_MODEL` | `moy-mock-chat` |

测试场景：
1. `GET /v1/models` — 状态 200，object= list
2. `POST /v1/chat/completions` — 状态 200，mock completion
3. `/api/v1/v1/models` — 不是正确路径
4. `stream=true` — 返回 400
5. 无效 key — 返回 401

运行：
```bash
npm --prefix backend run test:smoke:api-hub
npm run test:smoke:api-hub
```

## 12. 测试覆盖

| 测试套件 | 测试数 | 覆盖内容 |
| --- | --- | --- |
| `api-key.guard.spec.ts` | 5 | 缺少 Auth / 非 Bearer / 非 moy_sk_ 前缀 / 有效 key 挂载 / revoked key |
| `openai-compatible.service.spec.ts` | 12 | listModels 返回 / 空 data / mock completion / stream 400 / model 未启用 / quota 未配置 / quota 不足 / messages 空 / usage record 写入 / quota 扣减 / token 估算 |

运行：
```bash
npm --prefix backend test -- --runInBand
```

## 13. 下一阶段

真实 Provider Proxy：
- 接入 OpenAI / DeepSeek / Claude 等真实模型供应商
- 配置上游 API Key、base URL
- 请求转发 + 响应透传
- 错误码映射
- Stream 支持

## 14. 版本记录

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| v1.0 | 2026-05-07 | OpenAI-Compatible Entry MVP 完成：mock /v1/models + /v1/chat/completions，ApiKeyGuard Bearer 鉴权，quota 扣减，usage 记录，smoke test |
