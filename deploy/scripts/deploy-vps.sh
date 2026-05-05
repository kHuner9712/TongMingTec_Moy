#!/bin/bash
# ==============================
# MOY VPS 一键部署脚本
# 用法：bash deploy/scripts/deploy-vps.sh <VPS_IP>
#   示例：bash deploy/scripts/deploy-vps.sh 1.2.3.4
#
# 前置条件：
#   1. VPS 已安装 Node.js 18、Nginx、PM2（参考 vps-nginx.md §环境准备）
#   2. VPS 目录结构已创建：/var/www/moy/official geo api app backend/logs
#   3. VPS SSH 免密登录已配置（或脚本会提示输入密码）
# ==============================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ---- 参数解析 ----
VPS_IP="${1:-}"
VPS_USER="${2:-root}"

if [ -z "$VPS_IP" ]; then
  echo "用法: bash deploy/scripts/deploy-vps.sh <VPS_IP> [VPS_USER]"
  echo "示例: bash deploy/scripts/deploy-vps.sh 1.2.3.4 root"
  exit 1
fi

echo "=============================="
echo "MOY VPS 部署"
echo "目标: $VPS_USER@$VPS_IP"
echo "仓库根目录: $ROOT_DIR"
echo "=============================="

VPS_TARGET="$VPS_USER@$VPS_IP"
VPS_ROOT="/var/www/moy"

# ---- 步骤 1：构建 ----
echo ""
echo "[1/6] 构建所有站点..."
bash "$SCRIPT_DIR/build-sites.sh"

# ---- 步骤 2：VPS 目录准备 ----
echo ""
echo "[2/6] 确认 VPS 目录结构..."
ssh "$VPS_TARGET" "
  sudo mkdir -p $VPS_ROOT/{official,geo,api,app,backend,releases,logs} && \
  sudo chown -R $VPS_USER:$VPS_USER $VPS_ROOT
"
echo "  目录已就绪"

# ---- 步骤 3：上传静态站 ----
echo ""
echo "[3/6] 上传静态站到 VPS..."

upload() {
  local src="$1"
  local dest="$2"
  echo "  上传 $src → $dest"
  rsync -avz --delete "$src" "$VPS_TARGET:$dest"
}

upload "$ROOT_DIR/sites/official/dist/" "$VPS_ROOT/official/"
upload "$ROOT_DIR/sites/geo/dist/" "$VPS_ROOT/geo/"
upload "$ROOT_DIR/sites/api/dist/" "$VPS_ROOT/api/"
upload "$ROOT_DIR/frontend/dist/" "$VPS_ROOT/app/"

echo "  静态站上传完成"

# ---- 步骤 4：上传后端 ----
echo ""
echo "[4/6] 上传后端到 VPS..."

rsync -avz --delete "$ROOT_DIR/backend/dist/" "$VPS_TARGET:$VPS_ROOT/backend/dist/"
rsync -avz "$ROOT_DIR/backend/package.json" "$ROOT_DIR/backend/package-lock.json" "$VPS_TARGET:$VPS_ROOT/backend/"

echo "  后端产物上传完成"

# ---- 步骤 5：后端依赖 + Migration + PM2 ----
echo ""
echo "[5/6] 后端依赖安装 & 重启..."

ssh "$VPS_TARGET" << 'ENDSSH'
  set -e
  cd /var/www/moy/backend

  echo "  安装生产依赖..."
  npm install --production

  echo ""
  echo "  ======== 下一步请手动执行 ========"
  echo "  1. 确认 /var/www/moy/backend/.env 已配置"
  echo "  2. 运行 migration: cd /var/www/moy/backend && npm run migration:run"
  echo "  3. 重启 PM2: pm2 restart moy-backend || (cd /var/www/moy && pm2 start deploy/pm2/ecosystem.config.cjs --env production)"
  echo "  ==================================="

  # 如果 PM2 已经在运行，尝试 reload
  if pm2 list 2>/dev/null | grep -q "moy-backend"; then
    echo ""
    echo "  检测到 moy-backend 已在运行，执行 reload..."
    pm2 reload moy-backend || echo "  reload 失败，可能需要手动 restart"
  else
    echo ""
    echo "  moy-backend 未运行，请手动启动："
    echo "  cd /var/www/moy && pm2 start deploy/pm2/ecosystem.config.cjs --env production"
  fi
ENDSSH

# ---- 步骤 6：输出验证命令 ----
echo ""
echo "[6/6] 部署完成，请在新终端执行以下验证："
echo ""
echo "  # 检查后端文档"
echo "  curl https://api.app.moy.com/api/v1/docs"
echo ""
echo "  # 检查 GEO Smoke"
echo "  GEO_SMOKE_BASE_URL=https://api.app.moy.com npm --prefix $(cd "$ROOT_DIR" && pwd) run test:smoke:geo-leads"
echo ""
echo "  # 检查站点 HTTP"
echo "  curl -I https://moy.com"
echo "  curl -I https://geo.moy.com"
echo "  curl -I https://api.moy.com"
echo ""
echo "=============================="

echo ""
echo "重要提醒（人工步骤）："
echo "  [ ] SSH 到 VPS 配置 /var/www/moy/backend/.env"
echo "  [ ] cd /var/www/moy/backend && npm run migration:run"
echo "  [ ] pm2 restart moy-backend && pm2 save"
echo "  [ ] 运行 smoke test 验证"
echo "  [ ] 参考 docs/DEPLOYMENT/02_GEO上线检查清单.md 逐项检查"
echo ""
