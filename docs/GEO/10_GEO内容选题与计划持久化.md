# 10 GEO 内容选题与计划持久化

> 状态：已实现 | 阶段：S1 | 最后更新：2026-05-06

## 定位

为 MOY GEO 提供内容选题库和内容计划管理能力，让交付团队可基于品牌事实资产包，为客户规划结构化内容选题、文章方向、发布计划和交付状态。

## 数据库表

### geo_content_topics — 内容选题

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| lead_id | VARCHAR(36) | 关联线索 |
| brand_asset_id | VARCHAR(36) | 关联品牌资产包 |
| report_id | VARCHAR(36) | 关联诊断报告 |
| title | VARCHAR(300) | 选题标题 |
| content_type | VARCHAR(50) | 内容类型 |
| target_keyword | VARCHAR(200) | 目标关键词 |
| target_question | TEXT | 目标问题 |
| target_audience | VARCHAR(200) | 目标受众 |
| search_intent | VARCHAR(50) | 搜索意图 |
| platform_suggestion | VARCHAR(200) | 平台建议 |
| priority | VARCHAR(20) | 优先级 high/medium/low |
| status | VARCHAR(20) | 状态 |
| outline | TEXT | 内容大纲 |
| key_points | JSONB | 关键要点 |
| reference_materials | JSONB | 参考资料 |
| compliance_notes | TEXT | 合规备注 |
| planned_publish_date | DATE | 计划发布日期 |
| actual_publish_date | DATE | 实际发布日期 |
| published_url | VARCHAR(500) | 已发布 URL |

索引：`lead_id`, `brand_asset_id`, `status`, `priority`, `created_at`

### geo_content_plans — 内容计划

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| lead_id | VARCHAR(36) | 关联线索 |
| brand_asset_id | VARCHAR(36) | 关联品牌资产包 |
| title | VARCHAR(300) | 计划标题 |
| month | VARCHAR(20) | 月份 2026-05 |
| goal | TEXT | 计划目标 |
| target_platforms | JSONB | 目标平台 |
| topics | JSONB | 关联选题 ID 列表 |
| status | VARCHAR(20) | draft/active/completed/archived |
| summary | TEXT | 计划总结 |

索引：`lead_id`, `brand_asset_id`, `status`, `month`, `created_at`

## 枚举

### contentType（10 种）

| 值 | 中文 |
|----|------|
| industry_question | 行业问答 |
| local_service | 本地服务 |
| competitor_comparison | 竞品对比 |
| buying_guide | 购买决策 |
| misconception | 常见误区 |
| case_study | 案例拆解 |
| pricing_explainer | 价格解释 |
| process_explainer | 服务流程 |
| brand_intro | 品牌介绍 |
| faq | FAQ |

### searchIntent（4 种）

| 值 | 中文 |
|----|------|
| informational | 信息了解 |
| commercial | 商业比较 |
| navigational | 品牌导航 |
| transactional | 购买决策 |

### priority

high / medium / low

### topicStatus（7 种）

idea → planned → drafting → reviewing → approved → published
任意状态 → archived

### planStatus（4 种）

draft → active → completed → archived

## 与现有实体的关系

```
geo_leads (线索)
  ├── geo_reports (诊断报告)
  │     └── geo_content_topics (选题)
  ├── geo_brand_assets (品牌资产包)
  │     ├── geo_content_topics (选题)
  │     └── geo_content_plans (计划)
  └── geo_content_plans (计划)
        └── geo_content_topics (选题)
```

## API 接口

全部需要 JWT Bearer Token。

### Content Topics

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/geo-content-topics | 列表（?leadId=&brandAssetId=&reportId=&status=&priority=&contentType=&keyword=） |
| POST | /api/v1/geo-content-topics | 创建 |
| GET | /api/v1/geo-content-topics/:id | 详情 |
| PATCH | /api/v1/geo-content-topics/:id | 更新 |
| PATCH | /api/v1/geo-content-topics/:id/status | 更新状态 |
| DELETE | /api/v1/geo-content-topics/:id | 归档 |

### Content Plans

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/geo-content-plans | 列表（?leadId=&brandAssetId=&status=&month=&keyword=） |
| POST | /api/v1/geo-content-plans | 创建 |
| GET | /api/v1/geo-content-plans/:id | 详情 |
| PATCH | /api/v1/geo-content-plans/:id | 更新 |
| PATCH | /api/v1/geo-content-plans/:id/status | 更新状态 |
| DELETE | /api/v1/geo-content-plans/:id | 归档 |

## 前端页面

| 路径 | 页面 |
|------|------|
| `/admin/content-topics` | 选题列表（筛选/搜索/分页） |
| `/admin/content-topics/new` | 选题编辑（?topicId= / ?leadId= / ?brandAssetId= / ?reportId=） |
| `/admin/content-plans` | 计划列表（筛选/搜索/分页） |
| `/admin/content-plans/new` | 计划编辑（?planId= / ?leadId= / ?brandAssetId=） |

### localStorage keys

| Key | 用途 |
|------|------|
| `moy_geo_content_topic_draft` | 选题编辑草稿 |
| `moy_geo_content_plan_draft` | 计划编辑草稿 |

## 联动入口

- **线索详情** → 快捷操作：新建/查看选题、新建/查看计划
- **品牌资产包编辑页** → 保存后显示快捷入口：新建/查看选题、新建/查看计划

## 合规边界

- 不自动生成内容（仅结构化录入选题信息）
- 不自动发布到任何平台
- 所有选题内容需客户确认后才可发布
- 选题中的 referenceMaterials 必须可追溯到真实来源
- 不承诺排名、不伪造案例、不生成虚假内容

## 后续规划

- 内容生成器（对接 AI 模型 Draft → 人工审核 → 发布）
- 发布状态追踪
- AI 可见度变化监测
- 选题 → 文章 → 发布 → 监测闭环
