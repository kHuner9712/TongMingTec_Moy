#!/bin/bash
# ==============================
# MOY 构建全部站点
# 用法：bash deploy/scripts/build-sites.sh
# ==============================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=============================="
echo "MOY 全站点构建"
echo "仓库根目录: $ROOT_DIR"
echo "=============================="

# ---- 构建后端 ----
echo ""
echo "[1/5] 构建 backend..."
cd "$ROOT_DIR/backend"
npm install
npm run build
echo "  backend build 完成"

# ---- 构建 sites/official ----
echo ""
echo "[2/5] 构建 sites/official..."
cd "$ROOT_DIR/sites/official"
npm install
npm run build
echo "  moy.com build 完成 → sites/official/dist/"

# ---- 构建 sites/geo ----
echo ""
echo "[3/5] 构建 sites/geo..."
cd "$ROOT_DIR/sites/geo"
npm install
npm run build
echo "  geo.moy.com build 完成 → sites/geo/dist/"

# ---- 构建 sites/api ----
echo ""
echo "[4/5] 构建 sites/api..."
cd "$ROOT_DIR/sites/api"
npm install
npm run build
echo "  api.moy.com build 完成 → sites/api/dist/"

# ---- 构建 frontend ----
echo ""
echo "[5/5] 构建 frontend..."
cd "$ROOT_DIR/frontend"
npm install
npm run build
echo "  app.moy.com build 完成 → frontend/dist/"

echo ""
echo "=============================="
echo "全部 5 个项目构建完成"
echo "=============================="
echo ""
echo "产物目录:"
echo "  backend/dist/        → NestJS 编译产物"
echo "  sites/official/dist/ → moy.com"
echo "  sites/geo/dist/      → geo.moy.com"
echo "  sites/api/dist/      → api.moy.com"
echo "  frontend/dist/       → app.moy.com"
echo ""
