# GEO 内容稿件持久化

## 概述

`geo_content_drafts` 表存储 GEO 内容稿件，是 GEO 内容生产链路的终端产物。基于 `geo_content_topics`（选题），交付团队可生成、编辑、审核、发布内容稿件。

## 数据库设计

### geo_content_drafts

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 主键 |
| lead_id | varchar(36) | 关联线索 |
| brand_asset_id | varchar(36) | 关联品牌资产包 |
| report_id | varchar(36) | 关联诊断报告 |
| topic_id | varchar(36) | 关联内容选题 |
| plan_id | varchar(36) | 关联内容计划 |
| title | varchar(300) | 稿件标题 |
| slug | varchar(300) | 短链接/URL slug |
| content_type | varchar(50) | 内容类型（同选题枚举） |
| target_keyword | varchar(200) | 目标关键词 |
| target_question | text | 目标问题 |
| target_audience | varchar(200) | 目标受众 |
| platform | varchar(100) | 推荐发布平台 |
| status | varchar(20) | 状态：draft→reviewing→approved→published→archived |
| summary | text | 摘要 |
| outline | text | 大纲 |
| body | text | 正文（人工编写） |
| markdown | text | 生成的 Markdown 全文 |
| seo_title | varchar(300) | SEO 标题 |
| meta_description | varchar(500) | Meta Description |
| tags | jsonb | 标签数组 |
| compliance_checklist | jsonb | 合规检查清单数组 |
| review_notes | text | 审核备注 |
| published_url | varchar(500) | 已发布 URL |
| planned_publish_date | date | 计划发布日期 |
| actual_publish_date | date | 实际发布日期 |
| created_by | uuid | 创建人 |
| updated_by | uuid | 更新人 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

### 索引

- `idx_geo_content_drafts_lead_id` ON (lead_id)
- `idx_geo_content_drafts_brand_asset_id` ON (brand_asset_id)
- `idx_geo_content_drafts_topic_id` ON (topic_id)
- `idx_geo_content_drafts_plan_id` ON (plan_id)
- `idx_geo_content_drafts_status` ON (status)
- `idx_geo_content_drafts_created_at` ON (created_at)

### 状态枚举

| 状态 | 含义 | 允许流转到 |
|------|------|-----------|
| draft | 草稿 | reviewing, archived |
| reviewing | 审核中 | approved, archived |
| approved | 已通过 | published, archived |
| published | 已发布 | archived |
| archived | 已归档 | 无 |

**不允许的流转**：
- `published → draft`（已发布不能退回草稿）
- `archived → published`（已归档不能重新发布）

## 实体关系

```
geo_leads ─────────┐
                    │
geo_reports ──────┐│
                   ││
geo_brand_assets   ││
                   ││
geo_content_topics ││
                   ││
geo_content_plans  ││
    ┌──────────────┘│
    │  ┌────────────┘
    │  │   ┌─────────────┐
    ▼  ▼   ▼             │
geo_content_drafts ──────┘
    (leadId, brandAssetId, reportId, topicId, planId)
```

## API 接口

全部接口需要 JWT 认证。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/geo-content-drafts | 列表查询（leadId/brandAssetId/reportId/topicId/planId/status/contentType/keyword/page/pageSize） |
| POST | /api/v1/geo-content-drafts | 创建稿件 |
| GET | /api/v1/geo-content-drafts/:id | 详情 |
| PATCH | /api/v1/geo-content-drafts/:id | 更新稿件 |
| PATCH | /api/v1/geo-content-drafts/:id/status | 状态流转（含合法校验） |
| DELETE | /api/v1/geo-content-drafts/:id | 软删除（status=archived） |

## 前端页面

| 路径 | 页面 | 说明 |
|------|------|------|
| /admin/content-drafts | 稿件列表页 | 筛选/搜索/分页/创建/编辑/归档 |
| /admin/content-drafts/new | 稿件编辑页 | ?draftId=/ ?topicId=/ ?leadId=/ 等 |

### 稿件编辑页功能

- 基础信息：title, slug, contentType, targetKeyword, targetAudience, platform, status
- 内容结构：summary, outline, body
- SEO 信息：seoTitle, metaDescription, tags
- 审核信息：reviewNotes
- 合规检查：7 项 checkbox（内容基于客户真实资料、未使用未授权案例、未伪造媒体报道等）
- 发布信息：plannedPublishDate, actualPublishDate, publishedUrl
- 操作：保存/另存为/本地草稿/恢复草稿/生成Markdown/下载.md/清空
- 从 topicId 自动带入：title, contentType, targetKeyword, targetQuestion, targetAudience, outline, plannedPublishDate

### Markdown 生成

生成结构：
1. 标题 + slug
2. 内容类型 + 关键词
3. 摘要
4. 大纲
5. 正文（如为空则提示补充）
6. FAQ/延伸问题
7. SEO 信息
8. 合规检查
9. 发布信息

## 合规边界

- 不调用真实 AI 模型
- 不自动发布内容
- body 正文由人工填写，系统不自动生成
- 不伪造媒体报道或客户案例
- 不承诺排名
- 所有内容基于客户真实资料

## 联动入口

| 来源 | 跳转 |
|------|------|
| ContentTopicsListPage 操作列 | `/admin/content-drafts/new?topicId={id}` |
| ContentTopicEditorPage 保存后 | `+ 新建稿件` / `查看关联稿件` |
| ContentPlansListPage 操作列 | `/admin/content-drafts/new?planId={id}` / `稿件列表` |
| ContentPlanEditorPage 保存后 | `+ 新建稿件` / `查看关联稿件` |
| LeadDetailPanel 快捷操作 | `+ 新建内容稿件` / `查看内容稿件` |

## localStorage Key

`moy_geo_content_draft_draft` — 稿件编辑页草稿

## 后续规划

- S3：接入 AI 模型辅助生成正文
- S3：多级审核工作流
- S4：一键发布到各平台 API
- S4：内容效果追踪与数据回传
