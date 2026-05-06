# MOY GEO S1 阶段冻结报告

## 1. 冻结结论

**MOY GEO S1 已完成从前台获客、线索收集、内部运营、诊断报告、品牌事实资产、内容规划、内容稿件到客户交付导出包的完整服务化交付闭环。**

S1 阶段目标达成情况：

| 目标 | 状态 |
|------|------|
| 支持售前获客 | ✅ 完成 |
| 支持客户资料收集 | ✅ 完成 |
| 支持内部线索运营 | ✅ 完成 |
| 支持 GEO 诊断报告生成 | ✅ 完成 |
| 支持品牌事实资产建设 | ✅ 完成 |
| 支持内容选题、计划、稿件管理 | ✅ 完成 |
| 支持客户项目工作台 | ✅ 完成 |
| 支持运营总览 | ✅ 完成 |
| 支持 Markdown 交付导出 | ✅ 完成 |

## 2. 产品边界

MOY GEO 的产品定位与边界声明（S1 冻结基线）：

### 2.1 品牌关系

- MOY GEO 是 MOY 母品牌下的独立增长服务产品线
- MOY GEO 不等同于 MOY App
- MOY GEO 不自动写入 MOY App 的客户/线索主链
- MOY GEO 不调用 MOY API Hub

### 2.2 功能边界

- S1 不调用真实 AI 模型
- S1 不自动发布内容
- S1 不承诺排名
- S1 不提供虚假宣传、伪造案例、伪造媒体报道、垃圾内容批量发布

## 3. 前端页面清单

### 3.1 公开页面

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | GEO 销售页 | 品牌 AI 可见度服务介绍 + 诊断预约表单 |

### 3.2 管理后台页面（需管理令牌）

| 路径 | 页面 | 布局 |
|------|------|------|
| `/admin` | 运营总览 Dashboard | AdminLayout |
| `/admin/dashboard` | 运营总览 Dashboard | AdminLayout |
| `/admin/leads` | 线索池 | AdminLayout |
| `/admin/workspace?leadId=xxx` | 客户项目工作台 | AdminLayout |
| `/admin/reports` | 诊断报告列表 | AdminLayout |
| `/admin/reports/new` | 诊断报告编辑器 | AdminLayout |
| `/admin/brand-assets` | 品牌资产包列表 | AdminLayout |
| `/admin/brand-assets/new` | 品牌资产包编辑器 | AdminLayout |
| `/admin/content-topics` | 内容选题列表 | AdminLayout |
| `/admin/content-topics/new` | 内容选题编辑器 | AdminLayout |
| `/admin/content-plans` | 内容计划列表 | AdminLayout |
| `/admin/content-plans/new` | 内容计划编辑器 | AdminLayout |
| `/admin/content-drafts` | 内容稿件列表 | AdminLayout |
| `/admin/content-drafts/new` | 内容稿件编辑器 | AdminLayout |
| `/admin/export?leadId=xxx` | 客户交付导出包 | AdminLayout |

**共计：1 个公开页面 + 16 个管理后台路径。**

## 4. 后端模块清单

| 模块目录 | 模块职责 |
|----------|----------|
| `geo-leads/` | 公开表单提交（反垃圾校验 + webhook 通知）+ 管理端线索列表/详情/状态流转 |
| `geo-deliverables/` | 诊断报告 CRUD + 品牌事实资产包 CRUD + 各自的状态管理 |
| `geo-content/` | 内容选题 CRUD + 内容计划 CRUD + 内容稿件 CRUD + 各自的状态流转 |

三个模块之间通过 `leadId` 关联，不建立数据库级外键约束。

## 5. 数据表清单

| 表名 | 用途 | 核心状态字段及枚举 |
|------|------|-------------------|
| `geo_leads` | GEO 销售线索 | `status`: received / contacted / qualified / proposal_sent / won / lost / archived |
| `geo_reports` | AI 可见度诊断报告 | `status`: draft / ready / delivered / archived |
| `geo_brand_assets` | 品牌事实资产包 | `status`: draft / ready / reviewed / delivered / archived |
| `geo_content_topics` | GEO 内容选题 | `status`: idea / planned / drafting / reviewing / approved / published / archived |
| `geo_content_plans` | GEO 内容计划 | `status`: draft / active / completed / archived |
| `geo_content_drafts` | GEO 内容稿件 | `status`: draft / reviewing / approved / published / archived |

全部表默认包含 `id` (uuid)、`created_at`、`updated_at` 字段。通过 `lead_id` 关联到 `geo_leads`。

## 6. Migration 清单

| 文件 | 创建的表 |
|------|----------|
| `backend/src/migrations/1714100000000-CreateGeoLeads.ts` | `geo_leads` |
| `backend/src/migrations/1714200000000-CreateGeoDeliverables.ts` | `geo_reports` + `geo_brand_assets` |
| `backend/src/migrations/1714300000000-CreateGeoContent.ts` | `geo_content_topics` + `geo_content_plans` |
| `backend/src/migrations/1714400000000-CreateGeoContentDrafts.ts` | `geo_content_drafts` |

**生产环境部署要求**：

- 必须运行 `npm run migration:run` 执行所有迁移
- 禁止依赖 `synchronize: true` 自动建表
- 迁移执行顺序按时间戳递增

## 7. API 清单

### 7.1 公开接口（无需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/geo/leads` | GEO 销售页表单提交 |

### 7.2 管理接口（需要 JWT Bearer Token）

**线索管理**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/geo-leads` | 列表（?status=&keyword=&page=&pageSize=） |
| GET | `/api/v1/geo-leads/:id` | 详情 |
| PATCH | `/api/v1/geo-leads/:id/status` | 状态更新 |

**诊断报告**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/geo-reports` | 列表（?leadId=&status=&keyword=&page=&pageSize=） |
| POST | `/api/v1/geo-reports` | 创建 |
| GET | `/api/v1/geo-reports/:id` | 详情 |
| PATCH | `/api/v1/geo-reports/:id` | 更新 |
| PATCH | `/api/v1/geo-reports/:id/status` | 状态更新 |
| DELETE | `/api/v1/geo-reports/:id` | 归档 |

**品牌事实资产包**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/geo-brand-assets` | 列表（?leadId=&status=&keyword=&page=&pageSize=） |
| POST | `/api/v1/geo-brand-assets` | 创建 |
| GET | `/api/v1/geo-brand-assets/:id` | 详情 |
| PATCH | `/api/v1/geo-brand-assets/:id` | 更新 |
| PATCH | `/api/v1/geo-brand-assets/:id/status` | 状态更新 |
| DELETE | `/api/v1/geo-brand-assets/:id` | 归档 |

**内容选题**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/geo-content-topics` | 列表（?leadId=&brandAssetId=&reportId=&status=&priority=&contentType=&keyword=&page=&pageSize=） |
| POST | `/api/v1/geo-content-topics` | 创建 |
| GET | `/api/v1/geo-content-topics/:id` | 详情 |
| PATCH | `/api/v1/geo-content-topics/:id` | 更新 |
| PATCH | `/api/v1/geo-content-topics/:id/status` | 状态更新 |
| DELETE | `/api/v1/geo-content-topics/:id` | 归档 |

**内容计划**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/geo-content-plans` | 列表（?leadId=&brandAssetId=&status=&month=&keyword=&page=&pageSize=） |
| POST | `/api/v1/geo-content-plans` | 创建 |
| GET | `/api/v1/geo-content-plans/:id` | 详情 |
| PATCH | `/api/v1/geo-content-plans/:id` | 更新 |
| PATCH | `/api/v1/geo-content-plans/:id/status` | 状态更新 |
| DELETE | `/api/v1/geo-content-plans/:id` | 归档 |

**内容稿件**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/geo-content-drafts` | 列表（?leadId=&brandAssetId=&reportId=&topicId=&planId=&status=&contentType=&keyword=&page=&pageSize=） |
| POST | `/api/v1/geo-content-drafts` | 创建 |
| GET | `/api/v1/geo-content-drafts/:id` | 详情 |
| PATCH | `/api/v1/geo-content-drafts/:id` | 更新 |
| PATCH | `/api/v1/geo-content-drafts/:id/status` | 状态流转（含校验） |
| DELETE | `/api/v1/geo-content-drafts/:id` | 归档 |

**管理接口共计 6 组 × (列表 + 详情 + 创建 + 更新 + 状态 + 归档) = 约 30 个端点。**

## 8. 环境变量清单

### 8.1 后端（backend/.env）

| 变量 | 用途 | 示例 |
|------|------|------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 后端端口 | `3001` |
| `DB_HOST` | 数据库地址 | `localhost` |
| `DB_PORT` | 数据库端口 | `5432` |
| `DB_USERNAME` | 数据库用户 | `postgres` |
| `DB_PASSWORD` | 数据库密码 | `***` |
| `DB_DATABASE` | 数据库名 | `moy_app` |
| `DB_SYNCHRONIZE` | 自动同步 schema（生产必须 `false`） | `false` |
| `DB_LOGGING` | SQL 日志（生产建议 `false`） | `false` |
| `JWT_SECRET` | JWT 签名密钥 | `***` |
| `JWT_EXPIRES_IN` | JWT 有效期 | `7d` |
| `CORS_ORIGINS` | 允许的跨域来源（逗号分隔） | `https://geo.moy.com,...` |
| `GEO_LEAD_NOTIFY_WEBHOOK_TYPE` | 线索通知类型 | `feishu` / `none` |
| `GEO_LEAD_NOTIFY_WEBHOOK_URL` | Webhook 地址 | `https://open.feishu.cn/...` |

### 8.2 GEO 前端（sites/geo/.env）

| 变量 | 用途 | 示例 |
|------|------|------|
| `VITE_GEO_LEAD_ENDPOINT` | 公开表单提交接口 | `https://api.app.moy.com/api/geo/leads` |
| `VITE_GEO_ADMIN_API_BASE_URL` | 管理后台 API 基地址 | `https://api.app.moy.com/api/v1` |

## 9. 运营流程

完整 GEO 服务交付链路：

```
1. 客户访问 geo.moy.com
      │
2. 填写并提交诊断申请表单
      │
3. 后端保存 geo_lead（含反垃圾校验）
      │
4. webhook 通知 GEO 团队（飞书/钉钉/企业微信）
      │
5. 团队进入 /admin 查看运营总览 Dashboard
      │
6. 从 Dashboard/线索池进入客户工作台 /admin/workspace?leadId=xxx
      │
7. 创建诊断报告 /admin/reports/new?leadId=xxx
      │
8. 创建品牌事实资产包 /admin/brand-assets/new?leadId=xxx
      │
9. 创建内容选题 /admin/content-topics/new?leadId=xxx
      │
10. 制定内容计划 /admin/content-plans/new?leadId=xxx
      │
11. 撰写内容稿件 /admin/content-drafts/new?leadId=xxx
      │
12. 导出客户交付包 /admin/export?leadId=xxx
      │
13. 人工复核后发送给客户
```

## 10. 合规边界

S1 冻结基线下的合规声明：

### 10.1 必须做的事

- 所有品牌内容基于客户真实资料
- 所有案例需取得客户书面授权
- 交付前需人工复核内容准确性
- 客户资料按隐私说明处理
- 引用数据标注来源和时间

### 10.2 不允许做的事

| 禁止事项 | 说明 |
|----------|------|
| 承诺固定排名 | 不承诺"一定让 AI 推荐你""保证排第一" |
| 虚假宣传 | 不夸大产品功能、不编造服务能力 |
| 伪造客户案例 | 不编造客户成功案例、不伪造效果数据 |
| 伪造媒体报道 | 不伪造媒体报道、不编造第三方评价 |
| 垃圾内容批量发布 | 不通过脚本批量生成低质量内容 |
| 恶意操纵搜索结果 | 不通过技术手段欺骗 AI 模型 |

## 11. 当前已知限制

| # | 限制项 | 说明 |
|---|--------|------|
| 1 | 暂未接统一登录 | Admin Token 仍是 localStorage 临时方案，需手动从 MOY App 提取 |
| 2 | 暂未部署生产环境 | 代码与功能已完成，但未在正式域名上线 |
| 3 | 暂无 PDF/Word 导出 | 只支持 Markdown 格式导出 |
| 4 | 暂无客户门户 | 客户无法自助登录查看交付物 |
| 5 | 暂无真实 AI 自动生成 | 诊断报告/选题/稿件均为人工填入 |
| 6 | 暂无自动发布 | 稿件需人工在目标平台发布 |
| 7 | 暂无后端聚合统计接口 | Dashboard/工作台数据由前端并行请求多个列表 API 聚合 |
| 8 | 暂无角色权限细分 | 有管理令牌即可访问全部后台功能 |
| 9 | 暂无完整隐私政策页面 | 销售页底部有隐私说明占位文本 |

## 12. 后续 Backlog

### P0 — 上线前（阻塞部署）

- [ ] 购买域名并按规划配置 DNS
- [ ] 配置服务器/容器环境
- [ ] 配置生产环境变量（DB、JWT_SECRET、CORS_ORIGINS 等）
- [ ] 运行 `npm run migration:run` 创建生产数据库表
- [ ] 配置 GEO 线索 webhook（飞书/钉钉）
- [ ] 部署 `geo.moy.com`（GEO 前端站点）
- [ ] 部署 `api.app.moy.com`（后端 API）
- [ ] Smoke test 全链路（表单提交 → webhook → 后台查看）
- [ ] 准备正式隐私政策和服务条款页面

### P1 — 运营增强（下一阶段）

- [ ] 接入 MOY App 统一登录，替换临时 Token
- [ ] 角色权限（GEO 交付经理 / GEO 内容编辑 / 只读）
- [ ] 后端 Dashboard 聚合统计接口（减少前端 N+1 请求）
- [ ] PDF/Word 导出支持
- [ ] 客户门户（客户登录查看诊断报告和交付物）
- [ ] 客户审核流（内容发布前客户在线确认）

### P2 — 智能化（远期）

- [ ] 接入 MOY API Hub
- [ ] AI 自动生成诊断报告初稿
- [ ] AI 自动生成内容选题和稿件初稿
- [ ] 多模型内容质量评估
- [ ] AI 回答监测自动化（定期检测品牌在各平台被引用情况）

## 13. 冻结基线

| 属性 | 值 |
|------|-----|
| 冻结日期 | 2026-05-06 |
| 冻结阶段 | MOY-GEO-S1 |
| 冻结范围 | GEO 服务化交付闭环（前端 17 个页面 + 后端 3 个模块 + 6 张表 + 30 个管理 API + 4 个 Migration） |
| 下一阶段建议 | MOY API Hub MVP |
| 基线用途 | 后续上线部署、销售报价、交付 SOP、功能迭代的参考基线 |

---

*本报告基于 2026-05-06 全仓库代码状态编制。后续 S2/S3/S4 功能变更需以本报告为基线进行对比。*
