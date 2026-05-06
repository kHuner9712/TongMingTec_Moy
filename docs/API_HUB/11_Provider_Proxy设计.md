# Provider Proxy 设计文档

> **创建日期**：2026-05-07
> **阶段**：MOY API Hub 第四阶段 — Provider Proxy 设计（暂不写代码）
> **前置**：[09_OpenAI兼容入口MVP](./09_OpenAI兼容入口MVP.md) / [10_Developer_Console_MVP](./10_Developer_Console_MVP.md)

## 1. 阶段目标

本阶段将 `/v1/chat/completions` 从 mock response 演进为真实 provider 转发能力。

| 维度 | Mock MVP（当前） | Provider Proxy（本阶段目标） |
| --- | --- | --- |
| 响应来源 | 固定 mock string | 真实模型供应商返回 |
| usage | 本地估算 | 优先使用 provider 返回值 |
| model | `moy-mock-chat` | `moy-openai-gpt-4o-mini` / `moy-deepseek-v3` 等 |
| 错误语义 | 本地逻辑错误 | provider 实际错误 + normalize |

对外接口保持 OpenAI-compatible，`/v1/models` 不变。

## 2. 不做事项

| 不做 | 说明 |
| --- | --- |
| stream | 所有请求 `stream=true` 仍返回 400 |
| function calling / tool calling | 不支持 tools / functions 字段 |
| fallback | 不自动切换备用 provider |
| 缓存 | 不做请求-响应缓存 |
| 复杂路由策略 | 不做按 cost / latency / region 的路由 |
| 文件上传 | 不做 multipart / vision |
| billing / payment | 不接计费系统 |
| 前端暴露 provider key | provider 密钥绝不对前端可见 |

## 3. Provider Config 设计

### 3.1 新增表：`api_provider_configs`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 主键 |
| `provider` | varchar(64) | 标识，如 `openai` / `deepseek` |
| `display_name` | varchar(128) | 展示名，如 `OpenAI` / `DeepSeek` |
| `base_url` | varchar(512) | provider API 基础地址 |
| `api_key_env_name` | varchar(128) | 环境变量名，如 `OPENAI_API_KEY` |
| `status` | varchar(32) | `active` / `inactive` / `error` |
| `timeout_ms` | int | 默认 60000 |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 3.2 核心原则

**不要把真实 provider API Key 存数据库。**

只存环境变量名称（如 `OPENAI_API_KEY`），真实密钥只放在后端环境变量中。运行时通过 `process.env[config.api_key_env_name]` 读取。

```typescript
// 伪代码
function getProviderApiKey(config: ApiProviderConfig): string {
  const key = process.env[config.api_key_env_name];
  if (!key) throw new ProviderApiKeyMissingError(config.provider);
  return key;
}
```

## 4. Model 与 Provider 关系

### 4.1 `api_models` 扩展建议

现有 `api_models` 已有 `provider` 和 `modelId` 字段，在此基础上利用或新增：

| 字段 | 用途 | 示例 |
| --- | --- | --- |
| `provider` | 指向 `api_provider_configs.provider` | `openai` |
| `modelId`（现有） | 对外暴露的 model id | `moy-openai-gpt-4o-mini` |
| `upstream_model`（建议新增） | 真实 provider 模型名 | `gpt-4o-mini` |

### 4.2 示例映射

| 对外 modelId | provider | upstream_model |
| --- | --- | --- |
| `moy-openai-gpt-4o-mini` | `openai` | `gpt-4o-mini` |
| `moy-deepseek-v3` | `deepseek` | `deepseek-chat` |
| `moy-deepseek-r1` | `deepseek` | `deepseek-reasoner` |

`/v1/models` 返回的 `id` 仍然使用 `modelId`（对外标识），`upstream_model` 仅内部转发时使用。

## 5. 请求流程

```
Client
  │
  ├─[1] POST /v1/chat/completions
  │      Authorization: Bearer moy_sk_xxx
  │
  ├─[2] ApiKeyGuard — 验证 API Key，挂载 req.apiKey
  │
  ├─[3] Project Model Enabled Check — findEnabledModelByModelId()
  │      模型未启用 → 403 model_not_enabled
  │
  ├─[4] Quota Pre-Check — assertQuotaAvailable(projectId, modelId, estimatedTokens)
  │      额度未配置 → 402 quota_not_configured
  │      额度不足   → 402 quota_exceeded
  │
  ├─[5] Resolve Provider Config — 根据 model.provider 查 api_provider_configs
  │      provider 未配置 → 502 provider_not_configured
  │      api_key env 未设置 → 502 provider_api_key_missing
  │
  ├─[6] Build Upstream Request
  │      映射 model → upstream_model
  │      透传 messages, temperature, max_tokens, top_p
  │      添加 provider auth header
  │
  ├─[7] Send to Provider (HTTP POST, timeout 60s)
  │      超时 → 504 provider_timeout
  │      其他网络错误 → 502 provider_error
  │
  ├─[8] Handle Response
  │      ├─ 2xx → Normalize Response
  │      ├─ 429 → 502 provider_rate_limited
  │      ├─ 4xx → 502 provider_invalid_request
  │      └─ 5xx → 502 provider_error
  │
  ├─[9] Extract / Estimate Usage
  │      优先用 provider 返回的 usage
  │      没有则本地估算（同 mock 规则）
  │
  ├─[10] Quota Consume — consumeQuota(projectId, modelId, totalTokens)
  │
  ├─[11] Write Usage Record — 成功 / 失败分支
  │
  └─[12] Return OpenAI-compatible Response (200)
```

## 6. 请求转发规则

### 6.1 MVP 支持字段

| 字段 | 处理方式 |
| --- | --- |
| `model` | 映射为 `upstream_model` |
| `messages` | 透传，不做更改 |
| `temperature` | 透传 |
| `max_tokens` | 透传 |
| `top_p` | 透传 |

### 6.2 暂不支持字段

收到以下字段时 **忽略**（不报错，直接 stripped），避免 _moy-mock-chat 要映射。

| 字段 | 处理 |
| --- | --- |
| `stream` | 仍返回 400, `stream_not_supported` |
| `tools` | 忽略 |
| `tool_choice` | 忽略 |
| `response_format` | 忽略 |
| `functions` | 忽略 |
| `stop` | 忽略 |
| `user` | 忽略 |
| `logprobs` | 忽略 |

## 7. 响应处理

### 7.1 Normalize 规则

| 字段 | 来源 |
| --- | --- |
| `id` | 生成 `chatcmpl_` + 16 hex（或透传 provider id） |
| `object` | 固定 `"chat.completion"` |
| `created` | 当前时间戳 |
| `model` | 对外 `modelId`（非 upstream_model） |
| `choices` | 透传 provider choices，保证 message.role/content/finish_reason 存在 |
| `usage` | 优先使用 provider 返回值 |

### 7.2 Usage 处理

```typescript
function resolveUsage(providerResponse: any, estimatedTokens: number): UsageDTO {
  if (providerResponse?.usage?.total_tokens) {
    return {
      prompt_tokens: providerResponse.usage.prompt_tokens ?? 0,
      completion_tokens: providerResponse.usage.completion_tokens ?? 0,
      total_tokens: providerResponse.usage.total_tokens,
    };
  }
  // fallback 本地估算
  return { prompt_tokens: estimatedTokens - 32, completion_tokens: 32, total_tokens: estimatedTokens };
}
```

**原则**：能拿真实 usage 就拿真实的；拿不到再用本地估算，保证 quota 扣减有值可扣。

## 8. 错误处理

### 8.1 错误码定义

| 错误码 | HTTP 状态 | 含义 | 触发条件 |
| --- | --- | --- | --- |
| `model_not_enabled` | 403 | 模型未启用 | project model enabled = false |
| `quota_not_configured` | 402 | 额度未配置 | 当月无 quota 记录 |
| `quota_exceeded` | 402 | 额度已用完 | quotaUsed >= quotaLimit |
| `provider_not_configured` | 502 | provider 配置缺失 | 无对应 api_provider_configs 记录 |
| `provider_api_key_missing` | 502 | provider API Key 未设置 | 环境变量未配或为空 |
| `provider_timeout` | 504 | provider 超时 | 请求超过 timeout_ms |
| `provider_error` | 502 | provider 通用错误 | 网络 / DNS / 连接错误 |
| `provider_rate_limited` | 502 | provider 限流 | 收到 429 |
| `provider_invalid_request` | 502 | provider 拒绝请求 | 收到 400/422 等 |
| `stream_not_supported` | 400 | 不支持 stream | stream=true |

### 8.2 错误响应格式

所有错误保持 OpenAI-compatible：

```json
{
  "error": {
    "message": "Upstream provider timed out after 60000ms",
    "type": "provider_error",
    "code": "provider_timeout"
  }
}
```

## 9. Timeout 与重试

### 9.1 MVP 策略

| 维度 | 值 |
| --- | --- |
| 默认 timeout | 60s（可通过 env `API_HUB_PROVIDER_TIMEOUT_MS` 覆盖） |
| 自动重试 | **不做** |
| timeout 后 | 返回 504，写 failed usage record |

### 9.2 failed usage 记录

provider 调用失败时写 `api_usage_records`：

| 字段 | 值 |
| --- | --- |
| `status` | `"failed"` |
| `errorCode` | 如 `provider_timeout` |
| `inputTokens` | 估算的 prompt_tokens（不扣 quota） |
| `outputTokens` | 0 |
| `totalTokens` | 0（不扣配额） |
| `cost` | 0 |

### 9.3 边界处理

如果 provider 已产生 token 消耗但响应失败（如中途断连），S1 可先不计费，后续版本通过 provider usage API 回补。

## 10. Usage 与 Quota 对接

| 场景 | quota 行为 | usage record 行为 |
| --- | --- | --- |
| 调用成功 | consumeQuota(trueUsage) | status=success, 记录真实 usage |
| 调用失败 | 不扣减 | status=failed, tokens=0 |
| 超时 | 不扣减 | status=failed, code=provider_timeout |
| quota 预检查不通过 | 不扣减 | 不写（请求未发出） |

## 11. 环境变量

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1

# DeepSeek
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com

# 全局
API_HUB_PROVIDER_TIMEOUT_MS=60000
```

> `base_url` 也可通过 `api_provider_configs.base_url` 配置，env 变量提供覆盖能力。

## 12. 安全边界

| 规则 | 说明 |
| --- | --- |
| provider key 不进数据库 | `api_provider_configs` 只存 env var 名 |
| provider key 不进前端 | 不做任何暴露 provider key 的接口 |
| provider key 不进响应 | 错误/成功响应均不包含 key |
| provider key 不进日志 | 日志脱敏，不记录 Authorization header |
| 请求内容不长期存日志 | 用户 messages content 后续脱敏 |
| CORS 限制 | 生产环境限制允许的 origin |
| API Key 哈希存储 | `api_project_keys` 仍然 SHA-256 |

## 13. 第一批实现建议

### 13.1 推荐顺序

| 优先级 | Provider | 理由 |
| --- | --- | --- |
| P0 | **DeepSeek** | OpenAI-compatible 协议，成本低，接入难度最低 |
| P1 | **OpenAI** | 标准协议，生态最成熟 |

### 13.2 第一阶段交付物

- one provider (DeepSeek)
- non-stream chat completions
- 真实 usage 扣减
- failed usage 记录
- timeout 处理
- 完整的错误 normalize
- 单元测试 + smoke test

## 14. 开发任务拆分

| Task ID | 任务 | 说明 |
| --- | --- | --- |
| `PROVIDER-001` | provider config entity + migration | 创建 `api_provider_configs` 表 + entity |
| `PROVIDER-002` | provider resolver service | `ApiProviderConfigService` 查找/校验配置 |
| `PROVIDER-003` | upstream client 基类 | 抽象 HTTP client：build request / send / normalize |
| `PROVIDER-004` | DeepSeek provider adapter | 继承 upstream client，配置 base_url / auth |
| `PROVIDER-005` | OpenAI provider adapter | 继承 upstream client |
| `PROVIDER-006` | provider error normalize | 统一错误映射到 OpenAI-compatible 格式 |
| `PROVIDER-007` | usage/quota 对接 | 对接 `ApiQuotaService` + `ApiUsageService` |
| `PROVIDER-008` | 集成测试 | provider mock server + e2e 调用流程 |
| `PROVIDER-009` | smoke test | 新增 provider proxy smoke 脚本 |
| `PROVIDER-010` | 文档同步 | 更新 00/09/10/11 及 README |
| `PROVIDER-011` | 重构 openai-compatible.service | mock 逻辑改为 provider 适配器模式 |

## 15. 后续路线 (S2+)

| 阶段 | 内容 |
| --- | --- |
| S2.1 | Streaming support (`stream: true`) |
| S2.2 | Retry (exponential backoff) |
| S2.3 | Provider fallback |
| S2.4 | Caching layer |
| S2.5 | Provider health check / status page |
| S2.6 | Model routing (cost / latency / region) |
| S2.7 | Real cost pricing (per-model rate cards) |
| S3 | Billing / payment integration |

## 16. 版本记录

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| v1.2 | 2026-05-07 | 安全语义收口：软停用 remove / mock 兼容 / seed 脚本 / smoke 增强 |
| v1.1 | 2026-05-07 | 代码已实现，详见 [12_DeepSeek_Provider_MVP](./12_DeepSeek_Provider_MVP.md) |
| v1.0 | 2026-05-07 | Provider Proxy 设计文档初版：14 个设计维度 + 11 个开发任务 |
