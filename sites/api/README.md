# MOY API

多模型 API 网关与开发者平台，对应域名：**api.moy.com**。

## 站点定位

MOY API 为开发者提供 OpenAI 兼容的统一接口，调用多个大语言模型供应商的能力，并提供 API Key 管理、用量统计、调用日志、限流和成本控制。本网站是 API 产品对外展示和开发者入口。

## 本地启动

```bash
npm install
npm run dev        # http://localhost:5177
```

## 构建

```bash
npm run build      # tsc --noEmit && vite build → dist/
```

## 环境变量

```bash
# 开发环境（复制 .env.example 为 .env）
VITE_API_HUB_ADMIN_BASE_URL=http://localhost:3001/api/v1/api-hub
VITE_API_HUB_OPENAI_BASE_URL=http://localhost:3001/v1

# 生产占位
# VITE_API_HUB_ADMIN_BASE_URL=https://api.app.moy.com/api/v1/api-hub
# VITE_API_HUB_OPENAI_BASE_URL=https://api.app.moy.com/v1
```

## /console — Developer Console

访问 `http://localhost:5177/console` 进入开发者控制台。

### 一键初始化 (推荐)

```bash
# 设置 MOY JWT token
$env:API_HUB_SEED_JWT="eyJhbGci..."

# 运行 seed 脚本（自动创建 DeepSeek 完整测试链路）
npm run seed:api-hub:deepseek

# 运行 smoke test 验证（本地 http）
$env:API_HUB_SMOKE_BASE_URL="http://localhost:3001"
$env:API_HUB_SMOKE_KEY="<seed 输出的 key>"
$env:API_HUB_SMOKE_MODEL="moy-deepseek-chat"
npm run test:smoke:api-hub-deepseek

# 生产环境（https）
# $env:API_HUB_SEED_BASE_URL="https://api.app.moy.com"
# $env:API_HUB_SMOKE_BASE_URL="https://api.app.moy.com"
```

seed 需要 MOY JWT；smoke 需要 `moy_sk_` API Key。两个脚本均支持 http 和 https。

### 手动调试流程

1. 启动 backend：`npm --prefix backend run start:dev`（http://localhost:3001）
2. 启动 sites/api：`npm --prefix sites/api run dev`（http://localhost:5177）
3. 打开 `http://localhost:5177/console`
4. 输入 MOY JWT（从 MOY App 登录后获取）
5. 创建 Provider Config（先创建 deepseek）
6. 创建 Project
7. 创建 Model：`moy-deepseek-chat`（provider=deepseek, upstreamModel=deepseek-chat）
8. 将 Model 启用到 Project
9. 配置 Quota（当月额度 100000 tokens）
10. 创建 API Key（仅显示一次 → 复制 → 一键填入测试区）
11. 测试 `GET /v1/models`
12. 测试 `POST /v1/chat/completions`

### 关键约定

- API Key 格式：`moy_sk_` + 32 hex 字符
- Provider Config 删除 = 软停用（status→inactive，不物理删除）
- Mock provider 兼容：`__mock__`（推荐）、`mock`、`moy`
- DeepSeek provider 走真实转发，需后端配置 `DEEPSEEK_API_KEY`
- Provider API Key 绝不存入数据库、不暴露前端、不打印日志
- stream=true 返回 400（暂不支持）
- quota 未配置或不足返回 `402 Payment Required`
- 管理接口（/api/v1/api-hub/*）需要 MOY JWT；开放接口（/v1/*）需要 Bearer API Key

### 本地 curl 示例

```bash
# mock 模型
curl http://localhost:3001/v1/chat/completions \
  -H "Authorization: Bearer $MOY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"moy-mock-chat","messages":[{"role":"user","content":"Hello MOY API"}]}'

# DeepSeek provider
curl http://localhost:3001/v1/chat/completions \
  -H "Authorization: Bearer $MOY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"moy-deepseek-chat","messages":[{"role":"user","content":"你是谁？"}]}'
```

### 生产占位 endpoint

```
https://api.app.moy.com/v1/chat/completions
```

> api.moy.com 当前是产品站和开发者入口；真实开放 API endpoint 后续可迁移到 api.moy.com/v1。

## DeepSeek Provider 配置

### Provider Config 示例

```json
{
  "provider": "deepseek",
  "displayName": "DeepSeek",
  "baseUrl": "https://api.deepseek.com",
  "apiKeyEnvName": "DEEPSEEK_API_KEY",
  "timeoutMs": 60000
}
```

### Model 示例

```json
{
  "name": "DeepSeek Chat",
  "modelId": "moy-deepseek-chat",
  "provider": "deepseek",
  "upstreamModel": "deepseek-chat",
  "status": "public",
  "category": "text"
}
```

### baseUrl 兼容性

- 推荐 `https://api.deepseek.com`
- 也可使用 `https://api.deepseek.com/v1`
- 如果官方模型名变化，通过 Console 修改 `upstreamModel` 即可

## 当前状态

产品介绍页 (/) + Developer Console (/console)。API Hub 后端已实现 Foundation + OpenAI-Compatible Entry + DeepSeek Provider Proxy + 可验证性收口。

## 后续计划

- S2：多 Provider Proxy（接入更多真实 provider）
- S3：正式开发者门户（注册、登录、在线控制台）
- S4：在线支付、企业套餐管理
