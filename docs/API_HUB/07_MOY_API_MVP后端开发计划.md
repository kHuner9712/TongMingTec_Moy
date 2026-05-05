# MOY API MVP 后端开发计划

## 1. 文档用途

本文档把 MOY API 从产品设计文档推进到可执行的开发任务。供后端开发团队、技术负责人排期和任务分配使用。

**注意：本文档仅作计划，暂不实现代码。**

前置阅读：

- [00_MOY_API产品总览](./00_MOY_API产品总览.md)
- [01_MOY_API_MVP范围](./01_MOY_API_MVP范围.md)
- [02_API_Key与用量模型](./02_API_Key与用量模型.md)
- [03_OpenAI兼容接口设计](./03_OpenAI兼容接口设计.md)
- [04_调用日志与成本统计](./04_调用日志与成本统计.md)
- [05_安全合规与使用边界](./05_安全合规与使用边界.md)

## 2. 开发目标

第一阶段实现一个最小可用的 **API Gateway MVP**，交付以下能力：

| # | 能力 | 用户可见 |
|:---:|---|:---:|
| 1 | API Project 创建/管理 | ✓ |
| 2 | API Key 创建/列表/禁用 | ✓ |
| 3 | API Key 鉴权（Bearer Token） | — |
| 4 | 模型列表 `GET /v1/models` | ✓ |
| 5 | OpenAI-compatible `POST /v1/chat/completions` | ✓ |
| 6 | 每次调用写入 `ApiUsageLog` | ✓ |
| 7 | token 用量记录与展示 | ✓ |
| 8 | 额度账户初始化 + 调用扣减 | ✓ |
| 9 | 额度不足拦截 | — |
| 10 | 基础按 Key QPS 限流 | — |

MVP 不做：stream、function calling、fallback、缓存、多供应商路由、计费充值。

## 3. 工程边界

### 3.1 核心原则

| 规则 | 说明 |
| --- | --- |
| 不塞入 MOY App 主菜单 | API Hub 有自己的前端入口 (`sites/api`)，不占用 App 的侧边栏导航 |
| 技术栈复用 | 使用 NestJS + TypeScript + TypeORM，与现有 `backend/` 同技术栈 |
| 模块隔离 | 在 `backend/src/modules/api-hub/` 下建立独立模块树，不修改现有业务模块 |
| 可拆分标记 | 代码中通过目录结构和模块边界明确 "可后续拆分为独立服务" |
| 独立数据库 | 使用独立数据库 `moy_api_hub`，不与 `moy_app` 混用 |

### 3.2 放置方案

**选择方案 A：放在 `backend/src/modules/api-hub/`**

```
backend/
├── src/
│   ├── modules/
│   │   ├── api-hub/          ← 新增
│   │   │   ├── api-hub.module.ts
│   │   │   ├── entities/
│   │   │   │   ├── api-project.entity.ts
│   │   │   │   ├── api-key.entity.ts
│   │   │   │   ├── api-usage-log.entity.ts
│   │   │   │   ├── api-quota-account.entity.ts
│   │   │   │   ├── api-quota-ledger.entity.ts
│   │   │   │   └── api-model-config.entity.ts
│   │   │   ├── services/
│   │   │   │   ├── api-project.service.ts
│   │   │   │   ├── api-key.service.ts
│   │   │   │   ├── api-usage.service.ts
│   │   │   │   ├── api-quota.service.ts
│   │   │   │   ├── api-model.service.ts
│   │   │   │   └── chat-completions-proxy.service.ts
│   │   │   └── controllers/
│   │   │       ├── api-projects.controller.ts
│   │   │       ├── api-keys.controller.ts
│   │   │       ├── api-models.controller.ts
│   │   │       └── chat-completions.controller.ts
│   │   ├── auth/             ← 已有
│   │   ├── cm/               ← 已有
│   │   └── ...
│   ├── app.module.ts
│   └── main.ts
```

**远期可选方案 B：独立服务 `services/api-gateway/`**

当 API Hub 的业务复杂度增长到需要独立部署时，将 `api-hub` 模块迁出为独立 NestJS 应用。MVP 阶段采用方案 A 以最快速度交付。

### 3.4 对现有系统的影响

| 影响范围 | 说明 |
| --- | --- |
| `app.module.ts` | 新增一行 `ApiHubModule` 导入 |
| 数据库 | 新增 `moy_api_hub` 数据库（或同实例不同 database） |
| 环境变量 | 新增 API Hub 相关配置（provider key、限流参数等） |
| 前端 | `sites/api` 将来对接管理接口 |
| 业务模块 | **零影响**：auth/cm/lm/om/qt/ct/ord/pay 等模块不改动 |

### 3.5 全局前缀与 OpenAI-compatible 路由处理

**问题**：现有 `backend/src/main.ts` 设置了：

```typescript
app.setGlobalPrefix("api/v1");
```

这会导致所有路由自动加上 `/api/v1` 前缀。但 API Hub 的开放接口要求暴露为：

- `GET /v1/models`
- `POST /v1/chat/completions`

以兼容 OpenAI SDK 的 `base_url` 习惯（如 `https://api.openai.com/v1`）。

**关键矛盾**：

| 接口类型 | 期望路径 | Global Prefix 自动变成 |
| --- | --- | --- |
| 管理接口 | `/api/v1/api-hub/projects` | `/api/v1/api-hub/projects` ✅ 符合预期 |
| 开放接口 | `/v1/chat/completions` | `/api/v1/v1/chat/completions` ❌ 不兼容 OpenAI SDK |

**解决方案**：

| 方案 | 做法 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **A（推荐）** | 在 `main.ts` 中配置 `exclude`，排除 `/v1/*` 路由不套用 global prefix | 最简单的 MVP 交付方式，真正兼容 OpenAI SDK | NestJS v10+ 才内置支持，v9 需手动处理 |
| **B** | 为 API Hub 开放接口单独创建子应用 `NestFactory.createMicroservice()` 或独立 Express App | 彻底隔离，无 prefix 污染 | 引入额外复杂度，MVP 阶段过度工程 |
| **C（不推荐）** | 短期接受 `/api/v1/v1/chat/completions` | 零改动 | 不兼容 OpenAI SDK 的 `base_url`，用户需要额外配置路径，体验差 |

**MVP 阶段决策**：

优先采用 **方案 A**，确保 `/v1/chat/completions` 和 `/v1/models` 与 OpenAI-compatible 预期一致。管理接口继续走 `/api/v1/api-hub/...`。

**实现要点（方案 A）**：

```typescript
// main.ts
app.setGlobalPrefix("api/v1", {
  exclude: ["v1/(.*)"], // /v1/chat/completions, /v1/models 不加前缀
});
```

注意：如果 `ChatCompletionsController` 使用 `@Controller("v1")` 装饰器，配合排除规则后，实际生效路径为 `/v1/chat/completions`，无需把 controller 挂到根 `/`。

## 4. 模块拆分

### 4.1 ApiHubModule（主模块）

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApiProject,
      ApiKey,
      ApiUsageLog,
      ApiQuotaAccount,
      ApiQuotaLedger,
      ApiModelConfig,
    ]),
  ],
  controllers: [
    ApiProjectsController,
    ApiKeysController,
    ApiModelsController,
    ChatCompletionsController,
  ],
  providers: [
    ApiProjectService,
    ApiKeyService,
    ApiUsageService,
    ApiQuotaService,
    ApiModelService,
    ChatCompletionsProxyService,
  ],
  exports: [],
})
export class ApiHubModule {}
```

### 4.2 服务职责

| 服务 | 职责 | 依赖 |
| --- | --- | --- |
| `ApiProjectService` | Project CRUD，关联当前登录用户 | TypeORM Repository |
| `ApiKeyService` | Key 生成（`moy_sk_` + 32 hex）、SHA-256 哈希存储、prefix 提取、enable/disable、鉴权校验 | ApiProject |
| `ApiUsageService` | 调用日志写入、列表查询、按模型/时间/状态筛选 | ApiKey, ApiProject |
| `ApiQuotaService` | 额度账户初始化（新用户赠送 ¥10）、调用扣减、余额查询、流水记录、超额拦截 | ApiProject, ApiQuotaAccount, ApiQuotaLedger |
| `ApiModelService` | 模型列表配置（从环境变量/配置文件读取）、模型状态管理、上游 provider 映射 | ApiModelConfig |
| `ChatCompletionsProxyService` | 接收 `/v1/chat/completions` 请求 → 鉴权 → 限流 → 校验 → 配额检查 → 转发上游 → 记录日志 → 返回 | ApiKeyService, ApiQuotaService, ApiUsageService |

### 4.3 控制器路由

| 控制器 | 基础路径 | 用途 |
| --- | --- | --- |
| `ApiProjectsController` | `api/v1/api-hub/projects` | 管理接口 |
| `ApiKeysController` | `api/v1/api-hub/keys` | 管理接口 |
| `ApiModelsController` | `api/v1/api-hub/models` | 管理接口 + 对外开放 |
| `ChatCompletionsController` | `v1` | 开放接口（不挂 `/api/v1`） |

## 5. 数据模型

### 5.1 实体清单

| 实体 | 表名 | 数据库 | 参考文档 |
| --- | --- | --- | --- |
| `ApiProject` | `api_project` | moy_api_hub | [02_§4](./02_API_Key与用量模型.md#4-project-表) |
| `ApiKey` | `api_key` | moy_api_hub | [02_§5](./02_API_Key与用量模型.md#5-apikey-表) |
| `ApiUsageLog` | `api_usage_log` | moy_api_hub | [02_§8](./02_API_Key与用量模型.md#8-usagelog-表) |
| `ApiQuotaAccount` | `api_quota_account` | moy_api_hub | [02_§6](./02_API_Key与用量模型.md#6-quotaaccount-表) |
| `ApiQuotaLedger` | `api_quota_ledger` | moy_api_hub | [02_§7](./02_API_Key与用量模型.md#7-quotaledger-表) |
| `ApiModelConfig` | `api_model_config` | moy_api_hub | 本次新增，见 §5.2 |

### 5.2 ApiModelConfig 表

```sql
CREATE TABLE api_model_config (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id            VARCHAR(100) NOT NULL UNIQUE,
    display_name        VARCHAR(200) NOT NULL,
    provider            VARCHAR(50) NOT NULL,
    upstream_model      VARCHAR(100) NOT NULL,
    context_window      INTEGER NOT NULL,
    max_output_tokens   INTEGER NOT NULL,
    prompt_price_per_1k DECIMAL(12, 8) NOT NULL DEFAULT 0,
    completion_price_per_1k DECIMAL(12, 8) NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'available',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| 字段 | 说明 |
| --- | --- |
| model_id | API 对外的模型标识，如 `gpt-4o` |
| display_name | 展示名称，如 `GPT-4o` |
| provider | 供应商，如 `openai` |
| upstream_model | 上游实际模型名，如 `gpt-4o-2024-08-06` |
| prompt_price_per_1k | prompt 千 token 成本（人民币） |
| completion_price_per_1k | completion 千 token 成本（人民币） |
| status | `available` / `maintenance` / `deprecated` |

### 5.3 数据模型注意事项

| 注意事项 | 说明 |
| --- | --- |
| API Key 安全 | `key_hash` 存 SHA-256，`key_prefix` 存前 12 位（含 `moy_sk_` 前缀）。完整 Key 仅创建时返回一次 |
| 额度精度 | `DECIMAL(12,8)` 保证 8 位小数精度，避免浮点计算误差 |
| 幂等 | `request_id` 唯一约束，客户端可传，服务端也可生成 |
| ORM 映射 | TypeORM `@Entity()` + `@Column()` 装饰器，字段名 camelCase，数据库列名 snake_case（`@Column({ name: 'company_name' })`） |

## 6. API 设计

### 6.1 管理接口

| 方法 | 路径 | 认证 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/api-hub/projects` | JWT | 当前用户的项目列表 |
| `POST` | `/api/v1/api-hub/projects` | JWT | 创建项目 |
| `DELETE` | `/api/v1/api-hub/projects/:id` | JWT | 删除项目 |
| `GET` | `/api/v1/api-hub/keys` | JWT | 项目的 Key 列表（不返回完整 Key） |
| `POST` | `/api/v1/api-hub/keys` | JWT | 创建 Key，返回完整 Key（仅此一次） |
| `PATCH` | `/api/v1/api-hub/keys/:id/disable` | JWT | 禁用 Key |
| `PATCH` | `/api/v1/api-hub/keys/:id/enable` | JWT | 启用 Key |
| `GET` | `/api/v1/api-hub/models` | — | 可用模型列表（也可对外开放） |
| `GET` | `/api/v1/api-hub/usage` | JWT | 当前项目的用量概览 |

### 6.2 开放接口

| 方法 | 路径 | 认证 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/v1/models` | Bearer | 模型列表（OpenAI 兼容） |
| `POST` | `/v1/chat/completions` | Bearer | Chat Completions（OpenAI 兼容） |

开放接口**不挂** `/api/v1` 路径前缀，模拟 OpenAI 的 `https://api.openai.com/v1/` 入口结构。

### 6.3 管理接口请求/响应示例

**POST /api/v1/api-hub/projects**

```json
// Request
{ "name": "My Chat App", "description": "我的第一个 AI 应用" }

// Response 201
{
  "id": "proj_abc123",
  "name": "My Chat App",
  "status": "active",
  "createdAt": "2026-05-03T10:00:00Z"
}
```

**POST /api/v1/api-hub/keys**

```json
// Request
{ "projectId": "proj_abc123", "name": "dev key" }

// Response 201 — 完整 Key 仅此一次！
{
  "id": "key_xyz789",
  "key": "moy_sk_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  "keyPrefix": "moy_sk_a1b2",
  "name": "dev key",
  "enabled": true,
  "createdAt": "2026-05-03T10:05:00Z"
}
```

**GET /api/v1/api-hub/keys**

```json
// Response 200 — 不返回完整 Key
{
  "data": [
    {
      "id": "key_xyz789",
      "keyPrefix": "moy_sk_a1b2",
      "name": "dev key",
      "enabled": true,
      "lastUsedAt": null,
      "createdAt": "2026-05-03T10:05:00Z"
    }
  ]
}
```

## 7. 鉴权设计

### 7.1 管理接口鉴权

复用现有 MOY App 的 JWT 认证体系：

- `@UseGuards(JwtAuthGuard, TenantGuard)` 保护管理接口
- `org_id` 从当前登录上下文获取
- API Hub 的 project/user 关联通过 `user_id` 实现

### 7.2 开放接口鉴权

实现独立的 Bearer Token Guard：

```typescript
// api-key.guard.ts（伪代码）
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = extractBearerToken(req.headers.authorization);

    if (!token) throw new UnauthorizedException();

    const hash = sha256(token);
    const key = await this.apiKeyService.findByHash(hash);

    if (!key || !key.enabled) throw new UnauthorizedException();

    req.apiKey = key;
    req.project = key.project;
    return true;
  }
}
```

| 规则 | 说明 |
| --- | --- |
| Token 格式 | `moy_sk_` + 32 hex |
| 存储方式 | 数据库只存 `key_hash`（SHA-256），不存明文 |
| prefix 展示 | `key_prefix` 取前 12 字符（`moy_sk_a1b2`），用于界面识别 |
| 创建返回 | 完整 Key 仅在 `POST /api-hub/keys` 响应中返回一次 |
| 二次查询 | 没有任何接口可以二次查询已创建 Key 的明文 |

## 8. MVP 转发策略

### 8.1 转发流程

```
POST /v1/chat/completions
  │
  ├─[1] AuthGuard：提取 Bearer token → SHA-256 → 查 ApiKey → 验证 enabled
  ├─[2] RateLimitGuard：按 key_id 检查 QPS → 超限返回 429
  ├─[3] 参数校验：model 有无 → messages 格式 → temperature 范围
  ├─[4] 额度检查：查询 ApiQuotaAccount → 余额 > 0?
  ├─[5] 模型适配：ApiModelService 查找 provider + upstream_model
  ├─[6] HTTP POST → 上游供应商 API
  ├─[7] 响应处理：提取 usage.tokens → 计算成本
  ├─[8] 日志写入：INSERT ApiUsageLog
  └─[9] 额度扣减：UPDATE ApiQuotaAccount, INSERT ApiQuotaLedger
       │
       └─► 返回 OpenAI 兼容格式 JSON
```

### 8.2 MVP 阶段限制

| 项目 | MVP 策略 | 后期 |
| --- | --- | --- |
| 供应商数量 | 1 个（从环境变量配置） | ≥3 个 |
| 失败处理 | 记录日志 + 返回 502 | 自动 fallback |
| Stream | 不支持，传 `stream: true` 返回错误说明 | MVP+1 |
| 缓存 | 不做 | S3 |
| 重试 | 1 次（仅 5xx/网络错误） | 智能重试 |
| 超时 | 60 秒 | 可配置 |

### 8.3 环境变量

```bash
# .env
API_HUB_DEFAULT_PROVIDER=openai
API_HUB_OPENAI_BASE_URL=https://api.openai.com
API_HUB_OPENAI_API_KEY=sk-xxxxxxxx
API_HUB_RATE_LIMIT_QPS=10
API_HUB_NEW_USER_QUOTA=10
```

### 8.4 错误透传

上游供应商返回错误时，转为 OpenAI 兼容格式：

```json
{
  "error": {
    "message": "The model is currently overloaded. Please try again later.",
    "type": "api_error",
    "code": "upstream_unavailable"
  }
}
```

HTTP 状态码：供应商 4xx → 400，供应商 5xx → 502。

## 9. 验收标准

| # | 场景 | 验证方式 | 任务 |
|:---:|---|:---:|---|
| 1 | 能创建 API Project | 手动 / 接口测试 | API-HUB-BE-002 |
| 2 | 能创建 API Key，完整 Key 只展示一次 | 手动 | API-HUB-BE-003 |
| 3 | Key 列表不包含完整 Key，只有 prefix | 手动 | API-HUB-BE-003 |
| 4 | 禁用的 Key 调用返回 401 | 自动化测试 | API-HUB-BE-003 |
| 5 | 无效 Key 调用返回 401 | 自动化测试 | API-HUB-BE-003 |
| 6 | `GET /v1/models` 返回模型列表 | 手动 / cURL | API-HUB-BE-004 |
| 7 | `POST /v1/chat/completions` 正常返回 | 手动 / cURL | API-HUB-BE-005 |
| 8 | 每次调用写入 `ApiUsageLog`（含 model/tokens/cost/status） | 查数据库 | API-HUB-BE-006 |
| 9 | 额度按实际成本扣减 | 查 ApiQuotaAccount + ApiQuotaLedger | API-HUB-BE-007 |
| 10 | 额度耗尽后调用返回 402 | 自动化测试 | API-HUB-BE-007 |
| 11 | 高频调用触发限流返回 429 | 自动化测试 | API-HUB-BE-008 |
| 12 | 不影响 MOY App 原有模块（auth/cm/lm/om 等） | 全量测试 | API-HUB-BE-009 |

## 10. 任务拆分

| ID | 任务 | 说明 | 预估工时 | 前置 |
| --- | --- | --- |:---:|--- |
| API-HUB-BE-001 | 数据模型与 migration | 6 个 Entity + TypeORM migration + `moy_api_hub` 数据库创建 | 4h | — |
| API-HUB-BE-002 | API Project CRUD | `ApiProjectService` + `ApiProjectsController`，关联 `user_id` | 3h | 001 |
| API-HUB-BE-003 | API Key 创建/禁用/鉴权 | `ApiKeyService`（生成/哈希/prefix/enable-disable）+ `ApiKeyGuard`（Bearer 鉴权） | 5h | 001 |
| API-HUB-BE-004 | 模型配置 | `ApiModelService` + `ApiModelsController`，从 env/DB 读取模型列表 | 3h | 001 |
| API-HUB-BE-005 | Chat Completions Proxy | `ChatCompletionsProxyService` + `ChatCompletionsController`，转发流程 §8.1 | 6h | 003, 004 |
| API-HUB-BE-006 | Usage Log | `ApiUsageService`，在 proxy 完成后写入日志 | 3h | 005 |
| API-HUB-BE-007 | Quota 扣减 | `ApiQuotaService`（初始化赠送/调用扣减/超额拦截/流水） | 5h | 001, 005 |
| API-HUB-BE-008 | 基础限流 | `RateLimitGuard`，按 Key QPS 限流，429 + Retry-After | 3h | 003 |
| API-HUB-BE-009 | 单元测试 | 所有 service + guard 单元测试（jest） | 6h | 002-008 |
| API-HUB-BE-010 | Smoke Test | 端到端烟雾测试：注册 → 创建 Key → 调用 → 查日志 → 查额度 | 3h | 001-008 |

**总计预估**：约 41 小时（纯开发，不含环境搭建和 CR）。

## 11. 与前端对接

管理接口在 `backend/src/modules/api-hub/controllers/` 下，前端 `sites/api` 后续对接：

| 管理功能 | 前端页面 | 后端接口 |
| --- | --- | --- |
| 项目列表/创建 | Project 管理页 | `GET/POST /api-hub/projects` |
| Key 列表/创建/禁用 | Key 管理页 | `GET/POST /api-hub/keys` + `PATCH .../disable` |
| 用量面板 | Dashboard | `GET /api-hub/usage` |
| 调用日志 | 日志页面 | `GET /api-hub/usage?details=true` |

开放接口（`/v1/chat/completions`）由外部开发者通过 `sites/api` 文档页的 cURL/Python 示例调用。

## 12. 版本记录

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| v0.1 | 2026-05 | 初版，MOY API MVP 后端开发任务拆分与验收标准 |
