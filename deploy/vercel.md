# 方案 A-1：Vercel 静态站点部署

## 概述

4 个静态站点通过 Vercel 托管。每个站点是一个独立的 Vercel Project，自动从 GitHub 仓库的对应子目录构建和部署。

---

## Vercel Project 配置

### 1. moy.com（品牌官网）

| 配置项 | 值 |
|--------|------|
| **Framework Preset** | Vite |
| **Root Directory** | `sites/official` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

**域名绑定**：

```
moy.com → 主域名
www.moy.com → Redirect to moy.com
```

### 2. geo.moy.com（GEO 服务站）

| 配置项 | 值 |
|--------|------|
| **Framework Preset** | Vite |
| **Root Directory** | `sites/geo` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

**环境变量**：

| 变量 | 值 |
|------|------|
| `VITE_GEO_LEAD_ENDPOINT` | `https://api.app.moy.com/api/geo/leads` |

**域名绑定**：

```
geo.moy.com → 主域名
```

### 3. api.moy.com（API 开发者平台）

| 配置项 | 值 |
|--------|------|
| **Framework Preset** | Vite |
| **Root Directory** | `sites/api` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

**域名绑定**：

```
api.moy.com → 主域名
```

### 4. app.moy.com（MOY App 前端）

| 配置项 | 值 |
|--------|------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

**环境变量**：

| 变量 | 值 |
|------|------|
| `VITE_API_BASE_URL` | `https://api.app.moy.com/api/v1` |

**域名绑定**：

```
app.moy.com → 主域名
```

---

## DNS 配置

在域名 DNS 服务商（如阿里云/Cloudflare）添加以下记录：

| 类型 | 名称 | 值 |
|------|------|------|
| CNAME | `@` (moy.com) | `cname.vercel-dns.com` |
| CNAME | `www` | `cname.vercel-dns.com` |
| CNAME | `geo` | `cname.vercel-dns.com` |
| CNAME | `api` | `cname.vercel-dns.com` |
| CNAME | `app` | `cname.vercel-dns.com` |
| A | `api.app` | Railway/Render 分配的 IP |

> 注意：如果 DNS 服务商不支持 CNAME 裸域（apex domain），需要改用 A 记录指向 `76.76.21.21`。

---

## 部署步骤

### 步骤 1：登录 Vercel

```bash
# 浏览器打开
https://vercel.com/

# 点击 "Continue with GitHub"
# 授权访问 TongMingTec_Moy 仓库
```

### 步骤 2：创建 4 个 Project

对每个站点重复以下操作：

1. Vercel Dashboard → "Add New..." → "Project"
2. 选择 `kHuner9712/TongMingTec_Moy` 仓库
3. 配置 Framework Preset = Vite
4. 配置 Root Directory（见上表）
5. 配置 Environment Variables（见上表）
6. 点击 "Deploy"
7. 部署完成后进入 Settings → Domains，绑定域名

### 步骤 3：验证

```bash
# 检查各站点 HTTP 200
curl -I https://moy.com
curl -I https://geo.moy.com
curl -I https://api.moy.com

# 检查 SSL 证书
curl -I https://moy.com 2>&1 | grep -i "strict-transport-security"

# 检查 www 重定向
curl -I https://www.moy.com -L -o /dev/null -w "%{url_effective}\n"
# 输出应为 https://moy.com/
```

---

## 自动部署

Vercel 默认监听 `main` 分支的 push 事件，自动触发构建和部署。

如果只想特定路径变更时触发，在 Vercel Project Settings → Git 中配置 "Ignored Build Step"：

```bash
# 示例：只有 sites/official 变更时才构建
if git diff --quiet HEAD^ HEAD -- sites/official/; then
  echo "No changes in sites/official"
  exit 1
fi
```

---

## Vercel 免费限额

| 项目 | 限额 |
|------|------|
| Bandwidth | 100 GB / 月 |
| Build Execution | 6000 分钟 / 月 |
| Serverless Function | 100 GB-Hrs / 月 |
| 并发构建 | 1 个 |

4 个纯静态站点在 MVP 阶段完全在免费额度内（无 Serverless Function）。
