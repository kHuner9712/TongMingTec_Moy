# 09 GEO 交付资产持久化

> 状态：已实现 | 阶段：S1 | 最后更新：2026-05-06

## 定位

为 MOY GEO 诊断报告生成器和品牌事实资产包生成器提供后端持久化支持，使 GEO 交付团队可将报告和资产包保存到数据库，并在后台管理页面中检索、编辑、管理生命周期。

## 数据库表

### geo_reports — 诊断报告

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| lead_id | VARCHAR(36) | 关联线索 ID |
| title | VARCHAR(200) | 报告标题 |
| company_name | VARCHAR(200) | 公司名称 |
| brand_name | VARCHAR(200) | 品牌名称 |
| website | VARCHAR(500) | 官网 |
| industry | VARCHAR(100) | 行业 |
| target_city | VARCHAR(100) | 目标城市 |
| contact_name | VARCHAR(100) | 联系人 |
| status | VARCHAR(20) | draft / ready / delivered / archived |
| diagnosis_date | DATE | 诊断日期 |
| platforms | JSONB | 测试平台列表 |
| competitors | TEXT | 竞品（多行） |
| target_questions | TEXT | 目标问题（多行） |
| test_results | JSONB | 测试记录数组 |
| visibility_summary | TEXT | 可见度总结 |
| main_problems | TEXT | 主要问题 |
| opportunities | TEXT | 优化机会 |
| recommended_actions | TEXT | 建议动作 |
| markdown | TEXT | 生成的 Markdown 全文 |
| created_by | UUID | 创建人 |
| updated_by | UUID | 更新人 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

索引：`lead_id`, `status`, `brand_name`, `created_at`

### geo_brand_assets — 品牌事实资产包

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| lead_id | VARCHAR(36) | 关联线索 ID |
| title | VARCHAR(200) | 资产包标题 |
| company_name | VARCHAR(200) | 公司名称 |
| brand_name | VARCHAR(200) | 品牌名称 |
| website | VARCHAR(500) | 官网 |
| industry | VARCHAR(100) | 行业 |
| target_city | VARCHAR(100) | 目标城市 |
| status | VARCHAR(20) | draft / ready / reviewed / delivered / archived |
| basic_info | JSONB | 基础信息对象 |
| company_intro | JSONB | 公司介绍对象 |
| service_items | JSONB | 产品服务数组 |
| advantages | JSONB | 核心优势数组 |
| cases | JSONB | 成功案例数组 |
| faqs | JSONB | FAQ 数组 |
| competitor_diffs | JSONB | 竞品差异数组 |
| compliance_materials | JSONB | 合规材料对象 |
| markdown | TEXT | 生成的 Markdown 全文 |
| created_by | UUID | 创建人 |
| updated_by | UUID | 更新人 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

索引：`lead_id`, `status`, `brand_name`, `created_at`

## 状态流转

### 诊断报告

```
draft → ready → delivered → archived
draft → archived
```

### 品牌资产包

```
draft → ready → reviewed → delivered → archived
draft → archived
ready → delivered (跳过审核)
```

## API 接口

全部接口位于 `/api/v1/geo-reports` 和 `/api/v1/geo-brand-assets`，需要 Bearer Token 认证。

### 诊断报告

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/geo-reports | 列表（支持 ?leadId=&status=&keyword=&page=&pageSize=） |
| POST | /api/v1/geo-reports | 创建 |
| GET | /api/v1/geo-reports/:id | 详情 |
| PATCH | /api/v1/geo-reports/:id | 更新内容 |
| PATCH | /api/v1/geo-reports/:id/status | 更新状态 |
| DELETE | /api/v1/geo-reports/:id | 归档（软删除） |

### 品牌资产包

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/geo-brand-assets | 列表（支持 ?leadId=&status=&keyword=&page=&pageSize=） |
| POST | /api/v1/geo-brand-assets | 创建 |
| GET | /api/v1/geo-brand-assets/:id | 详情 |
| PATCH | /api/v1/geo-brand-assets/:id | 更新内容 |
| PATCH | /api/v1/geo-brand-assets/:id/status | 更新状态 |
| DELETE | /api/v1/geo-brand-assets/:id | 归档（软删除） |

## 前端页面

### 列表页

| 路径 | 说明 |
|------|------|
| `/admin/reports` | 诊断报告列表（筛选/搜索/分页） |
| `/admin/brand-assets` | 品牌资产包列表（筛选/搜索/分页） |

### 编辑页

| 路径 | 说明 |
|------|------|
| `/admin/reports/new` | 新建/编辑诊断报告（支持 ?reportId= 加载已有报告，?leadId= 自动带入） |
| `/admin/brand-assets/new` | 新建/编辑资产包（支持 ?assetId= 加载已有，?leadId= 自动带入） |

### 快捷入口

线索详情抽屉中新增“快捷操作”区域：
- 新建诊断报告
- 新建品牌事实资产包
- 查看关联报告
- 查看关联资产包

## 后端文件

```
backend/src/modules/geo-deliverables/
├── entities/
│   ├── geo-report.entity.ts
│   └── geo-brand-asset.entity.ts
├── dto/
│   ├── create-geo-report.dto.ts
│   ├── update-geo-report.dto.ts
│   ├── query-geo-reports.dto.ts
│   ├── update-geo-report-status.dto.ts
│   ├── create-geo-brand-asset.dto.ts
│   ├── update-geo-brand-asset.dto.ts
│   ├── query-geo-brand-assets.dto.ts
│   └── update-geo-brand-asset-status.dto.ts
├── geo-reports.service.ts
├── geo-brand-assets.service.ts
├── geo-reports.controller.ts
├── geo-brand-assets.controller.ts
├── geo-deliverables.module.ts
├── geo-reports.service.spec.ts
└── geo-brand-assets.service.spec.ts
```

## Migration

文件：`backend/src/migrations/1714200000000-CreateGeoDeliverables.ts`

运行：`npm run migration:run`
