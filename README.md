# MOY

MOY 是桐鸣科技旗下的企业 AI 增长与经营自动化平台。

---

## 产品矩阵

### MOY Official

品牌官网和产品矩阵入口。

- 对应域名：moy.com
- 工程目录：sites/official

### MOY App

AI 原生客户经营系统。

- 对应域名：app.moy.com
- 工程目录：frontend / backend

### MOY GEO

AI 搜索增长与品牌可见度服务。

- 对应域名：geo.moy.com
- 工程目录：sites/geo
- 交付文档：docs/GEO

### MOY API

多模型 API 网关 / API 中转站 / 开发者平台。

- 对应域名：api.moy.com
- 工程目录：sites/api
- 技术文档：docs/API_HUB

---

## 仓库结构

```
backend/          MOY App 后端 / Core API
frontend/         MOY App 前端
sites/official/   moy.com 官网
sites/geo/        geo.moy.com GEO 服务站
sites/api/        api.moy.com API 平台站
docs/SSOT/        单一事实源文档
docs/GEO/         GEO 服务交付文档
docs/API_HUB/     MOY API 技术设计文档
```

---

## 当前阶段

- 不推倒重写 MOY App
- 先完成品牌架构重构
- 新增官网/GEO/API 三个前台入口
- GEO 先服务化交付
- API 先做轻量 MVP
- MOY App 暂时保持主业务系统稳定

---

## 本地开发

### 根目录统一命令（推荐）

```bash
npm install              # 安装根依赖（无额外依赖）

npm run dev:app          # 启动 MOY App 前端     → :5173
npm run dev:backend      # 启动 MOY App 后端     → :3001
npm run dev:official     # 启动 MOY Official     → :5175
npm run dev:geo          # 启动 MOY GEO          → :5176
npm run dev:api          # 启动 MOY API          → :5177

npm run build:app        # 构建 MOY App 前端
npm run build:backend    # 构建 MOY App 后端
npm run build:official   # 构建 MOY Official
npm run build:geo        # 构建 MOY GEO
npm run build:api        # 构建 MOY API
npm run build:sites      # 构建全部三个站点

npm run build            # 构建全部项目
npm run test             # 运行全部测试
npm run test:smoke:geo-leads  # GEO 线索收集 Smoke Test
```

### 数据库迁移

```bash
# 生产部署后运行 migration（创建 geo_leads 等新表）
cd backend && npm run migration:run

# 注意：迁移前请备份数据库，迁移失败不要继续部署
# geo_leads 表由 migration 创建，不依赖 synchronize
```

### 子项目独立启动

```bash
# MOY App 后端
cd backend && npm install && npm run start:dev

# MOY App 前端
cd frontend && npm install && npm run dev

# MOY Official
cd sites/official && npm install && npm run dev

# MOY GEO
cd sites/geo && npm install && npm run dev

# MOY API
cd sites/api && npm install && npm run dev
```

---

## 文档入口

| 文档                                                                            | 说明                             |
| ------------------------------------------------------------------------------- | -------------------------------- |
| [`docs/SSOT/00_README_唯一执行入口.md`](./docs/SSOT/00_README_唯一执行入口.md)  | 开发唯一执行入口                 |
| [docs/SSOT/14\_品牌架构与多站点边界.md](./docs/SSOT/14_品牌架构与多站点边界.md) | 品牌架构、产品线拆分与多站点边界 |
| [`docs/GEO/00_GEO服务总览.md`](./docs/GEO/00_GEO服务总览.md)                    | GEO 服务总览与交付文档导航       |
| [`docs/API_HUB/00_MOY_API产品总览.md`](./docs/API_HUB/00_MOY_API产品总览.md)    | MOY API 产品总览与技术设计       |

---

## 命名规则

- MOY 是母品牌
- MOY App 是当前 AI 原生客户经营系统
- MOY GEO 是独立增长服务产品线
- MOY API 是独立模型网关产品线
- 不要再把当前 App 单独等同于全部 MOY
