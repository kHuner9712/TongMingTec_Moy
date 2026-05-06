# MOY GEO

AI 搜索增长与品牌可见度服务站，对应域名：**geo.moy.com**。

## 站点定位

MOY GEO 帮助企业在 AI 搜索/问答平台（ChatGPT、豆包、Kimi、通义千问等）中被看见、被理解、被推荐。本网站是 GEO 服务的对外销售页和客户入口。

## 本地启动

```bash
npm install
npm run dev        # http://localhost:5176
```

## 构建

```bash
npm run build      # tsc --noEmit && vite build → dist/
```

## 当前状态

**可部署运营版本**。MOY GEO S1 已完成服务化交付闭环，进入阶段性冻结（v1.0）。下一阶段重点转向 MOY API Hub MVP。详见 [S1 阶段冻结报告](../docs/GEO/16_GEO_S1阶段冻结报告.md)。

- 9 个字段（公司名称、品牌名称、官网、行业、目标城市、主要竞品、联系人、手机/微信、备注）
- 前端校验（必填字段、URL 格式）
- 后端反垃圾（honeypot、website 校验、contactMethod 24h 频率限制）

## 表单存储方案

### 接入真实后端（推荐）

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

内容：

```env
VITE_GEO_LEAD_ENDPOINT=http://localhost:3001/api/geo/leads
```

设置后，表单提交将 POST 到后端接口，写入 `geo_leads` 表。

### 生产环境建议

```env
VITE_GEO_LEAD_ENDPOINT=https://api.app.moy.com/api/geo/leads
```

> 注意：不要使用 `api.moy.com`，那是 MOY API 开发者平台。

### 本地调试：fallback 到 localStorage

如果 `VITE_GEO_LEAD_ENDPOINT` 为空（默认），表单提交写入 `localStorage` key `moy_geo_submissions`。

开发环境右下角有「Debug: 提交记录」按钮，可查看 localStorage 中的提交。

## 本地联调后端步骤

```bash
# 1. 启动后端（确保 PostgreSQL 已运行）
cd backend && npm run start:dev    # http://localhost:3001

# 2. 配置 GEO 前端环境变量
echo "VITE_GEO_LEAD_ENDPOINT=http://localhost:3001/api/geo/leads" > sites/geo/.env

# 3. 启动 GEO 前端
cd sites/geo && npm run dev        # http://localhost:5176

# 4. 打开 http://localhost:5176 填写表单并提交
```

## 数据结构

每次提交的 JSON 格式：

```json
{
  "companyName": "桐鸣科技",
  "brandName": "MOY",
  "website": "https://moy.com",
  "industry": "SaaS",
  "targetCity": "深圳",
  "competitors": "",
  "contactName": "张三",
  "contactMethod": "13800138000",
  "notes": "",
  "submittedAt": "2026-05-03T10:30:00.000Z"
}
```

## 文件结构

```
src/
├── App.tsx                        # 页面布局 + 路由分发（官网 / admin）
├── config.ts                      # GEO_LEAD_ENDPOINT 配置
├── types.ts                       # LeadFormData / LeadSubmission 类型
├── leadStorage.ts                 # localStorage 读写 + 可选 POST
├── styles.tsx                     # 样式常量
├── components/
│   ├── LeadForm.tsx               # 表单组件（校验 + 提交）
│   └── DevSubmissionsPanel.tsx    # 开发调试面板（仅 dev 可见）
└── admin/
    ├── AdminLeadsPage.tsx         # 内部线索运营后台
    ├── ReportsListPage.tsx        # 诊断报告列表页
    ├── BrandAssetsListPage.tsx    # 品牌资产包列表页
    ├── adminTypes.ts              # 管理台类型定义
    ├── geoAdminApi.ts             # 管理接口调用封装
    ├── reports/
    │   ├── ReportBuilderPage.tsx  # 诊断报告生成器主页
    │   ├── reportTypes.ts         # 报告类型定义
    │   ├── reportStorage.ts       # localStorage 草稿读写
    │   ├── reportMarkdown.ts      # Markdown 报告生成
    │   ├── geoReportsApi.ts       # 报告后端 API
    │   └── components/
    │       ├── CustomerInfoForm.tsx   # 客户信息表单
    │       ├── DiagnosisScopeForm.tsx # 诊断范围表单
    │       ├── TestResultEditor.tsx   # 测试结果编辑器
    │       ├── SummaryForm.tsx        # 初步判断表单
    │       └── MarkdownPreview.tsx    # Markdown 预览与导出
    ├── brand-assets/
    │   ├── BrandAssetBuilderPage.tsx  # 品牌资产包生成器主页
    │   ├── brandAssetTypes.ts         # 资产包类型定义
    │   ├── brandAssetStorage.ts       # localStorage 草稿读写
    │   ├── brandAssetMarkdown.ts      # Markdown 资产包生成
    │   ├── geoBrandAssetsApi.ts       # 资产包后端 API
    │   └── components/
    │       ├── BasicInfoForm.tsx          # 基础信息表单
    │       ├── IntroForm.tsx              # 标准介绍表单
    │       ├── ServiceItemsEditor.tsx     # 产品服务编辑器
    │       ├── AdvantagesEditor.tsx       # 核心优势编辑器
    │       ├── CasesEditor.tsx            # 成功案例编辑器
    │       ├── FAQEditor.tsx              # FAQ 编辑器
    │       ├── CompetitorDiffEditor.tsx   # 竞品差异编辑器
    │       ├── ComplianceMaterialForm.tsx # 合规材料表单
    │       └── BrandAssetPreview.tsx      # 资产包预览与导出
    └── components/
        ├── AdminTokenPanel.tsx    # 管理员 Token 输入
        ├── LeadFilters.tsx        # 状态筛选 + 关键词搜索
        ├── LeadTable.tsx          # 线索列表表格
        ├── LeadDetailPanel.tsx    # 线索详情抽屉 + 状态更新
        └── StatusBadge.tsx        # 状态标签
```

## 相关后台接口

| 接口 | 说明 |
|------|------|
| `POST /api/geo/leads` | 公开表单提交 |
| `GET /api/v1/geo-leads` | 管理端：线索列表（需 JWT） |
| `GET /api/v1/geo-leads/:id` | 管理端：线索详情（需 JWT） |
| `PATCH /api/v1/geo-leads/:id/status` | 管理端：状态流转（需 JWT） |

## GEO Admin 本地使用

```bash
# 1. 启动后端（需 PostgreSQL）
cd backend && npm run start:dev         # http://localhost:3001

# 2. 启动 GEO 前端
cd sites/geo && npm run dev             # http://localhost:5176

# 3. 打开管理后台
#    http://localhost:5176/admin/leads

# 4. 输入 Token
#    登录 MOY App（http://localhost:5173），从浏览器 DevTools → Application → LocalStorage
#    获取 access_token，粘贴到管理后台的 Token 输入框中

# 5. 查看和处理线索
#    - 筛选状态 / 搜索关键词
#    - 点击"详情"查看完整信息
#    - 在右侧抽屉中更新状态
```

**说明**：

- 当前 Token 输入是临时内部方案，后续会接入统一登录
- 管理接口不能公开暴露给无权限用户
- 后端 `GET /api/v1/geo-leads` 等接口需要 JWT 认证
- Token 保存在 `localStorage` key `moy_geo_admin_token`

## 诊断报告生成器

### 页面路径

`/admin/reports/new` — MOY GEO AI 搜索可见度诊断报告生成器。

### 定位

基于客户资料、目标问题、竞品信息和人工测试结果，生成可交付给客户的 AI 搜索可见度诊断报告。**当前版本为人工录入 + 模板生成，不自动调用 AI 模型**。

### 表单字段

| 分类 | 字段 |
|------|------|
| 客户信息 | companyName, brandName, website, industry, targetCity, contactName |
| 诊断范围 | diagnosisDate, platforms（8 平台多选）, competitors, targetQuestions |
| 测试结果 | 多条测试记录，每条含 question, platform, brandMentioned, brandDescription, competitorsMentioned, sentiment（正向/中性/负向/未提及）, accuracy（准确/部分准确/不准确/无法判断）, notes |
| 初步判断 | visibilitySummary, mainProblems, opportunities, recommendedActions |

### 报告结构

生成的 Markdown 报告含以下章节：

1. 诊断背景
2. 诊断范围（测试平台 / 目标问题 / 主要竞品）
3. AI 回答测试结果（Markdown 表格）
4. 关键发现
5. 风险与问题
6. 优化机会
7. 建议执行动作
8. 下一步计划（固定模板）
9. 合规说明（固定模板）

### 操作功能

- **生成报告** — 从表单生成 Markdown
- **复制 Markdown** — 一键复制到剪贴板（支持降级方案）
- **下载 .md 文件** — 以 `{品牌名称}_AI可见度诊断报告.md` 命名
- **保存草稿** — localStorage key `moy_geo_report_draft`
- **恢复草稿** — 从 localStorage 恢复上次未完成的编辑
- **清空表单** — 清除所有输入（需确认）

### 从 lead 带入客户信息

访问 `/admin/reports/new?leadId=xxx`，页面会尝试调用 `GET /api/v1/geo-leads/:id`（使用 `moy_geo_admin_token`）自动填充客户信息字段：

- companyName → 公司名称
- brandName → 品牌名称
- website → 官网
- industry → 行业
- targetCity → 目标城市
- contactName → 联系人

如果 token 不存在或请求失败，不阻塞页面，仅提示"无法自动读取 lead，请手动填写"。

### 本地使用

```bash
# 1. 启动后端（可选，仅当需要 leadId 带入时）
cd backend && npm run start:dev         # http://localhost:3001

# 2. 启动 GEO 前端
cd sites/geo && npm run dev             # http://localhost:5176

# 3. 打开报告生成器
#    http://localhost:5176/admin/reports/new

# 4. 从已有 lead 带入数据（可选）
#    http://localhost:5176/admin/reports/new?leadId=1
```

## 品牌事实资产包生成器

### 页面路径

`/admin/brand-assets/new` — MOY GEO 品牌事实资产包生成器。

### 定位

把客户真实资料整理为 AI 可读、可复用、可审核的品牌事实资产。**当前版本为人工录入 + 模板生成，不自动调用 AI 模型**。所有内容必须基于客户真实信息，不得编造。

### 表单结构（9 个模块）

| 模块 | 内容 |
|------|------|
| 基础信息 | companyName, brandName, website, industry, targetCity, foundedYear, headquarters, contactInfo |
| 公司标准介绍 | 一句话介绍 / 100 字简介 / 500 字详细介绍 |
| 产品与服务 | 多条 serviceItems，每条含 name, targetUsers, painPoints, coreValue, deliverables, priceRange, serviceProcess |
| 核心优势 | 多条 advantages，每条含 title, description, proof |
| 成功案例 | 多条 cases，每条含 customerName, industry, problem, solution, result, canPublicize |
| FAQ | 多条 FAQ，每条含 question, answer |
| 竞品差异 | 多条 competitorDiffs，每条含 competitor, difference, ourAdvantage, evidence |
| 可公开引用材料 | 多行文本，如官网链接、公众号文章、新闻稿、案例链接等 |
| 禁止使用材料 | 多行文本，如未公开客户名称、未授权案例、敏感数据等 |

### 输出结构（10 章节 Markdown）

1. 基础信息
2. 标准品牌介绍
3. 产品与服务
4. 核心优势
5. 成功案例
6. 常见问题 FAQ
7. 竞品差异
8. 可公开引用材料
9. 禁止使用材料
10. GEO 内容使用规范（固定合规说明）

### 操作功能

- **生成资产包** — 从表单生成 Markdown
- **复制 Markdown** — 一键复制到剪贴板
- **下载 .md** — 以 `{品牌名称}_品牌事实资产包.md` 命名
- **保存草稿** — localStorage key `moy_geo_brand_asset_draft`
- **恢复草稿** — 从 localStorage 恢复
- **清空** — 清除所有输入（需确认）

### 从 lead 带入客户信息

访问 `/admin/brand-assets/new?leadId=xxx`，自动填充 companyName, brandName, website, industry, targetCity, contactInfo。

### 本地使用

```bash
# http://localhost:5176/admin/brand-assets/new
# http://localhost:5176/admin/brand-assets/new?leadId=1
```

## 后端持久化

诊断报告和品牌资产包支持保存到后端数据库。

### 报告管理接口 `GET/POST /api/v1/geo-reports`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/geo-reports | 列表（?leadId=&status=&keyword=&page=&pageSize=） |
| POST | /api/v1/geo-reports | 创建 |
| GET | /api/v1/geo-reports/:id | 详情 |
| PATCH | /api/v1/geo-reports/:id | 更新内容 |
| PATCH | /api/v1/geo-reports/:id/status | 更新状态（draft/ready/delivered/archived） |
| DELETE | /api/v1/geo-reports/:id | 归档 |

### 资产包管理接口 `GET/POST /api/v1/geo-brand-assets`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/geo-brand-assets | 列表（?leadId=&status=&keyword=&page=&pageSize=） |
| POST | /api/v1/geo-brand-assets | 创建 |
| GET | /api/v1/geo-brand-assets/:id | 详情 |
| PATCH | /api/v1/geo-brand-assets/:id | 更新内容 |
| PATCH | /api/v1/geo-brand-assets/:id/status | 更新状态（draft/ready/reviewed/delivered/archived） |
| DELETE | /api/v1/geo-brand-assets/:id | 归档 |

### 管理后台页面

| 路径 | 页面 | 说明 |
|------|------|------|
| `/admin/reports` | 报告列表 | 筛选/搜索/分页，点击跳转编辑 |
| `/admin/reports/new` | 报告编辑 | ?reportId= 加载已有, ?leadId= 带入线索 |
| `/admin/brand-assets` | 资产包列表 | 筛选/搜索/分页，点击跳转编辑 |
| `/admin/brand-assets/new` | 资产包编辑 | ?assetId= 加载已有, ?leadId= 带入线索 |
| `/admin/leads` | 线索管理 | 详情抽屉含快捷入口 |

### 快捷入口

线索详情抽屉 → 快捷操作：
- + 新建诊断报告
- + 新建品牌事实资产包
- 查看关联报告
- 查看关联资产包
- + 新建内容选题
- + 新建内容计划
- 查看关联内容选题
- 查看关联内容计划

## 内容选题库

### 页面路径

- `/admin/content-topics` — 选题列表
- `/admin/content-topics/new` — 选题编辑（?topicId= / ?leadId= / ?brandAssetId= / ?reportId=）

### 定位

基于品牌事实资产包，为客户规划 GEO 内容选题和文章方向。**不调用 AI 模型**，不自动发布内容。

### 表单字段

| 分类 | 字段 |
|------|------|
| 基础信息 | title, contentType（10 种）, priority（high/medium/low）, status（7 步生命周期） |
| 关键词与受众 | targetKeyword, targetQuestion, targetAudience, searchIntent（4 种） |
| 内容规划 | platformSuggestion, outline, keyPoints, referenceMaterials |
| 合规与发布 | complianceNotes, plannedPublishDate, actualPublishDate, publishedUrl |

### contentType 枚举

行业问答 / 本地服务 / 竞品对比 / 购买决策 / 常见误区 / 案例拆解 / 价格解释 / 服务流程 / 品牌介绍 / FAQ

### status 生命周期

idea → planned → drafting → reviewing → approved → published → archived

### 操作功能

- **保存到后端** — POST/PATCH /api/v1/geo-content-topics
- **另存为新选题** — 基于当前内容创建新记录
- **保存草稿** — localStorage key `moy_geo_content_topic_draft`
- **恢复草稿** — 从 localStorage 恢复

### 从联动入口

- 线索详情抽屉：`/admin/content-topics/new?leadId={id}` 或 `/admin/content-topics?leadId={id}`
- 品牌资产包保存后：`/admin/content-topics/new?brandAssetId={id}&leadId={leadId}` 或 `/admin/content-topics?brandAssetId={id}`
- 诊断报告：`/admin/content-topics/new?reportId={id}`

## 内容计划

### 页面路径

- `/admin/content-plans` — 计划列表
- `/admin/content-plans/new` — 计划编辑（?planId= / ?leadId= / ?brandAssetId=）

### 定位

为 GEO 交付团队规划月度/周期内容发布计划，关联内容选题，追踪交付状态。

### 表单字段

| 字段 | 说明 |
|------|------|
| title | 计划标题 |
| month | 计划月份（如 2026-05） |
| goal | 计划目标 |
| targetPlatforms | 目标平台（官网/公众号/知乎/小红书/百家号/头条号/搜狐号/B站专栏/行业媒体） |
| topicIds | 关联选题ID列表，每行一个 |
| summary | 计划总结 |
| status | draft / active / completed / archived |

### 操作功能

- **保存到后端** — POST/PATCH /api/v1/geo-content-plans
- **另存为新计划**
- **保存草稿** — localStorage key `moy_geo_content_plan_draft`
- **恢复草稿** — 从 localStorage 恢复

### 从联动入口

- 线索详情抽屉：`/admin/content-plans/new?leadId={id}` 或 `/admin/content-plans?leadId={id}`
- 品牌资产包保存后：`/admin/content-plans/new?brandAssetId={id}&leadId={leadId}` 或 `/admin/content-plans?brandAssetId={id}`

## 内容管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/geo-content-topics | 选题列表（?leadId=&brandAssetId=&reportId=&status=&priority=&contentType=&keyword=&page=&pageSize=） |
| POST | /api/v1/geo-content-topics | 创建选题 |
| GET | /api/v1/geo-content-topics/:id | 选题详情 |
| PATCH | /api/v1/geo-content-topics/:id | 更新选题 |
| PATCH | /api/v1/geo-content-topics/:id/status | 更新状态 |
| DELETE | /api/v1/geo-content-topics/:id | 归档选题（status=archived） |
| GET | /api/v1/geo-content-plans | 计划列表（?leadId=&brandAssetId=&status=&month=&keyword=&page=&pageSize=） |
| POST | /api/v1/geo-content-plans | 创建计划 |
| GET | /api/v1/geo-content-plans/:id | 计划详情 |
| PATCH | /api/v1/geo-content-plans/:id | 更新计划 |
| PATCH | /api/v1/geo-content-plans/:id/status | 更新状态 |
| DELETE | /api/v1/geo-content-plans/:id | 归档计划（status=archived） |

## 内容稿件生成器

### 页面路径

- `/admin/content-drafts` — 稿件列表
- `/admin/content-drafts/new` — 稿件编辑（?draftId= / ?topicId= / ?leadId= / ?brandAssetId= / ?planId=）

### 定位

基于内容选题生成、编辑、审核、发布 GEO 内容稿件。**不调用 AI 模型**，正文由人工编写。所有内容基于客户真实资料。

### 表单字段

| 分类 | 字段 |
|------|------|
| 基础信息 | title, slug, contentType（10 种）, targetKeyword, targetAudience, platform, status（5 步） |
| 内容结构 | summary, outline, body |
| SEO 信息 | seoTitle, metaDescription, tags |
| 审核信息 | reviewNotes |
| 合规检查 | 7 项 checkbox（基于真实资料/未使用未授权案例/未伪造媒体报道等） |
| 发布信息 | plannedPublishDate, actualPublishDate, publishedUrl |

### status 生命周期与流转

draft → reviewing → approved → published → archived

- draft → reviewing ✓
- reviewing → approved ✓
- approved → published ✓
- 任意状态 → archived ✓
- published → draft ✗（不允许回溯）
- archived → published ✗（不允许解档）

### 操作功能

- **保存/创建** — POST/PATCH /api/v1/geo-content-drafts
- **另存为新稿件** — 基于当前内容创建新记录
- **保存草稿** — localStorage key `moy_geo_content_draft_draft`
- **恢复草稿** — 从 localStorage 恢复
- **生成 Markdown** — 按模板生成并复制到剪贴板
- **下载 .md** — 以标题命名下载
- **清空** — 重置所有字段（需确认）

### 从 topicId 自动带入

访问 `/admin/content-drafts/new?topicId=xxx` 自动从选题带入：
title, contentType, targetKeyword, targetQuestion, targetAudience, outline, plannedPublishDate

### 从联动入口

- 线索详情抽屉：`/admin/content-drafts/new?leadId={id}` 或 `/admin/content-drafts?leadId={id}`
- 选题列表/编辑页：`/admin/content-drafts/new?topicId={id}&leadId={leadId}` 或 `/admin/content-drafts?topicId={id}`
- 计划列表/编辑页：`/admin/content-drafts/new?planId={id}&leadId={leadId}` 或 `/admin/content-drafts?planId={id}`

## 稿件管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/geo-content-drafts | 稿件列表（?leadId=&brandAssetId=&reportId=&topicId=&planId=&status=&contentType=&keyword=&page=&pageSize=） |
| POST | /api/v1/geo-content-drafts | 创建稿件 |
| GET | /api/v1/geo-content-drafts/:id | 稿件详情 |
| PATCH | /api/v1/geo-content-drafts/:id | 更新稿件 |
| PATCH | /api/v1/geo-content-drafts/:id/status | 状态流转（含校验） |
| DELETE | /api/v1/geo-content-drafts/:id | 归档稿件（status=archived） |

## GEO 客户项目工作台

### 页面路径

- `/admin/workspace?leadId=xxx`

### 定位

将某个 GEO lead 相关的所有交付物聚合到一个页面，形成真正的项目视图。纯前端聚合页，不新增后端实体。

### 数据结构

页面加载时并行请求 6 个 API：
- `GET /api/v1/geo-leads/:id`
- `GET /api/v1/geo-reports?leadId=&pageSize=100`
- `GET /api/v1/geo-brand-assets?leadId=&pageSize=100`
- `GET /api/v1/geo-content-topics?leadId=&pageSize=100`
- `GET /api/v1/geo-content-plans?leadId=&pageSize=100`
- `GET /api/v1/geo-content-drafts?leadId=&pageSize=100`

### 页面区块

| 区块 | 说明 |
|------|------|
| WorkspaceHeader | 公司/品牌信息 + 当前阶段 + lead 状态 |
| DeliveryProgress | 6 阶段进度条（完成/进行中/待开始 + 数量） |
| QuickActions | 10 个快捷跳转按钮（新建/查看各类交付物） |
| RecentDeliverables | 5 Tab 切换最近 20 条交付物 |
| ContentProductionSummary | 选题 + 稿件按 status 分组计数 |
| ProjectRiskHints | 自动风险提示（6 条规则） |

### 容错

- Promise.allSettled — 部分接口失败不崩溃
- 无 token → 提示返回管理后台
- 无 leadId → 空状态引导

### 联动入口

- LeadDetailPanel：`进入客户工作台`
- ReportBuilderPage：`返回客户工作台`（有 leadId 时）
- BrandAssetBuilderPage：`返回客户工作台`（有 leadId 时）
- ContentTopicEditorPage：`返回客户工作台`（有 leadId 时）
- ContentPlanEditorPage：`返回客户工作台`（有 leadId 时）
- ContentDraftEditorPage：`返回客户工作台`（有 leadId 时）

### 技术细节

- 不需要新增后端接口/实体
- 不接入 AI 模型
- 不对外/客户公开
- 需要 JWT 管理令牌

## GEO 运营总览 Dashboard

### 页面路径

- `/admin` — 管理员入口（默认跳转 Dashboard）
- `/admin/dashboard` — 运营总览仪表盘

### 定位

聚合全部 GEO 线索、交付物与内容生产状态，帮助交付团队快速判断今日应该优先处理什么。**纯前端聚合页**，不新增后端接口或实体。

### 数据来源

并行请求 6 个 API（pageSize=100）：

| API | 用途 |
|-----|------|
| GET `/api/v1/geo-leads?page=1&pageSize=100` | 所有线索 |
| GET `/api/v1/geo-reports?page=1&pageSize=100` | 所有报告 |
| GET `/api/v1/geo-brand-assets?page=1&pageSize=100` | 所有资产包 |
| GET `/api/v1/geo-content-topics?page=1&pageSize=100` | 所有选题 |
| GET `/api/v1/geo-content-plans?page=1&pageSize=100` | 所有计划 |
| GET `/api/v1/geo-content-drafts?page=1&pageSize=100` | 所有稿件 |

### 页面布局（8 区块）

| # | 组件 | 说明 |
|---|------|------|
| 1 | 页面标题 + 导航链接 | "MOY GEO 运营总览" |
| 2 | DashboardKpis | 8 指标卡片（线索/待处理/有效/成交/报告/资产包/选题/稿件） |
| 3 | TodoList | 12 条规则生成待办（分类：线索/交付/内容） |
| 4 | LeadFunnel | 7 级状态条形图 |
| 5 | ContentStatusSummary | 选题 7 状态 + 稿件 5 状态条形图 |
| 6 | RecentLeads | 最近 10 条线索 |
| 7 | RecentDeliverables | 报告/资产包/稿件 top 5 |
| 8 | ProjectRiskList | 9 条规则生成风险列表 |

### 待办规则

自动 12 条规则覆盖：线索未联系、线索未判定、有效线索待推进、报告缺资产包、资产包缺选题、选题缺稿件、稿件待审核、稿件待发布、选题待撰写

### 风险规则

自动 9 条规则覆盖：未启动诊断、资产建设卡住、内容规划滞后、选题未转化、稿件未交付、跟进停滞 >7 天、成交停滞 >7 天

### 容错

- Promise.allSettled 并行
- 全部为空 → 引导页
- 无 token → 提示

### Dashboard 入口

| 从 | 跳转 |
|----|------|
| `/admin` | 自动显示 Dashboard |
| `/admin/dashboard` | 直接进入 Dashboard |
| Dashboard 顶部导航 | 线索管理 / 客户工作台 |

## GEO Admin Layout

### 概述

所有 `/admin` 路径下的页面统一使用 `AdminLayout` 组件，提供一致的导航和操作体验。

### 布局结构

```
+-----------------------------------------+
|  AdminNav (sidebar)  |  TopBar          |
|  200px fixed         |  title + desc    |
|                      |  + Token badge   |
|  - 运营总览           |------------------|
|  - 线索池             |                  |
|  - 客户工作台          |  Content Area    |
|  - 诊断报告           |  (scrollable)    |
|  - 品牌资产           |                  |
|  - 内容选题           |                  |
|  - 内容计划           |                  |
|  - 内容稿件           |                  |
|  - 返回官网 →         |                  |
+-----------------------------------------+
```

### 导航高亮规则

| 导航项 | 高亮路径 |
|--------|----------|
| 运营总览 | `/admin`, `/admin/`, `/admin/dashboard` |
| 线索池 | `/admin/leads` |
| 客户工作台 | `/admin/workspace`, `/admin/workspace?leadId=xxx` |
| 诊断报告 | `/admin/reports`, `/admin/reports/new` |
| 品牌资产 | `/admin/brand-assets`, `/admin/brand-assets/new` |
| 内容选题 | `/admin/content-topics`, `/admin/content-topics/new` |
| 内容计划 | `/admin/content-plans`, `/admin/content-plans/new` |
| 内容稿件 | `/admin/content-drafts`, `/admin/content-drafts/new` |

### Token 临时机制

- 沿用现有 `localStorage` key `moy_geo_admin_token`
- AdminHeader 中显示 Token 状态：已设置（绿色）/ 未设置（琥珀色）
- 支持设置/更新/清除 Token，无需刷新页面
- 管理接口需 JWT 认证，Token 保存在浏览器本地存储

### 组件文件

```
src/admin/layout/
├── AdminLayout.tsx       # 布局容器（sidebar + topbar + content）
├── AdminNav.tsx          # 左侧导航栏
├── AdminHeader.tsx       # 顶部 Token 状态 + 标题
└── adminNavItems.ts      # 导航项定义 + 高亮匹配逻辑

src/admin/components/
├── AdminEmptyState.tsx   # 统一空状态组件
└── AdminErrorState.tsx   # 统一错误状态组件
```

### 后续统一登录计划

当前 Token 输入为临时方案。后续计划：
1. GEO Admin 接入 MOY App 统一登录
2. 根据角色（GEO 交付经理、GEO 内容编辑、GEO 客户经理）控制可见模块
3. 与 MOY 审批/接管/回滚中心打通

## GEO 客户交付导出包

### 页面路径

- `/admin/export?leadId=xxx`

### 定位

基于某个 leadId，将客户相关的诊断报告、品牌事实资产包、内容选题、内容计划、内容稿件汇总为一个 Markdown 交付包。**纯前端汇总，不新增后端接口**。

### 导出内容选项

页面提供 8 个 checkbox，默认全部勾选：

- 包含客户基础信息
- 包含诊断报告
- 包含品牌事实资产包
- 包含内容选题
- 包含内容计划
- 包含内容稿件
- 包含合规说明
- 包含交付摘要

### 操作功能

- 自动加载数据（6 个 API + 逐条详情含 Markdown 正文）
- 预览生成的 Markdown
- 复制 Markdown 到剪贴板
- 下载 `.md` 文件（命名：`{brandName}-GEO交付包-YYYY-MM-DD.md`）
- 返回客户工作台

### 联动入口

| 来源 | 入口 |
|------|------|
| 线索详情抽屉 | 📦 导出 GEO 交付包 |
| 客户工作台 | 📦 导出客户交付包 |

### 重要约束

- 不生成 PDF、Word、ZIP
- 不调用 AI 模型
- 不自动发送给客户
- 不接客户登录
- 交付前需人工复核内容和授权范围

### 组件文件

```
src/admin/export/
├── ExportPage.tsx        # 导出页面
└── exportMarkdown.ts     # Markdown 生成逻辑
```

## 后续计划

- S3：客户登录后台、诊断报告在线查看
- S4：在线支付、服务订阅管理

## 合规与隐私

- 表单区域已有占位隐私说明："提交信息仅用于 MOY GEO 诊断沟通与服务跟进，不会公开展示。"
- **生产上线前需准备正式隐私政策页面**（`geo.moy.com/privacy`），当前为占位版本
- 页面无"保证排名"、"百分百推荐"等违规承诺
- 不将 `api.moy.com` 用作 GEO 表单提交接口
