# MOY 基础开发说明（最小版）

## 1. 先决条件
- Node.js `>= 20`
- npm `>= 10`
- PostgreSQL `>= 14`

## 2. 本地启动（推荐顺序）

### 后端
```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

### 前端
```bash
cd frontend
npm install
cp .env.example .env.development
npm run dev
```

## 3. 常用地址
- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001/api/v1`
- OpenAPI：`http://localhost:3001/api/v1/docs`

## 4. 常用命令

### backend
```bash
npm run build
npm run test
npm run lint
```

### frontend
```bash
npm run build
npm run test
npm run lint
```

## 5. 数据库与迁移
- 后端已配置 `migrationsRun: true`，启动时会自动执行迁移。
- 本地数据库默认配置见 `backend/.env.example`。

## 6. 开发约束
- 改代码前先读：
  - `docs/SSOT/01_产品范围与阶段地图.md`
  - `docs/SSOT/02_业务域与模块树.md`
  - `backend/src/app.module.ts`
  - `frontend/src/App.tsx`
- 禁止破坏模块码、业务域命名与现有权限体系。
- 行为变更必须同步 SSOT。
