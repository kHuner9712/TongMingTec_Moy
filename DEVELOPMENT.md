# MOY 基础开发说明（最小版）

## 1. 品牌与产品线

MOY（墨言）是"企业 AI 增长与经营自动化平台"母品牌，旗下三条产品线：

| 产品线 | 目录 | 本地端口 | 说明 |
| --- | --- | --- | --- |
| **MOY App** | `frontend/` `backend/` | `:5173` `:3001` | AI 原生客户经营系统（主系统） |
| **MOY GEO** | `geo/` | `:5174` | AI 搜索增长与品牌可见度服务（MVP） |
| **MOY API** | `api-gateway/` | `:3002` | 多模型 API 网关 / 开发者平台（MVP） |
| **品牌官网** | `landing/` | — | 产品矩阵入口（静态页面） |

品牌架构详见：`docs/SSOT/14_品牌架构与多站点边界.md`

## 2. 先决条件
- Node.js `>= 20`
- npm `>= 10`
- PostgreSQL `>= 14`（仅 MOY App 需要）

## 3. 本地启动（推荐顺序）

### MOY App 后端
```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

### MOY App 前端
```bash
cd frontend
npm install
cp .env.example .env.development
npm run dev
```

### MOY GEO（MVP 骨架）
```bash
cd geo
npm install
npm run dev
```

### MOY API（MVP 骨架）
```bash
cd api-gateway
npm install
npm run dev
```

## 4. 常用地址
| 站点 | 地址 |
| --- | --- |
| MOY App 前端 | `http://localhost:5173` |
| MOY App 后端 | `http://localhost:3001/api/v1` |
| MOY App OpenAPI | `http://localhost:3001/api/v1/docs` |
| MOY GEO | `http://localhost:5174` |
| MOY API | `http://localhost:3002` |

## 5. 常用命令

### backend (MOY App)
```bash
npm run build
npm run test
npm run lint
```

### frontend (MOY App)
```bash
npm run build
npm run test
npm run lint
```

### geo (MOY GEO)
```bash
npm run build
npm run test
```

### api-gateway (MOY API)
```bash
npm run dev
npm run test
```

## 6. 数据库与迁移
- 后端已配置 `migrationsRun: true`，启动时会自动执行迁移。
- 本地数据库默认配置见 `backend/.env.example`。
- GEO 和 API 当前阶段无需数据库。

## 7. 开发约束
- 改代码前先读：
  - `docs/SSOT/01_产品范围与阶段地图.md`
  - `docs/SSOT/02_业务域与模块树.md`
  - `docs/SSOT/14_品牌架构与多站点边界.md`
  - `backend/src/app.module.ts`
  - `frontend/src/App.tsx`
- 禁止破坏模块码、业务域命名与现有权限体系。
- 行为变更必须同步 SSOT。
- GEO / API 代码不得侵入 MOY App 的 `frontend/` `backend/`。
