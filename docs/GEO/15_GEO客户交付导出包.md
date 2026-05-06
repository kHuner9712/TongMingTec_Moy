# GEO 客户交付导出包

## 1. 文档定位

本文档定义 MOY GEO Admin 客户交付导出包的功能设计、技术实现和使用规范。

适用对象：GEO 交付团队。

## 2. 功能概述

**客户 GEO 交付导出包** 是基于某个 leadId，将客户相关的诊断报告、品牌事实资产包、内容选题、内容计划、内容稿件汇总为一个 Markdown 交付包的纯前端功能。

### 2.1 核心价值

- 交付团队可一键汇总某客户的所有交付物
- 统一 Markdown 格式，方便复制、下载、归档
- 可选导出内容，按需生成
- 内置合规说明，保障每次导出都附带合规声明

### 2.2 不是什么

| 不是 | 说明 |
|------|------|
| 不是 PDF 生成器 | 不生成 PDF 文件 |
| 不是 Word 生成器 | 不生成 Word 文档 |
| 不是压缩包工具 | 不打包 zip 文件 |
| 不是 AI 工具 | 不调用 AI 模型 |
| 不是客户自助服务 | 不接客户登录，不自动发送给客户 |
| 不是自动化投递 | 导出结果仅供内部使用和人工发送 |

## 3. 页面路径

### 3.1 主页面

```
/admin/export?leadId=xxx
```

- 无 leadId：提示从线索池或客户工作台选择客户
- 无 token：提示设置管理员令牌

### 3.2 联动入口

| 来源 | 入口 | 目标路径 |
|------|------|----------|
| 线索详情抽屉 | 📦 导出 GEO 交付包 | `/admin/export?leadId={lead.id}` |
| 客户工作台 | 📦 导出客户交付包 | `/admin/export?leadId={leadId}` |

## 4. 数据获取

复用客户工作台同样的 6 个后端接口：

| API | 说明 |
|-----|------|
| `GET /api/v1/geo-leads/:id` | 线索详情 |
| `GET /api/v1/geo-reports?leadId=&pageSize=100` | 诊断报告列表 |
| `GET /api/v1/geo-brand-assets?leadId=&pageSize=100` | 品牌资产包列表 |
| `GET /api/v1/geo-content-topics?leadId=&pageSize=100` | 内容选题列表 |
| `GET /api/v1/geo-content-plans?leadId=&pageSize=100` | 内容计划列表 |
| `GET /api/v1/geo-content-drafts?leadId=&pageSize=100` | 内容稿件列表 |

首轮加载 6 个接口后，对报告、品牌资产包、稿件逐条获取详情（含 Markdown 正文），使用 `Promise.allSettled` 容错。

**鉴权**：使用 `moy_geo_admin_token`（Bearer Token）。

## 5. 导出内容选项

页面提供 8 个 checkbox，默认全部勾选：

| 选项 | 对应 Markdown 章节 |
|------|-------------------|
| 包含交付摘要 | 1. 交付摘要（数量汇总表） |
| 包含客户基础信息 | 2. 客户基础信息 |
| 包含诊断报告 | 3. 诊断报告（含 Markdown 正文） |
| 包含品牌事实资产包 | 4. 品牌事实资产包（含 Markdown 正文） |
| 包含内容选题 | 5. 内容选题（Markdown 表格） |
| 包含内容计划 | 6. 内容计划 |
| 包含内容稿件 | 7. 内容稿件（按状态分组） |
| 包含合规说明 | 8. 合规说明 |

## 6. Markdown 输出结构

```markdown
# {brandName} GEO 交付包

> 生成日期：2026-05-06

## 1. 交付摘要
| 交付项 | 数量 |
|--------|------|
| 诊断报告 | 2 |
| 品牌事实资产包 | 1 |
| 内容选题 | 8 |
| 内容计划 | 2 |
| 内容稿件 | 5 |
| 已发布稿件 | 2 |

## 2. 客户基础信息
- 公司：某某科技有限公司
- 品牌：某品牌
- 官网：https://example.com
- 行业：SaaS
- 城市：深圳
- 联系人：张三
- 当前线索状态：有效线索

## 3. 诊断报告
### 3.1 某品牌 AI 搜索可见度诊断报告
- 状态：ready
- 诊断日期：2026-05-01

{Markdown 正文}

## 4. 品牌事实资产包
...

## 5. 内容选题
| 标题 | 类型 | 目标关键词 | 目标问题 | 优先级 | 状态 | 计划发布日期 |
|------|------|------------|----------|--------|------|--------------|
| ... | ... | ... | ... | 高 | 已规划 | 2026-05-15 |

## 6. 内容计划
...

## 7. 内容稿件
### 草稿
#### 稿件标题
- 状态：草稿
- 平台：官网
- 目标关键词：...

### 已发布
...

## 8. 合规说明
本交付包仅基于客户提供资料、人工测试结果和已确认的品牌事实资产整理。
MOY GEO 不承诺固定排名，不提供虚假宣传、伪造媒体报道、伪造客户案例或垃圾内容批量发布服务。
对外发布前，客户需确认内容准确性与授权范围。
```

## 7. 页面功能

| 功能 | 说明 |
|------|------|
| 加载数据 | 自动从 6 个接口加载，显示加载状态 |
| 选择导出内容 | 8 个 checkbox 实时切换，修改后需重新生成 |
| 生成 Markdown | 点击按钮生成，按钮在加载详情时 disabled |
| 预览 Markdown | 在页面上直接预览完整 Markdown |
| 复制 Markdown | 一键复制到剪贴板（含降级方案） |
| 下载 .md 文件 | 以 `{brandName}-GEO交付包-YYYY-MM-DD.md` 命名下载 |
| 返回客户工作台 | 顶部链接返回 `/admin/workspace?leadId={leadId}` |

## 8. 组件文件

```
src/admin/export/
├── ExportPage.tsx        # 导出页面（数据加载 + 选项 + 生成 + 预览 + 操作）
└── exportMarkdown.ts     # Markdown 生成逻辑（ExportData, ExportOptions, generateExportMarkdown）
```

### 核心类型

```typescript
interface ExportData {
  lead: GeoLead | null;
  reports: GeoReportFull[];
  brandAssets: GeoBrandAssetFull[];
  topics: GeoContentTopicBrief[];
  plans: GeoContentPlanBrief[];
  drafts: GeoContentDraftFull[];
}

interface ExportOptions {
  includeCustomerInfo: boolean;
  includeReports: boolean;
  includeBrandAssets: boolean;
  includeTopics: boolean;
  includePlans: boolean;
  includeDrafts: boolean;
  includeCompliance: boolean;
  includeSummary: boolean;
}
```

## 9. 边界与约束

| 约束 | 说明 |
|------|------|
| 不改后端 | 不新增后端接口、实体、迁移 |
| 不新增后端接口 | 复用现有 6 个公开 API |
| 不接统一登录 | 沿用 `moy_geo_admin_token` 临时方案 |
| 不生成 PDF/Word/ZIP | 只生成 Markdown 文本 |
| 不调用 AI | 纯数据汇总拼接 |
| 不自动发送客户 | 导出结果需人工复核后发送 |
| 不影响 GEO 官网 | 纯管理后台功能 |
| 不影响 MOY App | 不修改 MOY App 任何代码 |

## 10. 后续演进

- S3：支持按服务套餐版本生成不同结构的交付包
- S3：支持导出为 HTML 格式（带样式）
- S4：支持通过邮件直接发送给客户（需客户登录和授权）
- S4：支持历史交付包版本管理和对比

## 11. 使用规范

### 交付前必检

- [ ] 所有品牌信息已与客户确认
- [ ] 所有案例已获客户授权（canPublicize = true）
- [ ] 合规说明章节未被删除
- [ ] 稿件中的发布链接有效
- [ ] 内部备注、竞品敏感信息未被包含

### 命名规范

下载文件名格式：`{brandName}-GEO交付包-{YYYY-MM-DD}.md`

示例：`MOY-GEO交付包-2026-05-06.md`
