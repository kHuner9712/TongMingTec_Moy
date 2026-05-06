# DeepSeek Provider Proxy MVP 实现说明

> **实施日期**：2026-05-07
> **阶段**：MOY API Hub 第五阶段 — DeepSeek Provider Proxy MVP
> **前置**：[11_Provider_Proxy设计](./11_Provider_Proxy设计.md) / [10_Developer_Console_MVP](./10_Developer_Console_MVP.md)
> **设计依据**：[11_Provider_Proxy设计](./11_Provider_Proxy设计.md)

## 1. 本阶段目标

将 `/v1/chat/completions` 从纯 mock 演进为真实 provider 转发。MVP 优先接 DeepSeek（成本低、OpenAI-compatible 协议）。

## 2. 路由规则

| model.provider | 行为 |
| --- | --- |
| `__mock__` | 走原 mock 路径（不变） |
| `deepseek` | 走真实 DeepSeek provider 转发 |
| 其他 | 走真实 provider 转发（通用 OpenAI-compatible） |

## 3. 新增后端文件

### 3.1 Entity / Migration

| 文件 | 说明 |
| --- | --- |
| `entities/api-provider-config.entity.ts` | `ApiProviderConfig` Entity |
| `migrations/1744464000000-CreateApiProviderConfigs.ts` | 建表 `api_provider_configs` + `api_models.upstream_model` |

### 3.2 Providers

| 文件 | 说明 |
| --- | --- |
| `providers/provider-errors.ts` | 6 个 Provider 通用错误类型 |
| `providers/provider-types.ts` | `ProviderRequest` / `ProviderResponse` 类型 |
| `providers/openai-compatible-client.ts` | 基类 `OpenAICompatibleProviderClient` (axios) |
| `providers/deepseek-client.ts` | `DeepSeekProviderClient`（继承基类） |

### 3.3 Service / Controller

| 文件 | 说明 |
| --- | --- |
| `api-provider-config.service.ts` | Provider Config CRUD + `resolveClient()` |
| `api-provider-config.controller.ts` | `POST/GET/PATCH/DELETE /api/v1/api-hub/provider-configs` |
| `dto/api-provider-config.dto.ts` | `CreateProviderConfigDto` / `UpdateProviderConfigDto` |

### 3.4 改造

| 文件 | 变更 |
| --- | --- |
| `openai-compatible.service.ts` | 注入 `ApiProviderConfigService`；model.provider 非 `__mock__` 时走 provider 转发 |
| `entities/api-model.entity.ts` | 新增 `upstreamModel` 字段 |
| `dto/api-model.dto.ts` | `CreateApiModelDto` / `UpdateApiModelDto` 新增 `upstreamModel` |
| `dto/openai-compatible.dto.ts` | 新增 `max_tokens` 字段 |

## 4. 请求流程（Provider 路径）

```
POST /v1/chat/completions
  │
  ├─ ApiKeyGuard
  ├─ 模型启用检查
  ├─ Quota 预检查
  ├─ resolveClient(provider) → DeepSeekProviderClient
  ├─ 映射 modelId → upstreamModel (如 moy-deepseek-v3 → deepseek-chat)
  ├─ HTTP POST → provider
  ├─ 成功 → consumeQuota(trueUsage) + success usage record
  └─ 失败 → failed usage record (不扣 quota) + 5xx error
```

## 5. 错误码

| code | HTTP 状态 | 说明 |
| --- | --- | --- |
| `provider_not_configured` | 502 | provider config 不存在或 inactive |
| `provider_api_key_missing` | 502 | 环境变量未设置 |
| `provider_timeout` | 504 | 请求超时 |
| `provider_rate_limited` | 502 | provider 返回 429 |
| `provider_invalid_request` | 502 | provider 返回 400/422 |
| `provider_error` | 502 | 其他 provider 错误 |

## 6. 测试覆盖

| 测试套件 | 测试数 | 覆盖 |
| --- | --- | --- |
| `openai-compatible.service.spec.ts` | 14 | mock path / deepseek path / error branches |
| `api-provider-config.service.spec.ts` | 10 | CRUD + resolveClient |

## 7. Developer Console 新增

| 组件 | 说明 |
| --- | --- |
| `ProviderConfigPanel` | Provider Config 创建/列表/删除 |
| `ModelPanel` 更新 | 新增 `upstreamModel` 输入框和列表显示 |

## 8. 环境变量

```bash
# backend/.env 新增
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
API_HUB_PROVIDER_TIMEOUT_MS=60000
```

## 9. Smoke Test

```bash
$env:API_HUB_SMOKE_BASE_URL="http://localhost:3001"
$env:API_HUB_SMOKE_KEY="moy_sk_..."
$env:API_HUB_SMOKE_MODEL="moy-deepseek-v3"
npm run test:smoke:api-hub-deepseek
```

## 10. 下一阶段

- Streaming support
- Retry / Fallback
- Provider health check
- Caching
- Cost pricing

## 11. 版本记录

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| v1.0 | 2026-05-07 | DeepSeek Provider Proxy MVP：entity/migration/providers/service/controller/console/tests/docs |
