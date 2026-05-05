# MOY 部署方案

本目录包含 MOY 产品矩阵的完整部署方案、配置模板和执行脚本。

---

## 方案总览

| 方案 | 适用场景 | 上线速度 | 运维负担 |
|------|---------|:---:|:---:|
| **A: Vercel + Railway** | 快速上线、无运维人力 | 极快（<30分钟） | 极低 |
| **B: VPS + Nginx + PM2** | 精细控制、国内低延迟 | 半天 | 中等 |

---

## 文档导航

| 文档 | 说明 |
|------|------|
| [vercel.md](./vercel.md) | 方案 A：Vercel 静态站点配置 |
| [railway-render.md](./railway-render.md) | 方案 A：后端部署（Railway / Render） |
| [vps-nginx.md](./vps-nginx.md) | 方案 B：VPS + Nginx + PM2 完整部署 |

---

## 配置文件

| 文件 | 用途 |
|------|------|
| [nginx/moy.conf.example](./nginx/moy.conf.example) | Nginx 多站点配置模板 |
| [pm2/ecosystem.config.cjs](./pm2/ecosystem.config.cjs) | PM2 进程管理配置 |
| [env/backend.production.example](./env/backend.production.example) | 后端生产环境变量模板 |
| [env/geo.production.example](./env/geo.production.example) | GEO 站点生产环境变量 |
| [env/official.production.example](./env/official.production.example) | Official 站点生产环境变量 |
| [env/api.production.example](./env/api.production.example) | API 站点生产环境变量 |

---

## 部署脚本（方案 B）

| 脚本 | 用途 |
|------|------|
| [scripts/build-sites.sh](./scripts/build-sites.sh) | 构建全部站点 |
| [scripts/deploy-vps.sh](./scripts/deploy-vps.sh) | VPS 一键部署 |
| [scripts/rollback-vps.sh](./scripts/rollback-vps.sh) | VPS 回滚脚本 |

---

## 推荐部署方案

**MVP 阶段推荐方案 A（Vercel + Railway）**：

- 4 个静态站点部署到 Vercel（免费）
- 后端部署到 Railway（$5/月）
- PostgreSQL 可用 Railway 内建或 Supabase 免费层
- 总成本约 ¥72/月

**方案 A 部署顺序**（优先三项）：

1. `api.app.moy.com`（backend → Railway）
2. `geo.moy.com`（sites/geo → Vercel）
3. `moy.com`（sites/official → Vercel）
4. `api.moy.com`（sites/api → Vercel）

---

## 部署前必须准备的资源

### 必备（无论哪种方案）

- [ ] `moy.com` 域名已购买
- [ ] 域名 DNS 管理权限可用
- [ ] GitHub 仓库权限

### 方案 A

- [ ] Vercel 账号（免费，用 GitHub 登录）
- [ ] Railway 账号（或 Render / Supabase）

### 方案 B

- [ ] 一台 VPS（阿里云/腾讯云/UCloud，2C4G，Ubuntu 22.04）
- [ ] SSH 密钥 / root 密码
- [ ] 域名 ICP 备案（如果用国内服务器）

---

## 部署后验证

```bash
# 检查后端健康
curl https://api.app.moy.com/api/v1/docs

# 检查 GEO 提交
GEO_SMOKE_BASE_URL=https://api.app.moy.com npm run test:smoke:geo-leads

# 检查站点可访问
curl -I https://moy.com
curl -I https://geo.moy.com
curl -I https://api.moy.com
```

---

## 安全提醒

- `.env` 不提交到仓库（已加入 `.gitignore`）
- `backend.production.example` 只是模板，不含真实密钥
- `JWT_SECRET` 必须用强随机值（`openssl rand -hex 32`）
- 数据库密码必须用强随机值
- Webhook URL 是 secret，只存在服务器环境变量
- CORS 只允许正式域名，生产环境不含 `localhost`
- 不要在前端代码中写入任何后端密钥
- 生产环境 `DB_SYNCHRONIZE=false`，依赖 migration

---

## 迁移与数据库

生产部署后必须运行 migration，不能依赖 `synchronize` 自动建表：

```bash
cd backend
npm run migration:run
```

**重要规则**：

- 迁移前备份数据库
- 迁移失败不得继续发布
- 生产禁止 `DB_SYNCHRONIZE=true`
- `geo_leads` 表由 `1714100000000-CreateGeoLeads.ts` 创建
- Migration down 可用：`npm run migration:revert`
