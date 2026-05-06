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

### 本地调试流程

1. 启动 backend：`npm --prefix backend run start:dev`（http://localhost:3001）
2. 启动 sites/api：`npm --prefix sites/api run dev`（http://localhost:5177）
3. 打开 `http://localhost:5177/console`
4. 输入 MOY JWT（从 MOY App 登录后获取）
5. 创建 Project
6. 创建 Model：`moy-mock-chat`
7. 将 Model 启用到 Project
8. 配置 Quota（当月额度）
9. 创建 API Key（仅显示一次 → 复制 → 一键填入测试区）
10. 测试 `GET /v1/models`
11. 测试 `POST /v1/chat/completions`

### 关键约定

- API Key 格式：`moy_sk_` + 32 hex 字符
- `/v1/chat/completions` 当前返回 mock response，**不接真实 provider**
- quota 未配置或不足返回 `402 Payment Required`
- 管理接口（/api/v1/api-hub/*）需要 MOY JWT；开放接口（/v1/*）需要 Bearer API Key

### 本地 curl 示例

```bash
curl http://localhost:3001/v1/chat/completions \
  -H "Authorization: Bearer $MOY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"moy-mock-chat","messages":[{"role":"user","content":"Hello MOY API"}]}'
```

### 生产占位 endpoint

```
https://api.app.moy.com/v1/chat/completions
```

> api.moy.com 当前是产品站和开发者入口；真实开放 API endpoint 后续可迁移到 api.moy.com/v1。

## 当前状态

产品介绍页 (/) + Developer Console (/console)。API Hub 后端已实现 Foundation + OpenAI-Compatible Entry。

## 后续计划

- S2：真实 Provider Proxy（接入 OpenAI / DeepSeek 等）
- S3：正式开发者门户（注册、登录、在线控制台）
- S4：在线支付、企业套餐管理
