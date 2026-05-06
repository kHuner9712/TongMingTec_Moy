# MOY API Hub Foundation 实现说明

## 1. 阶段范围

**MOY API Hub Foundation** 是 MOY API Hub 的后端基础阶段，提供项目管理、API Key 安全颁发、模型注册、月度额度管理和调用记录追踪。

### 本阶段明确实现

- 6 张 PostgreSQL 数据表（Migration）
- 4 个 Controller / 23 个 API 端点
- 5 个 Service（含状态机校验 + SHA-256 密钥安全存储）
- API Key 安全策略：生成/哈希/前缀/明文仅返回一次

### 本阶段明确不做

| 不做 | 说明 |
|------|------|
| `/v1/chat/completions` 代理转发 | 不代理到真实 AI 模型 |
| Provider proxy | 不连接 OpenAI / Anthropic / 智谱等 |
| Rate Limit / 限流 | 无频率控制 |
| API Hub 前端控制台（sites/api） | 无开发者门户页面 |
| 统一登录集成 | 沿用现有 MOY JWT，不新建用户体系 |
| 计费/支付 | 只记录用量和成本，无账单 |
| 内容安全 | 不接入内容审核 |
| 文件上传 | `/v1/files` 不实现 |

## 2. 已实现模块

### 2.1 项目管理（ApiProjectsService + ApiProjectsController）

- 项目 CRUD
- 状态流转：`active` → `suspended` / `archived`、`suspended` → `active` / `archived`
- 项目与模型关联（启用/禁用特定模型）
- 月度额度管理（设置/查询/删除）

### 2.2 API Key 管理（ApiKeysService + ApiKeysController）

- Key 生成/吊销/更新
- SHA-256 哈希存储 + 12 位前缀
- 明文 Key 仅创建时返回，后续查询不返回
- Key 验证（`validateAndFind`）用于内部认证

### 2.3 模型注册（ApiModelsService + ApiModelsController）

- 多 provider 模型注册
- 模型能力字段：max tokens / streaming / vision / function calling
- 模型状态：`internal` → `public` → `deprecated`

### 2.4 额度管理（ApiQuotaService）

- 按项目 × 模型 × 月份设置额度
- 实时用量追踪与剩余查询
- 用量百分比计算

### 2.5 调用记录（ApiUsageService + ApiUsageController）

- 每次模型调用记录 token/cost/状态
- 按模型、按天聚合统计
- 按 key/model/时间范围过滤查询

## 3. 数据表（6 张）

| 表名 | 用途 | 核心状态字段 |
|------|------|-------------|
| `api_projects` | API 项目 | `status`: active / suspended / archived |
| `api_project_keys` | API 密钥 | `status`: active / revoked / expired |
| `api_models` | 模型注册 | `status`: internal / public / deprecated |
| `api_project_models` | 项目-模型关联 | `enabled`: boolean |
| `api_monthly_quota` | 月度额度 | `period` (YYYY-MM) / `quota_limit` / `quota_used` |
| `api_usage_records` | 调用记录 | `status`: success / error |

全部表使用 UUID 主键，`created_at` / `updated_at` 时间戳。

## 4. Migration

```
backend/src/migrations/1714500000000-CreateApiHubTables.ts
```

- 创建以上 6 张表及全部索引
- up() 开头包含 `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
- down() 按依赖顺序删除表（usage_records → monthly_quota → project_models → models → project_keys → projects）

**部署要求**：

- 生产环境必须执行 `npm run migration:run`
- 禁止使用 `synchronize: true`

## 5. API 路径

### 基础路径

所有 API 端点统一前缀：`/api/v1/api-hub/`

### 端点清单

**项目管理**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/api-hub/projects` | 创建项目 |
| GET | `/api/v1/api-hub/projects` | 项目列表 |
| GET | `/api/v1/api-hub/projects/:id` | 项目详情 |
| PATCH | `/api/v1/api-hub/projects/:id` | 更新项目 |
| DELETE | `/api/v1/api-hub/projects/:id` | 归档 |

**项目-模型关联**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/api-hub/projects/:id/models` | 启用模型 |
| GET | `/api/v1/api-hub/projects/:id/models` | 模型列表 |
| PATCH | `/api/v1/api-hub/projects/:id/models/:modelId` | 更新启用 |
| DELETE | `/api/v1/api-hub/projects/:id/models/:modelId` | 移除 |

**月度额度**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/api-hub/projects/:id/quota` | 设置额度 |
| GET | `/api/v1/api-hub/projects/:id/quota` | 额度列表 |
| PATCH | `/api/v1/api-hub/projects/:id/quota/:quotaId` | 更新额度 |
| DELETE | `/api/v1/api-hub/projects/:id/quota/:quotaId` | 删除 |
| GET | `/api/v1/api-hub/projects/:id/remaining?modelId=` | 剩余查询 |

**API Key 管理**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/api-hub/projects/:projectId/keys` | 创建（返回明文 Key） |
| GET | `/api/v1/api-hub/projects/:projectId/keys` | 列表（不返回 Key） |
| GET | `/api/v1/api-hub/projects/:projectId/keys/:id` | 详情（不返回 Key） |
| PATCH | `/api/v1/api-hub/projects/:projectId/keys/:id` | 更新（不返回 Key） |
| DELETE | `/api/v1/api-hub/projects/:projectId/keys/:id` | 吊销（软删除，不返回 Key） |

**模型注册**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/api-hub/models` | 注册 |
| GET | `/api/v1/api-hub/models` | 列表 |
| GET | `/api/v1/api-hub/models/:id` | 详情 |
| PATCH | `/api/v1/api-hub/models/:id` | 更新 |
| DELETE | `/api/v1/api-hub/models/:id` | 废弃 |

**用量记录**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/api-hub/usage?projectId=` | 记录调用 |
| GET | `/api/v1/api-hub/usage?projectId=` | 列表 |
| GET | `/api/v1/api-hub/usage/stats?projectId=` | 统计 |
| GET | `/api/v1/api-hub/usage/:id?projectId=` | 详情 |

**健康检查**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/api-hub/health` | 服务健康 |

## 6. API Key 安全策略

### 6.1 Key 格式

```
moy_sk_ + 32 位十六进制随机串
```

示例：`moy_sk_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6`

生成方式：`"moy_sk_" + crypto.randomBytes(16).toString("hex")`

### 6.2 存储策略

| 存储字段 | 内容 | 说明 |
|---------|------|------|
| `key_prefix` | 前 12 位 | 用于后台列表展示和识别 |
| `key_hash` | SHA-256(完整明文) | 用于认证时比对，不可逆 |

### 6.3 返回策略

| 接口 | 返回内容 |
|------|----------|
| POST create | `CreateApiKeyResponseDto` — 包含 `key`（明文）、无 `keyHash` |
| GET list | `ApiKeySafeResponseDto[]` — 无 `key`、无 `keyHash` |
| GET detail | `ApiKeySafeResponseDto` — 无 `key`、无 `keyHash` |
| PATCH update | `ApiKeySafeResponseDto` — 无 `key`、无 `keyHash` |
| DELETE revoke | `ApiKeySafeResponseDto` — 无 `key`、无 `keyHash` |

### 6.4 明文规则

- **明文 Key 只在创建时返回一次**
- 列表/详情/更新/吊销均不返回任何形式的明文 Key
- 不在响应中暴露 `keyHash`（哈希值仅用于内部认证）

### 6.5 认证流程

1. 请求携带 `Authorization: Bearer moy_sk_xxx`
2. 服务端对 key 做 SHA-256：`SHA-256("moy_sk_xxx")` → `a3f2...e5d4`
3. 查 `api_project_keys` 表中 `key_hash = 'a3f2...e5d4'`
4. 找到则通过认证，记录 `last_used_at`

## 7. Key 状态语义

| 状态 | 含义 | 来源 |
|------|------|------|
| `active` | 有效 | 创建默认 |
| `revoked` | 吊销（软删除，不可恢复） | DELETE 接口 |
| `expired` | 过期 | `expiresAt` 到期自动切换 |

DELETE 接口实际为软吊销（软删除），不物理删除数据库记录。吊销后不可恢复。

## 8. 认证

- 所有 `/api/v1/api-hub/*` 管理端点使用 `@UseGuards(JwtAuthGuard)`
- 使用 `@SkipTenantCheck()` 允许 orgId 可选（平台级或跨租户操作）
- 管理接口需要 MOY JWT（与现有 MOY App 一致）
- 开放接口尚未实现（下一阶段 API Key Bearer 认证）

## 9. 组件文件

```
backend/src/modules/api-hub/
├── api-hub.module.ts
├── api-hub.controller.ts          # GET /health
├── api-projects.service.ts        # 项目 CRUD + 状态机
├── api-projects.controller.ts     # 项目 + 模型关联 + 额度
├── api-project-models.service.ts  # 项目-模型关联
├── api-keys.service.ts            # Key 生成/验证/SHA-256
├── api-keys.controller.ts         # Key CRUD
├── api-models.service.ts          # 模型注册
├── api-models.controller.ts       # 模型 CRUD
├── api-quota.service.ts           # 额度管理
├── api-usage.service.ts           # 调用记录 + 统计
├── api-usage.controller.ts        # 用量 CRUD
├── entities/                      # 6 个 Entity
├── dto/                           # 6 组 DTO（含安全响应）
└── *.spec.ts                      # 5 个测试文件 / 50 tests

backend/src/common/
├── decorators/skip-tenant.decorator.ts  # @SkipTenantCheck()
└── guards/tenant.guard.ts               # 支持跳过租户

backend/src/migrations/
└── 1714500000000-CreateApiHubTables.ts  # 6 表 Migration
```

## 10. 测试覆盖

| Suite | Tests | Result |
|-------|-------|--------|
| ApiProjectsService | 10 | ✅ |
| ApiKeysService | 10 | ✅ |
| ApiModelsService | 10 | ✅ |
| ApiQuotaService | 10 | ✅ |
| ApiUsageService | 10 | ✅ |
| **总计** | **50** | ✅ |

Key 测试覆盖：

1. create 返回完整 `moy_sk_` 开头 key
2. `keyHash` 存在于数据库实体
3. create response 返回 `key`（不叫 `rawKey`）
4. list 不返回 key / rawKey / keyHash
5. detail 不返回 key / rawKey / keyHash
6. update 不返回 key / rawKey / keyHash
7. revoke 不返回 key / rawKey / keyHash
8. 不存在密钥抛 NotFoundException
9. 无效密钥抛 UnauthorizedException
10. 已吊销密钥抛 UnauthorizedException

## 11. 后续阶段

| 阶段 | 内容 | 文档 |
|------|------|------|
| S1.5 OpenAI-Compatible Entry | `/v1/models` + `/v1/chat/completions` mock 入口 + ApiKeyGuard Bearer 鉴权 + quota 扣减 | [09_OpenAI兼容入口MVP](./09_OpenAI兼容入口MVP.md) ✅ 已完成 |
| S2 Provider Proxy | `/v1/chat/completions` 真实代理转发到 OpenAI / DeepSeek 等 + Stream 支持 | 待开发 |
| S3 Developer Portal | `sites/api` 开发者控制台（apikey 管理、用量看板、文档） | 待开发 |
| S4 Admin Dashboard | API Hub 运营后台（项目审批、配额管理、调用监控） | 待开发 |
| S5 Billing | 计费、套餐、按量付费、账单 | 待开发 |
