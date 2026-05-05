#!/bin/bash
# ==============================
# MOY VPS 回滚脚本（半自动）
# 用法：bash deploy/scripts/rollback-vps.sh <VPS_IP> [RELEASE_TAG]
#   示例：bash deploy/scripts/rollback-vps.sh 1.2.3.4 2026-05-01_120000
# ==============================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

VPS_IP="${1:-}"
VPS_USER="${2:-root}"
RELEASE_TAG="${3:-}"

if [ -z "$VPS_IP" ]; then
  echo "用法: bash deploy/scripts/rollback-vps.sh <VPS_IP> [VPS_USER] [RELEASE_TAG]"
  echo "示例: bash deploy/scripts/rollback-vps.sh 1.2.3.4 root 2026-05-01_120000"
  echo ""
  echo "如果不指定 RELEASE_TAG，脚本会列出可回滚的版本。"
  exit 1
fi

VPS_TARGET="$VPS_USER@$VPS_IP"
VPS_ROOT="/var/www/moy"
RELEASES_DIR="$VPS_ROOT/releases"

if [ -z "$RELEASE_TAG" ]; then
  echo "列出可回滚版本："
  ssh "$VPS_TARGET" "ls -1t $RELEASES_DIR 2>/dev/null || echo '(无版本记录)'"
  echo ""
  echo "用法: bash deploy/scripts/rollback-vps.sh <VPS_IP> <RELEASE_TAG>"
  exit 0
fi

RELEASE_PATH="$RELEASES_DIR/$RELEASE_TAG"

echo "=============================="
echo "MOY VPS 回滚"
echo "目标: $VPS_TARGET"
echo "版本: $RELEASE_TAG"
echo "=============================="
echo ""

# 确认版本存在
ssh "$VPS_TARGET" "test -d $RELEASE_PATH || (echo '错误: 版本目录 $RELEASE_PATH 不存在' && exit 1)"

echo "回滚操作说明（半自动，请按顺序执行）："
echo ""
echo "  # ---- 步骤 1：回滚静态站 ----"
echo "  cp -r $RELEASE_PATH/geo/* /var/www/moy/geo/"
echo "  cp -r $RELEASE_PATH/official/* /var/www/moy/official/"
echo "  cp -r $RELEASE_PATH/api/* /var/www/moy/api/"
echo "  echo '静态站点已回滚'"
echo ""
echo "  # ---- 步骤 2：回滚后端 ----"
echo "  pm2 stop moy-backend"
echo "  rm -rf /var/www/moy/backend/dist"
echo "  cp -r $RELEASE_PATH/backend/dist /var/www/moy/backend/"
echo "  pm2 start moy-backend"
echo "  echo '后端已回滚'"
echo ""
echo "  # ---- 步骤 3：回滚 Migration（如有需要）----"
echo "  cd /var/www/moy/backend && npm run migration:revert"
echo ""
echo "  # ---- 步骤 4：验证 ----"
echo "  curl https://api.app.moy.com/api/v1/docs"
echo "  curl -I https://moy.com"
echo "  curl -I https://geo.moy.com"
echo ""
echo "=============================="
echo ""

# 提供可选的自动回滚
read -r -p "是否自动执行上述回滚步骤？(y/N) " yn
if [[ "$yn" != "y" && "$yn" != "Y" ]]; then
  echo "已取消，请手动执行上述命令。"
  exit 0
fi

echo "开始自动回滚..."

ssh "$VPS_TARGET" << ENDSSH
  set -e

  echo "回滚静态站..."
  cp -r $RELEASE_PATH/geo/* /var/www/moy/geo/ || echo "  geo 回滚失败（可能无此版本）"
  cp -r $RELEASE_PATH/official/* /var/www/moy/official/ || echo "  official 回滚失败（可能无此版本）"
  cp -r $RELEASE_PATH/api/* /var/www/moy/api/ || echo "  api 回滚失败（可能无此版本）"

  echo "回滚后端..."
  pm2 stop moy-backend 2>/dev/null || true
  rm -rf /var/www/moy/backend/dist
  cp -r $RELEASE_PATH/backend/dist /var/www/moy/backend/
  pm2 start moy-backend

  echo "回滚完成"
ENDSSH

echo ""
echo "=============================="
echo "回滚已完成，请在新终端运行验证："
echo "  curl https://api.app.moy.com/api/v1/docs"
echo "  curl -I https://moy.com"
echo "=============================="
