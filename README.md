# MOY 仓库说明

## 1. 项目一句话定位
MOY 是一个**结果交付型企业 AI 原生系统**：目标不是做聊天或单点 AI 工具，而是把“获客 -> 沟通 -> 成交 -> 交付 -> 验收 -> 客户成功”做成可执行、可追责、可持续运营的业务主链。

## 2. 当前阶段

### S1 / S2 / S3 / S4 含义
- `S1`：基础底座与前链路主干（租户/权限、客户-线索-商机、会话-工单、AI 运行与治理）。
- `S2`：成交与成交后承接主干（QT/CT/ORD/PAY/SUB/DLV/CSM + KB/DASH/AUTO）。
- `S3`：商业化与平台化扩展（PLAN/BILL/INV/INT/PLT 等）。
- `S4`：规模化与全球化（I18N/DEPLOY、合规、多区域、私有化、规模化 AI 编排）。

### 当前大致所处阶段
- 按 SSOT 当前判断：`S1 基本完成`，`S2 主干已落地，待门禁收口`。

### 当前主干目标
- 把 S2 主链做成可验收闭环：`商机赢单 -> 报价 -> 合同 -> 订单 -> 付款 -> 开通/订阅 -> 交付实施 -> 验收 -> 客户成功`。

## 3. 技术栈

### 前端（`frontend`）
- React 18 + TypeScript + Vite 5
- Ant Design 5 / Pro Components
- React Router 6 / React Query / Zustand / Axios
- 测试：Vitest、Testing Library、Playwright

### 后端（`backend`）
- NestJS 10 + TypeScript
- TypeORM 0.3 + PostgreSQL
- JWT + Passport（鉴权）、Tenant/Role Guard
- 领域事件总线 + 状态机 + WebSocket（Socket.IO）

### 数据库
- PostgreSQL（多租户关键字段：`org_id`）

### 测试
- 后端：Jest（`*.spec.ts`）
- 前端单测：Vitest + Testing Library
- 前端 E2E：Playwright（`frontend/e2e`）

## 4. 目录速览
```text
.
├─ frontend/                         # 前端工程
│  ├─ src/App.tsx                    # 前端路由与权限入口
│  ├─ src/pages/                     # 页面
│  ├─ src/services/                  # API 调用封装
│  └─ e2e/                           # Playwright E2E
├─ backend/                          # 后端工程
│  ├─ src/app.module.ts              # 模块注册主入口
│  ├─ src/modules/                   # 业务模块（QT/CT/ORD/PAY/SUB/DLV/CSM/...）
│  ├─ src/common/                    # 公共能力（事件、状态机、鉴权、过滤器等）
│  └─ src/migrations/                # 数据库迁移
├─ docs/SSOT/                        # 单一事实源（需求/模型/API/页面/测试）
├─ .env.example                      # 仓库级环境变量最小模板
└─ DEVELOPMENT.md                    # 开发补充说明
```

## 5. 本地启动方式

### 5.1 环境变量
- 根目录有仓库级模板：`.env.example`（用于快速理解必需变量）。
- 实际运行请分别复制：
  - `backend/.env.example -> backend/.env`
  - `frontend/.env.example -> frontend/.env.development`

### 5.2 数据库要求
- PostgreSQL `>= 14`
- 默认示例：
  - host：`localhost`
  - port：`5432`
  - db：`moy`
  - user/password：`postgres/postgres`
- 后端启用 `migrationsRun: true`，启动时会自动执行 migration。

### 5.3 启动命令
```bash
# 终端 1：后端
cd backend
npm install
npm run start:dev

# 终端 2：前端
cd frontend
npm install
npm run dev
```

### 5.4 测试命令
```bash
# 后端单元测试
cd backend
npm test
npm run test:cov

# 前端单元测试
cd frontend
npm test
npm run test:coverage
```

### 5.5 E2E 命令
```bash
cd frontend

# 全量 E2E
npm run test:e2e

# 结果责任链专项 E2E
npm run test:e2e:responsibility
```

### 5.6 默认访问地址
- 前端：`http://localhost:5173`
- 后端 API：`http://localhost:3001/api/v1`
- Swagger：`http://localhost:3001/api/v1/docs`

## 6. 文档阅读顺序（先读什么）
1. `docs/SSOT/00_README_唯一执行入口.md`
2. `docs/SSOT/01_产品范围与阶段地图.md`
3. `docs/SSOT/02_业务域与模块树.md`
4. `docs/SSOT/06_状态机总表.md`
5. `docs/SSOT/08_API契约与Schema字典.md`
6. `docs/SSOT/09_页面与交互规格.md`
7. `docs/SSOT/12_测试_验收_部署与迁移.md`
8. 涉及结果责任链时补读：`docs/SSOT/12B_结果责任链E2E验证设计与最小实现.md`

## 7. AI 编程工具协作规则（Trae / 其他 AI 助手）

### 进入仓库后先读
- `docs/SSOT/00`、`01`、`02`
- `backend/src/app.module.ts`
- `frontend/src/App.tsx`

### 不允许破坏
- 不允许破坏模块码与命名体系（如 `QT/CT/ORD/PAY/SUB/DLV/CSM/DealChain`）。
- 不允许建立“平行主链”（平行状态机、平行 API、平行模块树）。
- 不允许绕开现有审批/事件/状态机边界直接写死状态。

### 修改前必须检查
- `docs/SSOT/01_产品范围与阶段地图.md`
- `docs/SSOT/02_业务域与模块树.md`
- `docs/SSOT/06_状态机总表.md`
- `docs/SSOT/07_权限模型与AI边界.md`
- `docs/SSOT/08_API契约与Schema字典.md`
- `backend/src/app.module.ts`
- `frontend/src/App.tsx`

### 一致性要求（必须）
- 文档、后端、前端必须同步更新。
- 改动模块时，至少同步核对：路由/API、状态机、权限、测试。

## 8. 当前已实现主干能力

### 8.1 已接入 S1 基线模块
- `AUTH / ORG / USR / CM / LM / OM / CNV / TK / TSK / NTF / CHN / AI / AUD / SYS`
- `COR / CMEM / ART / APC / TKC / RBC`

### 8.2 已推进的 S2 模块
- `QT / CT / ORD / PAY / SUB / DLV / CSM / KB / DASH / AUTO / DealChain`
- 前端已接入对应核心入口：`/quotes /contracts /orders /payments /subscriptions /deliveries /workbench/csm/health /knowledge /automation`

### 8.3 当前缺口（工程事实）
- S2 门禁仍需收口：端到端验收稳定性、指标归因与覆盖率治理、动作闭环完善。
- 多模块仍处于 `workflow_ready/crud_ready`，尚未普遍达到 `production_ready`。
- S3/S4 多数模块仍为骨架或待实现。

## 9. 后续路线（仅工程事实）
- 近期：完成 S2 门禁收口与责任链验收稳定化。
- 中期：推进 S3 商业化闭环（PLAN/BILL/INV）与平台化扩展（INT/PLT）。
- 远期：推进 S4 国际化/私有化/合规与规模化 AI 编排能力。

---
本 README 用于 5 分钟快速入场；最终裁决以 `docs/SSOT` 为准。
