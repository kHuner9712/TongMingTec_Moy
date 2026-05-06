# DeepSeek Provider Proxy MVP 实现说明

> **实施日期**：2026-05-07
> **版本**：v1.1（安全语义收口）
> **阶段**：MOY API Hub 第五阶段 — DeepSeek Provider Proxy MVP
> **前置**：[11_Provider_Proxy设计](./11_Provider_Proxy设计.md) / [10_Developer_Console_MVP](./10_Developer_Console_MVP.md)

## 1. 本阶段目标

将 `/v1/chat/completions` 从纯 mock 演进为真实 provider 转发。MVP 优先接 DeepSeek（成本低、OpenAI-compatible 协议）。

## 2. 路由规则

| model.provider | 行为 |
| --- | --- |
| `__mock__` | 走 mock 路径（推荐内部 mock 标识） |
| `mock` | 走 mock 路径（兼容别名） |
| `moy` | 走 mock 路径（兼容别名） |
| `deepseek` | 走真实 DeepSeek provider 转发 |
| 其他 | 走真实 provider 转发（通用 OpenAI-compatible） |

## 3. Provider Config 删除语义

`DELETE /api/v1/api-hub/provider-configs/:provider` **不物理删除数据库记录**，而是将 `status` 设为 `inactive`（软停用）。

- 停用后的 provider config 无法在 `resolveClient()` 中解析
- `resolveClient()` 对 inactive provider 抛出 `ProviderNotConfiguredError`
- 可通过 `PATCH /api/v1/api-hub/provider-configs/:provider` 重新激活（`status=active`）
- 文档与 UI 统一使用"停用"而非"删除"

## 4. 新增后端文件

### 4.1 Entity / Migration

| 文件 | 说明 |
| --- | --- |
| `entities/api-provider-config.entity.ts` | `ApiProviderConfig` Entity |
| `migrations/1744464000000-CreateApiProviderConfigs.ts` | 建表 `api_provider_configs` + `api_models.upstream_model` |

### 4.2 Providers

| 文件 | 说明 |
| --- | --- |
| `providers/provider-errors.ts` | 6 个 Provider 通用错误类型 |
| `providers/provider-types.ts` | `ProviderRequest` / `ProviderResponse` 类型 |
| `providers/openai-compatible-client.ts` | 基类 `OpenAICompatibleProviderClient` (axios) |
| `providers/deepseek-client.ts` | `DeepSeekProviderClient`（继承基类） |

### 4.3 Service / Controller

| 文件 | 说明 |
| --- | --- |
| `api-provider-config.service.ts` | Provider Config CRUD + `resolveClient()`（remove 为软停用） |
| `api-provider-config.controller.ts` | `POST/GET/PATCH/DELETE /api/v1/api-hub/provider-configs` |
| `dto/api-provider-config.dto.ts` | `CreateProviderConfigDto` / `UpdateProviderConfigDto` |

### 4.4 改造

| 文件 | 变更 |
| --- | --- |
| `openai-compatible.service.ts` | 注入 `ApiProviderConfigService`；mock 兼容 `__mock__` / `mock` / `moy` |
| `entities/api-model.entity.ts` | 新增 `upstreamModel` 字段 |
| `dto/api-model.dto.ts` | `CreateApiModelDto` / `UpdateApiModelDto` 新增 `upstreamModel` |
| `dto/openai-compatible.dto.ts` | 新增 `max_tokens` 字段 |

## 5. 请求流程（Provider 路径）

```
POST /v1/chat/completions
  │
  ├─ ApiKeyGuard
  ├─ 模型启用检查
  ├─ Quota 预检查
  ├─ 判断 model.provider ∈ {__mock__, mock, moy} → mock path
  ├─ 否则 → resolveClient(provider) → DeepSeekProviderClient
  ├─ 映射 modelId → upstreamModel (如 moy-deepseek-chat → deepseek-chat)
  ├─ HTTP POST → provider
  ├─ 成功 → consumeQuota(trueUsage) + success usage record
  └─ 失败 → failed usage record (不扣 quota) + 5xx error
```

## 6. 错误码

| code | HTTP 状态 | 说明 |
| --- | --- | --- |
| `provider_not_configured` | 502 | provider config 不存在或 inactive |
| `provider_api_key_missing` | 502 | 环境变量未设置 |
| `provider_timeout` | 504 | 请求超时 |
| `provider_rate_limited` | 502 | provider 返回 429 |
| `provider_invalid_request` | 502 | provider 返回 400/422 |
| `provider_error` | 502 | 其他 provider 错误 |

## 7. 测试覆盖

| 测试套件 | 测试数 | 覆盖 |
| --- | --- | --- |
| `openai-compatible.service.spec.ts` | 16 | mock path (`__mock__`/`mock`/`moy`) / deepseek path / error branches |
| `api-provider-config.service.spec.ts` | 11 | CRUD（含软停用）/ resolveClient |

## 8. Seed 脚本 — 一键初始化

```bash
# 设置 JWT token
$env:API_HUB_SEED_JWT="eyJhbGci..."

# 运行种子脚本
npm run seed:api-hub:deepseek
```

脚本自动创建完整 DeepSeek 调用链路：
1. Provider Config (deepseek)
2. API Project
3. ApiModel (moy-deepseek-chat → deepseek-chat)
4. Project Model 启用
5. Monthly Quota (100000 tokens)
6. API Key

如果资源已存在则复用，不重复报错。创建 API Key 后输出明文 key（唯一可见时机）。

环境变量覆盖：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `API_HUB_SEED_BASE_URL` | `http://localhost:3001` | 后端地址 |
| `API_HUB_SEED_JWT` | (必需) | MOY 登录 token |
| `API_HUB_SEED_PROVIDER` | `deepseek` | provider 标识 |
| `API_HUB_SEED_PROVIDER_BASE_URL` | `https://api.deepseek.com` | provider API 地址 |
| `API_HUB_SEED_PROVIDER_ENV_NAME` | `DEEPSEEK_API_KEY` | 环境变量名 |
| `API_HUB_SEED_MODEL_ID` | `moy-deepseek-chat` | 对外 modelId |
| `API_HUB_SEED_UPSTREAM_MODEL` | `deepseek-chat` | 上游模型名 |
| `API_HUB_SEED_QUOTA_LIMIT` | `100000` | 月额度 |

## 9. Smoke Test

```bash
$env:API_HUB_SMOKE_BASE_URL="http://localhost:3001"
$env:API_HUB_SMOKE_KEY="moy_sk_..."
$env:API_HUB_SMOKE_MODEL="moy-deepseek-chat"
npm run test:smoke:api-hub-deepseek
```

### 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `API_HUB_SMOKE_KEY` | (空) | API Key，缺失时提示运行 seed 脚本 |
| `API_HUB_SMOKE_MODEL` | `moy-deepseek-chat` | 测试模型 |
| `API_HUB_EXPECT_REAL_PROVIDER` | `true` | 为 false 时允 mock 响应 |

### 增强特性

- `API_HUB_SMOKE_KEY` 缺失 → 提示运行 seed 脚本，不报 obscure error
- 收到 `provider_api_key_missing` (502) → 提示"后端缺少 DEEPSEEK_API_KEY"，不误判为鉴权失败
- 收到 mock 响应但 `EXPECT_REAL=true` → 明确 FAIL："期望真实 DeepSeek provider 响应，但收到 mock response"
- 输出：completion id、model field、usage、是否为真实 provider

## 10. Developer Console 新增

| 组件 | 说明 |
| --- | --- |
| `ProviderConfigPanel` | Provider Config 创建/列表/**停用**（按钮"停用"，非"删除"） |
| `ModelPanel` 更新 | `upstreamModel` 输入框 + provider 提示（`__mock__`/`mock`/`moy`/`deepseek`） |
| `OpenAiTestPanel` 更新 | 根据 model.provider 显示提示："返回本地 mock" / "需后端配置 DEEPSEEK_API_KEY" |

## 11. 环境变量

```bash
# backend/.env 新增
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com
API_HUB_PROVIDER_TIMEOUT_MS=60000
```

### DeepSeek baseUrl 兼容性

- 推荐 `https://api.deepseek.com`
- 也可使用 `https://api.deepseek.com/v1`
- 当前 `deepseek-chat` / `deepseek-reasoner` 为官方兼容模型名
- 如果官方模型名变化，通过 Console 修改 `upstreamModel` 即可，不需要改外部 `modelId`

## 12. 安全边界

- Provider API Key **绝不存入数据库**，只存环境变量名（`apiKeyEnvName`）
- 运行时通过 `process.env[config.apiKeyEnvName]` 读取
- Provider API Key **绝不暴露到前端**
- Provider API Key **绝不打印到日志**
- `resolveClient()` 仅在 token 被使用时才读取 env key，非启动时全量读取

## 13. 下一阶段

- Streaming support
- Retry / Fallback
- Provider health check
- Caching
- Cost pricing

## 14. 版本记录

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| v1.0 | 2026-05-07 | DeepSeek Provider Proxy MVP：entity/migration/providers/service/controller/console/tests/docs |
| v1.1 | 2026-05-07 | 安全语义收口：软停用 remove / mock 兼容 (`__mock__`/`mock`/`moy`) / seed 脚本 / smoke 增强 / console 提示 |
