# 方案 B：VPS + Nginx + PM2

## 概述

所有站点部署到一台 VPS 上，通过 Nginx 做域名路由分发，后端用 PM2 守护进程。

---

## 服务器要求

| 规格 | 推荐 |
|------|------|
| OS | Ubuntu 22.04 LTS |
| CPU | 2 核+ |
| 内存 | 4 GB+ |
| 存储 | 40 GB+ SSD |
| 带宽 | 按需 |

---

## 目录结构

```
/var/www/moy/
├── official/                    # sites/official → dist/
├── geo/                         # sites/geo → dist/
├── api/                         # sites/api → dist/
├── app/                         # frontend → dist/
├── backend/                     # backend 源码 + dist/
│   ├── dist/                    # 编译产物
│   ├── node_modules/
│   ├── package.json
│   └── ...
├── releases/                    # 历史版本备份
│   └── 2026-05-01_120000/
└── logs/                        # Nginx + PM2 日志
```

---

## 环境准备

### 1. 基础依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2
sudo npm install -g pm2

# 安装构建工具（如需要编译 native 模块）
sudo apt install -y build-essential python3

# 验证
node --version    # v18.x
npm --version
nginx -v
pm2 --version
```

### 2. 防火墙

```bash
sudo ufw allow 22       # SSH
sudo ufw allow 80       # HTTP
sudo ufw allow 443      # HTTPS
sudo ufw enable
sudo ufw status
```

---

## 部署步骤

### 步骤 1：在本地构建

```bash
# 在仓库根目录
bash deploy/scripts/build-sites.sh
```

### 步骤 2：上传到 VPS

```bash
# 方法 1：scp
scp -r sites/official/dist/* root@<VPS_IP>:/var/www/moy/official/
scp -r sites/geo/dist/* root@<VPS_IP>:/var/www/moy/geo/
scp -r sites/api/dist/* root@<VPS_IP>:/var/www/moy/api/
scp -r frontend/dist/* root@<VPS_IP>:/var/www/moy/app/

# 或使用 rsync
rsync -avz sites/official/dist/ root@<VPS_IP>:/var/www/moy/official/
rsync -avz sites/geo/dist/ root@<VPS_IP>:/var/www/moy/geo/
rsync -avz sites/api/dist/ root@<VPS_IP>:/var/www/moy/api/
rsync -avz frontend/dist/ root@<VPS_IP>:/var/www/moy/app/
rsync -avz backend/dist/ root@<VPS_IP>:/var/www/moy/backend/dist/
rsync -avz backend/package.json root@<VPS_IP>:/var/www/moy/backend/
```

### 步骤 3：后端依赖安装

```bash
# SSH 到 VPS
ssh root@<VPS_IP>

cd /var/www/moy/backend
npm install --production
```

### 步骤 4：配置环境变量

在 VPS 上创建 `/var/www/moy/backend/.env`：

```bash
# 参考 deploy/env/backend.production.example
# 注意：不要提交真实 .env 到 Git
```

### 步骤 5：运行 Migration

```bash
cd /var/www/moy/backend
npm run migration:run
```

### 步骤 6：配置 Nginx

```bash
# 复制配置模板
cp deploy/nginx/moy.conf.example /etc/nginx/sites-available/moy

# 启用站点
sudo ln -s /etc/nginx/sites-available/moy /etc/nginx/sites-enabled/

# 删除默认配置
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 步骤 7：配置 PM2

```bash
# 创建 ecosystem 配置
cp deploy/pm2/ecosystem.config.cjs /var/www/moy/

# 启动
cd /var/www/moy
pm2 start pm2/ecosystem.config.cjs

# 保存（开机自启）
pm2 save
pm2 startup
# 复制并执行输出的命令
```

### 步骤 8：配置 SSL（Let's Encrypt）

```bash
# 安装 certbot
sudo apt install -y certbot python3-certbot-nginx

# 为所有域名申请证书
sudo certbot --nginx -d moy.com -d www.moy.com
sudo certbot --nginx -d geo.moy.com
sudo certbot --nginx -d api.moy.com
sudo certbot --nginx -d app.moy.com
sudo certbot --nginx -d api.app.moy.com

# 测试自动续期
sudo certbot renew --dry-run
```

---

## 一键部署脚本

```bash
# 从本地执行
bash deploy/scripts/deploy-vps.sh <VPS_IP>
```

脚本会自动完成：构建 → 上传 → 重启 PM2 → 验证。

---

## 常用运维命令

### PM2

```bash
pm2 list              # 查看所有进程
pm2 logs moy-backend  # 查看后端日志
pm2 restart moy-backend  # 重启后端
pm2 stop moy-backend     # 停止后端
pm2 delete moy-backend   # 删除进程
pm2 reload all            # 零停机重载全部
```

### Nginx

```bash
sudo nginx -t          # 测试配置
sudo systemctl reload nginx  # 重载
sudo systemctl restart nginx # 重启
sudo tail -f /var/log/nginx/access.log  # 访问日志
sudo tail -f /var/log/nginx/error.log   # 错误日志
```

### SSL 证书

```bash
sudo certbot renew        # 手动续期
sudo certbot certificates # 查看证书状态
```

---

## 回滚

### 回滚静态站

```bash
# 静态站点恢复到上一版本
# 假设 releases/ 目录保存了上一版本的 dist
cp -r /var/www/moy/releases/<previous>/geo/* /var/www/moy/geo/
```

### 回滚后端

```bash
# 1. 停止后端
pm2 stop moy-backend

# 2. 恢复上一版本
rm -rf /var/www/moy/backend/dist
cp -r /var/www/moy/releases/<previous>/backend/dist /var/www/moy/backend/

# 3. 重启
pm2 start moy-backend

# 4. 验证
curl https://api.app.moy.com/api/v1/docs
```

### 回滚数据库 Migration

```bash
cd /var/www/moy/backend
npm run migration:revert
```

---

## 监控建议

```bash
# 基础监控（安装）
sudo apt install -y htop iotop

# PM2 自带监控
pm2 monit

# 外部监控（免费）
# UptimeRobot：https://uptimerobot.com/ 监控 HTTPS 端口
# Better Stack：https://betterstack.com/ 监控 + 日志
```

---

## 成本

| 项目 | 月费 |
|------|------|
| VPS（阿里云/腾讯云/UCloud 2C4G） | ¥50-200 |
| 域名 moy.com | ≈¥70/年 |
| **合计** | **¥50-200/月 + ¥70/年** |
