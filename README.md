# MOY

**MOY** 是桐鸣科技旗下的企业 AI 增长与经营自动化平台。

---

## 产品矩阵

### MOY App
AI 原生客户经营系统。覆盖获客 → 沟通 → 成交 → 交付 → 验收 → 客户成功全链路。
本仓库 `frontend/` 与 `backend/` 即为主体系统。

- 域名：[app.moy.com](https://app.moy.com)
- 本地开发端口：`5173`（前端）/ `3001`（后端）

### MOY GEO
AI 搜索增长与品牌可见度服务。帮助企业在 ChatGPT、豆包、Kimi 等 AI 搜索/问答环境中被看见、被理解、被推荐。

- 域名：[geo.moy.com](https://geo.moy.com)
- 本地开发端口：`5176`
- 交付文档：[docs/GEO/](./docs/GEO/00_GEO服务总览.md)

### MOY API
多模型 API 网关与开发者平台。提供 OpenAI 兼容接口，统一接入多个大语言模型供应商，附带调用治理、用量管控和成本归集能力。

- 域名：[api.moy.com](https://api.moy.com)
- 本地开发端口：`5177`
- 技术文档：[docs/API_HUB/](./docs/API_HUB/00_MOY_API产品总览.md)

### MOY Official
品牌官网与产品矩阵入口。

- 域名：[moy.com](https://moy.com)
- 本地开发端口：`5175`

---

## 仓库结构

```
MOY/
├── backend/          MOY App 后端 / Core API（NestJS + TypeScript）
├── frontend/         MOY App 前端（React + Vite）
├── sites/
│   ├── official/     moy.com 品牌官网
│   ├── geo/          geo.moy.com GEO 服务站
│   └── api/          api.moy.com API 开发者平台
├── docs/
│   ├── SSOT/         单一事实源文档体系
│   ├── GEO/          GEO 服务化交付文档
│   └── API_HUB/      MOY API 技术设计文档
├── .trae/            IDE 规则与项目配置
└── DEVELOPMENT.md    开发补充说明
```

---

## 当前阶段

- MOY App：S2 主干已落地，推进门禁收口与责任链验收稳定化
- 品牌架构：产品矩阵与多站点边界已定义，官方/CEO/API 三个前台入口已建立
- MOY GEO：先以服务化方式交付，不急于产品化
- MOY API：先做轻量 MVP（OpenAI 兼容转发 + Key 管理 + 用量管控）
- 原则上：不推倒重写 MOY App，各产品线独立演进

---

## 本地开发

### 环境准备

- Node.js >= 18，PostgreSQL >= 14
- 根目录 `.env.example` 供参考；实际运行需分别复制到各子目录

### MOY App 后端

```bash
cd backend
npm install
npm run start:dev     # http://localhost:3001
```

### MOY App 前端

```bash
cd frontend
npm install
npm run dev           # http://localhost:5173
```

### MOY Official

```bash
cd sites/official
npm install
npm run dev           # http://localhost:5175
```

### MOY GEO

```bash
cd sites/geo
npm install
npm run dev           # http://localhost:5176
```

### MOY API

```bash
cd sites/api
npm install
npm run dev           # http://localhost:5177
```

### 测试

```bash
# 后端
cd backend && npm test

# 前端
cd frontend && npm test
```

---

## 文档入口

| 入口 | 说明 |
| --- | --- |
| [docs/SSOT/00](./docs/SSOT/00_README_唯一执行入口.md) | 开发唯一执行入口 |
| [docs/SSOT/14](./docs/SSOT/14_品牌架构与多站点边界.md) | 品牌架构、产品线拆分与工程路线 |
| [docs/GEO/00](./docs/GEO/00_GEO服务总览.md) | GEO 服务总览与交付文档导航 |
| [docs/API_HUB/00](./docs/API_HUB/00_MOY_API产品总览.md) | MOY API 产品总览与技术设计 |

---

## 命名规则

- **MOY** 是母品牌，不代表某个单一产品
- **MOY App** 是当前客户经营业务系统——不要再把"MOY App"等同于"全部 MOY"
- **MOY GEO** 和 **MOY API** 是独立产品线，不默认进入 MOY App 主菜单或路由
- 各产品线有独立的域名、前台入口和文档体系
