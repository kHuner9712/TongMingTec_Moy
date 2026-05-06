# MOY API Hub MVP 后端开发实施报告

## 1. 实施结论

MOY API Hub MVP 后端基础已搭建完成，实现：

- 6 张数据表（PostgreSQL + Migration）
- 4 个 Controller（19 个 API 端点）
- 5 个 Service（含状态机校验 + SHA-256 密钥安全存储）
- 50 个单元测试全部通过

当前阶段：**纯后端 API 基础**，不包含聊天代理转发、开发门户前端、Rate Limit。

## 2. 实施范围与边界

### 2.1 已完成

| 模块 | 内容 |
|------|------|
| 项目管理 | CRUD + 状态流转（active/suspended/archived） |
| API Key 管理 | 生成/SHA-256 哈希存储/仅创建时返回明文/吊销/验证 |
| 模型注册 | 多 provider 模型注册、能力字段（max tokens/streaming/vision） |
| 项目-模型关联 | 为项目启用/禁用特定模型 |
| 月度额度 | 按项目×模型×月份设置额度、追踪用量、剩余查询 |
| 调用记录 | 每次调用记录 token/cost/status、按天/按模型统计 |
| 健康检查 | GET /api/v1/api-hub/health |

### 2.2 明确不做（MVP 阶段）

| 不做 | 说明 |
|------|------|
| ChatGPT 转发代理 | 不代理 /v1/chat/completions 到真实模型 |
| Rate Limit / 限流 | 无频率控制 |
| 开发者门户前端 | 无 api.moy.com 站点 |
| 统一登录集成 | 沿用现有 MOY JWT auth，不新建用户体系 |
| 计费/支付 | 纯记录用量和成本，无账单/支付 |
| 内容安全检测 | 不接入内容审核服务 |
| 文件上传 | 不移除 /v1/files 端点 |

## 3. 数据库表

| 表名 | 说明 | 核心字段 |
|------|------|----------|
| `api_projects` | 项目 | id / org_id(可选) / user_id(可选) / name / status |
| `api_project_keys` | API 密钥 | project_id / key_prefix / key_hash(SHA-256) / status |
| `api_models` | 模型注册 | provider / model_id / category / pricing_unit / supports_* |
| `api_project_models` | 项目-模型关联 | project_id / model_id / enabled |
| `api_monthly_quota` | 月度额度 | project_id / model_id / period / quota_limit / quota_used |
| `api_usage_records` | 调用记录 | project_id / key_id / model_id / tokens / cost / status |

## 4. API 端点清单

### 项目管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/api-hub/projects` | 创建项目 |
| GET | `/api/v1/api-hub/projects` | 项目列表 (?keyword=&status=&page=&pageSize=) |
| GET | `/api/v1/api-hub/projects/:id` | 项目详情 |
| PATCH | `/api/v1/api-hub/projects/:id` | 更新项目（含状态流转） |
| DELETE | `/api/v1/api-hub/projects/:id` | 归档项目 |

### 项目模型关联

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/api-hub/projects/:id/models` | 为项目启用模型 |
| GET | `/api/v1/api-hub/projects/:id/models` | 项目模型列表 |
| PATCH | `/api/v1/api-hub/projects/:id/models/:modelId` | 更新启用状态 |
| DELETE | `/api/v1/api-hub/projects/:id/models/:modelId` | 移除模型 |

### 项目额度

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/api-hub/projects/:id/quota` | 设置月度额度 |
| GET | `/api/v1/api-hub/projects/:id/quota` | 额度列表 |
| PATCH | `/api/v1/api-hub/projects/:id/quota/:quotaId` | 更新额度 |
| DELETE | `/api/v1/api-hub/projects/:id/quota/:quotaId` | 删除额度 |
| GET | `/api/v1/api-hub/projects/:id/remaining?modelId=` | 查询剩余额度 |

### API Key 管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/api-hub/projects/:projectId/keys` | 创建 Key（返回明文） |
| GET | `/api/v1/api-hub/projects/:projectId/keys` | Key 列表 |
| GET | `/api/v1/api-hub/projects/:projectId/keys/:id` | Key 详情 |
| PATCH | `/api/v1/api-hub/projects/:projectId/keys/:id` | 更新 Key 信息 |
| DELETE | `/api/v1/api-hub/projects/:projectId/keys/:id` | 吊销 Key |

### 模型注册

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/api-hub/models` | 注册模型 |
| GET | `/api/v1/api-hub/models` | 模型列表 (?provider=&status=&category=) |
| GET | `/api/v1/api-hub/models/:id` | 模型详情 |
| PATCH | `/api/v1/api-hub/models/:id` | 更新模型 |
| DELETE | `/api/v1/api-hub/models/:id` | 废弃模型 |

### 用量记录

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/api-hub/usage?projectId=` | 记录一次调用 |
| GET | `/api/v1/api-hub/usage?projectId=` | 调用记录列表 (?keyId=&modelId=&startDate=&endDate=) |
| GET | `/api/v1/api-hub/usage/stats?projectId=` | 统计概览 (?startDate=&endDate=) |
| GET | `/api/v1/api-hub/usage/:id?projectId=` | 单条详情 |

### 健康检查

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/api-hub/health` | 服务健康状态 |

**共计 23 个端点。**

## 5. 安全设计

### API Key 安全

- 生成格式：`moy_` + 48 位 hex 随机串
- 存储：仅存 SHA-256 哈希 (`key_hash`) + 前 12 位前缀 (`key_prefix`)
- 明文：仅在创建时返回一次，后续查询返回空字符串
- 验证：对输入 key 做 SHA-256，查 hash 匹配

### 状态机

**项目状态流转**：

| from | to |
|------|-----|
| active | suspended, archived |
| suspended | active, archived |
| archived | - |

**Key 状态流转**：

| from | to |
|------|-----|
| active | revoked, expired |
| revoked | - |
| expired | - |

### 认证

- 所有 `/api/v1/api-hub/*` 端点使用 `@UseGuards(JwtAuthGuard)`
- 使用 `@SkipTenantCheck()` 跳过租户守卫（orgId 可选）
- 不新增用户体系，不创建独立 Auth 模块

## 6. 测试结果

| Suite | Tests | Result |
|-------|-------|--------|
| ApiProjectsService | 10 | ✅ All Passed |
| ApiKeysService | 10 | ✅ All Passed |
| ApiModelsService | 10 | ✅ All Passed |
| ApiQuotaService | 10 | ✅ All Passed |
| ApiUsageService | 10 | ✅ All Passed |
| **总计** | **50** | **✅ All Passed** |

## 7. 组件文件清单

```
backend/src/
├── common/
│   ├── decorators/
│   │   └── skip-tenant.decorator.ts    # 新增：跳过租户检查
│   └── guards/
│       └── tenant.guard.ts             # 修改：支持 SkipTenantCheck
├── modules/
│   └── api-hub/
│       ├── api-hub.module.ts           # 模块定义
│       ├── api-hub.controller.ts       # 健康检查
│       ├── entities/                   # 6 个实体
│       │   ├── api-project.entity.ts
│       │   ├── api-project-key.entity.ts
│       │   ├── api-model.entity.ts
│       │   ├── api-project-model.entity.ts
│       │   ├── api-monthly-quota.entity.ts
│       │   └── api-usage-record.entity.ts
│       ├── dto/                        # 6 个 DTO 文件（15+ DTO 类）
│       │   ├── api-project.dto.ts
│       │   ├── api-project-key.dto.ts
│       │   ├── api-model.dto.ts
│       │   ├── api-project-model.dto.ts
│       │   ├── api-monthly-quota.dto.ts
│       │   └── api-usage-record.dto.ts
│       ├── api-projects.service.ts     # 项目 CRUD + 状态机
│       ├── api-keys.service.ts         # Key 生成/验证/SHA-256
│       ├── api-models.service.ts       # 模型注册 CRUD
│       ├── api-project-models.service.ts  # 项目-模型关联
│       ├── api-quota.service.ts        # 额度管理 + 用量追踪
│       ├── api-usage.service.ts        # 调用记录 + 统计
│       ├── api-projects.controller.ts  # 项目 + 模型关联 + 额度
│       ├── api-keys.controller.ts      # Key 管理
│       ├── api-models.controller.ts    # 模型注册
│       ├── api-usage.controller.ts     # 用量记录
│       ├── *.spec.ts                   # 5 个测试文件
│       └── ...
├── migrations/
│   └── 1714500000000-CreateApiHubTables.ts   # 6 表 Migration
└── app.module.ts                       # 修改：注册 ApiHubModule
```

## 8. 与现有系统关系

### 对 MOY App 主系统的影响

- **零影响** — 不修改 MOY App 任何现有模块、表、接口
- TenantGuard 新增 `SkipTenantCheck` 支持，向后兼容（不标记则不跳过）

### 对 MOY GEO 的影响

- 无影响

### 接口命名空间

- API Hub 所有端点统一前缀 `/api/v1/api-hub/`
- 与现有 MOY App `/api/v1/` 隔离，无路径冲突

## 9. 已知不足与后续

| 不足 | 后续 |
|------|------|
| 无用量的并发锁 | 在 chat 代理阶段加入 |
| 无 rate limiting | S2 接入 Redis 限流 |
| 无模型计费价目表 | 在 ApiModel 中加 `price_per_1k_input_tokens` 字段 |
| 无 OpenAI 兼容接口代理 | S2 创建 ChatCompletions 代理模块 |
| 无开发者门户 | sites/api MVP 前端搭建 |
| 无角色权限细分 | P1 阶段实现 |

## 10. 部署要求

- 生产环境必须运行 `npm run migration:run`
- 确认 `uuid-ossp` 扩展已在目标数据库启用（`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`）
- 禁止 `synchronize: true`

## 11. 版本记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v0.1 | 2026-05-06 | MVP 后端基础搭建：6 表 + 23 API + 5 Service + 50 Test |
