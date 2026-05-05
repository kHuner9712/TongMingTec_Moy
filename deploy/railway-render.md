# 方案 A-2：后端部署（Railway / Render）

## 概述

NestJS 后端不能部署到 Vercel（不是纯静态），需要 Node.js 托管平台。推荐以下三个选项，按推荐度排序。

---

## 选项 1：Railway（推荐）

### 特点

- 一键部署 Node.js
- 内建 PostgreSQL（可选）
- 自动域名 + SSL
- $5/月起

### 部署步骤

#### 1. 创建 Railway 项目

Railway Dashboard → "New Project" → "Deploy from GitHub repo" → 选择 `TongMingTec_Moy`

#### 2. 配置

在 Project Settings → Service Settings：

| 配置项 | 值 |
|--------|------|
| **Root Directory** | `backend` |
| **Build Command** | `npm run build` |
| **Start Command** | `node dist/main.js` |

#### 3. 环境变量

在 Variables 面板中添加：

```
NODE_ENV=production
PORT=3001

DB_HOST=<Railway PostgreSQL 内网地址>
DB_PORT=5432
DB_USERNAME=<数据库用户名>
DB_PASSWORD=<数据库密码>
DB_DATABASE=moy_app

JWT_SECRET=<强随机值>
JWT_EXPIRES_IN=7d

CORS_ORIGINS=https://moy.com,https://www.moy.com,https://geo.moy.com,https://api.moy.com,https://app.moy.com

GEO_LEAD_NOTIFY_WEBHOOK_TYPE=none
GEO_LEAD_NOTIFY_WEBHOOK_URL=
```

#### 4. 数据库（可选）

Railway 内建 PostgreSQL 插件：

- 在 Service 页面点击 "Add" → "Database" → "PostgreSQL"
- 服务间自动内网通信，不需要公网连接
- 连接信息自动注入环境变量

如果不用 Railway 内建数据库，也可以用 Supabase/Neon 免费层 + 手动配置连接信息。

#### 5. 运行 Migration

在 Railway 中打开项目的 Shell：

```bash
cd backend
npm run migration:run
```

#### 6. 域名绑定

Railway 自动分配 `xxx.railway.app` 域名，在 Settings → Custom Domain 绑定：

```
api.app.moy.com
```

在 DNS 服务商添加 A 记录指向 Railway 提供的 IP。

#### 7. 验证

```bash
curl https://api.app.moy.com/api/v1/docs
GEO_SMOKE_BASE_URL=https://api.app.moy.com npm run test:smoke:geo-leads
```

---

## 选项 2：Render

### 特点

- 免费层可用
- 自动域名 + SSL
- 构建/部署时间可预测

### 部署步骤

#### 1. 创建 Web Service

Render Dashboard → "New" → "Web Service" → 选择 `TongMingTec_Moy`

| 配置项 | 值 |
|--------|------|
| **Name** | `moy-backend` |
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/main.js` |

#### 2. 环境变量

内容同 Railway（见上表）。

#### 3. 数据库

Render 也提供 PostgreSQL（$7/月），也可用 Supabase 免费层。

#### 4. 运行 Migration

在 Render Dashboard 打开 Shell：

```bash
cd backend
npm run migration:run
```

#### 5. 域名绑定

Settings → Custom Domain → `api.app.moy.com`

DNS 添加 A 记录指向 Render 提供的 IP。

---

## 选项 3：Supabase（仅数据库）

如果 Railway/Render 平台收费超出预算，可单独用 Supabase 免费层做数据库：

### Supabase 免费层

- 500MB 存储
- 2 个项目
- 自动 SSL

### 数据库创建

1. Supabase Dashboard → New Project
2. 记录连接信息（Host / Port / User / Password / Database）
3. 用这些信息配置 backend 的 `DB_*` 环境变量

---

## 通用验证清单

```bash
# 1. 后端启动正常
curl https://api.app.moy.com/api/v1/docs
# 应返回 Swagger UI HTML 或 JSON

# 2. GEO 提交接口可访问
curl -X POST https://api.app.moy.com/api/geo/leads \
  -H "Content-Type: application/json" \
  -d '{
    "companyName":"Deploy Test",
    "brandName":"Deploy Test",
    "website":"https://deploy-test.example.com",
    "industry":"Technology",
    "contactName":"Tester",
    "contactMethod":"deploy-test-001"
  }'
# 应返回 201 + real UUID id

# 3. 管理接口受保护
curl https://api.app.moy.com/api/v1/geo-leads
# 应返回 401

# 4. Smoke test
GEO_SMOKE_BASE_URL=https://api.app.moy.com npm run test:smoke:geo-leads
```

---

## 成本（方案 A 总计）

| 项目 | 平台 | 月费 |
|------|------|------|
| 4 个静态站 | Vercel Free | ¥0 |
| 后端 NestJS | Railway Hobby | $5 (≈¥36) |
| PostgreSQL | Railway DB / Supabase | $5 ≈¥36 / ¥0 |
| 域名 | moy.com | ≈¥70/年 |
| **合计** | | **≈¥72/月 + ¥70/年** |
