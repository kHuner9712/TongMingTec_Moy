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
```

## /console — Developer Console

访问 `http://localhost:5177/console` 进入开发者控制台。

### 用途

用于本地调试 API Hub 的全链路闭环：

Project → Model → Project Model 启用 → Quota 配置 → API Key → /v1/models → /v1/chat/completions mock test

### 使用流程

1. **获取 MOY JWT**：从 MOY App 登录后获取 JWT Token，填入 Console 的 Token 面板
2. **创建 Project**：在 Project 管理区创建并选择一个 Project
3. **创建 Mock Model**：用默认 `moy-mock-chat` 配置创建一个 Model
4. **启用模型到项目**：将 Model 启用到当前 Project
5. **设置 Quota**：为 Project + Model 设置当月额度
6. **创建 API Key**：创建 Key，复制明文（仅一次），一键填入测试调用区
7. **测试 /v1/models**：点击按钮调用开放接口
8. **测试 /v1/chat/completions**：输入消息，发送 mock 请求

### 当前状态

**/v1/chat/completions 返回 mock response**，不接真实 provider。

## 当前状态

产品介绍页 (/) + Developer Console (/console)。API Hub 后端已实现 Foundation + OpenAI-Compatible Entry。

## 后续计划

- S2：真实 Provider Proxy（接入 OpenAI / DeepSeek 等）
- S3：正式开发者门户（注册、登录、在线控制台）
- S4：在线支付、企业套餐管理
