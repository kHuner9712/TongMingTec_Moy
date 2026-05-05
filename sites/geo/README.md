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

**可部署运营版本**。表单提交已接入真实后端 `POST /api/geo/leads`。

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

## 后续计划

- S3：客户登录后台、诊断报告在线查看
- S4：在线支付、服务订阅管理

## 合规与隐私

- 表单区域已有占位隐私说明："提交信息仅用于 MOY GEO 诊断沟通与服务跟进，不会公开展示。"
- **生产上线前需准备正式隐私政策页面**（`geo.moy.com/privacy`），当前为占位版本
- 页面无"保证排名"、"百分百推荐"等违规承诺
- 不将 `api.moy.com` 用作 GEO 表单提交接口
