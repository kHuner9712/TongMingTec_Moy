# Developer Console MVP 实现说明

> **实施日期**：2026-05-07
> **阶段**：MOY API Hub 第三阶段 — Developer Console MVP
> **前置**：[09_OpenAI兼容入口MVP](./09_OpenAI兼容入口MVP.md)

## 1. Console 页面定位

`/console` 是 MOY API 的开发者调试控制台，用于本地端到端验证 API Hub 的完整调用链路：

**Project → Model → Project Model 启用 → Quota 配置 → API Key → /v1/models → /v1/chat/completions mock test**

不做正式 SaaS 控制台，不接真实 provider，不做 billing/payment。

## 2. 页面路径

| 路径 | 说明 |
| --- | --- |
| `/` | MOY API 产品官网 |
| `/console` | Developer Console |

本地访问：`http://localhost:5177/console`

路由使用 `window.location.pathname` 判断，不引入 React Router。

## 3. 环境变量

```bash
# sites/api/.env
VITE_API_HUB_ADMIN_BASE_URL=http://localhost:3001/api/v1/api-hub
VITE_API_HUB_OPENAI_BASE_URL=http://localhost:3001/v1

# production:
# VITE_API_HUB_ADMIN_BASE_URL=https://api.app.moy.com/api/v1/api-hub
# VITE_API_HUB_OPENAI_BASE_URL=https://api.app.moy.com/v1
```

## 4. Token 临时方案

| localStorage Key | 用途 |
| --- | --- |
| `moy_api_admin_token` | MOY JWT，用于管理接口鉴权 |
| `moy_api_test_key` | API Key（moy_sk_...），用于开放接口测试 |

当前为内部调试控制台，后续接入统一登录。

## 5. Console 功能区块

### 5.1 Token 设置

- 输入/保存/清除 MOY Admin JWT
- 输入/保存/清除 API Key（用于测试调用）
- 提示："当前为内部调试控制台，后续接入统一登录。"

### 5.2 Project 管理

调用接口：
- `GET /api/v1/api-hub/projects` — 列表
- `POST /api/v1/api-hub/projects` — 创建
- `DELETE /api/v1/api-hub/projects/:id` — 归档

功能：创建、列表、选择当前 Project、显示 Project ID、归档。

### 5.3 Model 管理

调用接口：
- `GET /api/v1/api-hub/models`
- `POST /api/v1/api-hub/models`

创建表单字段：name、modelId（默认 moy-mock-chat）、provider（默认 moy）、status、category、maxInputTokens、maxOutputTokens、supportsStreaming、supportsVision、supportsFunctionCalling。

### 5.4 Project Model 启用

调用接口：
- `POST /api/v1/api-hub/projects/:id/models` — 启用
- `GET /api/v1/api-hub/projects/:id/models` — 列表
- `PATCH /api/v1/api-hub/projects/:id/models/:modelId` — 禁用
- `DELETE /api/v1/api-hub/projects/:id/models/:modelId` — 移除

### 5.5 Quota 配置

调用接口：
- `POST /api/v1/api-hub/projects/:id/quota` — 设置
- `GET /api/v1/api-hub/projects/:id/quota` — 列表
- `PATCH /api/v1/api-hub/projects/:id/quota/:quotaId` — 更新
- `GET /api/v1/api-hub/projects/:id/remaining?modelId=` — 剩余额度

period 默认当前 YYYY-MM，quotaLimit 默认 10000。

### 5.6 API Key 管理

调用接口：
- `POST /api/v1/api-hub/projects/:projectId/keys` — 创建
- `GET /api/v1/api-hub/projects/:projectId/keys` — 列表
- `DELETE /api/v1/api-hub/projects/:projectId/keys/:id` — 吊销

功能：创建 Key → 完整 key 只显示一次 → 复制 → 一键用于测试调用。列表只显示 keyPrefix/status/createdAt。

### 5.7 OpenAI-compatible 测试调用

使用：
- `GET {VITE_API_HUB_OPENAI_BASE_URL}/models`
- `POST {VITE_API_HUB_OPENAI_BASE_URL}/chat/completions`

功能：
- 测试 /v1/models — 展示 JSON 响应
- 测试 /v1/chat/completions — 输入消息，展示 JSON 响应 + usage 详情
- 错误展示：401/402/403/400

### 5.8 curl 示例生成

根据当前 API Key、model、message 自动生成 curl 命令，提供复制按钮。

## 6. 后端收口：quota 错误码调整

本阶段同步修复：quota 相关错误码从 403 改为 402（Payment Required）。

| 场景 | 旧状态码 | 新状态码 |
| --- | --- | --- |
| quota_not_configured | 403 | **402** |
| quota_exceeded | 403 | **402** |
| model_not_enabled | 403 | 403（不变） |

实现：
```typescript
throw new HttpException({
  error: { message: "...", type: "invalid_request_error", code: "quota_not_configured" }
}, HttpStatus.PAYMENT_REQUIRED); // 402
```

## 7. 文件结构

```
sites/api/src/
├── console/
│   ├── ApiConsolePage.tsx          # 主页面
│   ├── apiConsoleTypes.ts          # 类型定义
│   ├── apiHubAdminApi.ts           # 管理接口封装
│   ├── openaiTestApi.ts            # 开放接口封装
│   ├── consoleStorage.ts           # localStorage 操作
│   └── components/
│       ├── ConsoleTokenPanel.tsx    # Token 设置
│       ├── ProjectPanel.tsx        # Project 管理
│       ├── ModelPanel.tsx          # Model 管理
│       ├── ProjectModelPanel.tsx   # 模型启用
│       ├── QuotaPanel.tsx          # Quota 配置
│       ├── ApiKeyPanel.tsx         # API Key 管理
│       ├── OpenAiTestPanel.tsx     # 测试调用
│       └── CurlSnippet.tsx         # curl 示例
├── App.tsx                         # 路由判断 /console
├── styles.tsx                      # 样式常量
└── vite-env.d.ts                   # Vite 类型声明
```

## 8. 不做的边界

- 不接真实 provider
- 不做注册/登录系统
- 不开发正式 SaaS 控制台
- 不影响 MOY App / MOY GEO
- 不影响 backend Foundation 接口

## 9. 后续规划

- 真实 Provider Proxy：接入 OpenAI / DeepSeek / Claude 等
- 正式开发者门户：注册、登录、在线 API Key 管理
- 用量面板、调用日志查询
- 计费、企业套餐

## 10. 版本记录

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| v1.0 | 2026-05-07 | Developer Console MVP 完成：6 大功能区块 + 后端 quota 错误码收口 |
