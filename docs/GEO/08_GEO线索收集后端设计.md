# MOY GEO 线索收集后端设计

## 1. 文档用途

本文档定义 geo.moy.com「获取 AI 可见度诊断」表单的后端接口、数据模型、风控策略和与 MOY App 的边界。供后端开发和接口联调参考。

**注意：本文档仅作设计，暂不实现代码。**

## 2. 背景

### 2.1 当前状态

- `sites/geo` 前端已实现可交付线索收集 MVP（[LeadForm](../sites/geo/src/components/LeadForm.tsx)）
- 表单字段：companyName / brandName / website / industry / targetCity / competitors / contactName / contactMethod / notes
- 第一阶段默认写入 `localStorage`，通过 `VITE_GEO_LEAD_ENDPOINT` 环境变量可切换到远程 POST
- 前端已提供开发调试面板（[DevSubmissionsPanel](../sites/geo/src/components/DevSubmissionsPanel.tsx)）

### 2.2 为什么需要独立后端

| 原因 | 说明 |
| --- | --- |
| localStorage 不可靠 | 客户端存储易丢失，无法跨设备同步，无法团队协作 |
| 正式服务化交付需要 | 线索需要流转（received → contacted → qualified → won），需要通知和分配 |
| 不应污染 MOY App | GEO 线索是独立业务线，不应直接写入 MOY App 客户表或 leads 表 |
| 独立演进 | GEO backend 未来可能有自己的业务逻辑、计费、客户门户 |

### 2.3 设计原则

- **独立**：GEO leads 有自己的数据库和状态流转，不默认进入 MOY App
- **轻量**：MVP 只需要一张表 + 一个 POST 接口，不引入复杂框架
- **可扩展**：预留状态枚举、分配字段、通知钩子，方便后续迭代
- **合规**：反垃圾、限流、数据最小化，符合 MOY GEO 合规底线

## 3. 接口设计

### 3.1 提交线索

```
POST /api/geo/leads
```

**请求体 (JSON)**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| companyName | string | 是 | 公司名称 |
| brandName | string | 是 | 品牌名称 |
| website | string | 是 | 官网 URL |
| industry | string | 是 | 行业分类 |
| targetCity | string | 否 | 目标城市 |
| competitors | string | 否 | 主要竞品（逗号分隔或自由文本） |
| contactName | string | 是 | 联系人姓名 |
| contactMethod | string | 是 | 手机号或微信号 |
| notes | string | 否 | 备注信息 |
| source | string | 否 | 来源标识，默认 `geo_website_form` |
| submittedAt | string | 否 | 客户端提交时间 ISO 8601，服务端同时记录 `created_at` |

**响应 (201 Created)**

```json
{
  "id": "geo_lead_xxx",
  "status": "received",
  "message": "诊断申请已收到，我们将在 1 个工作日内联系你。"
}
```

**响应 (400 Bad Request)**

```json
{
  "error": "validation_error",
  "message": "请填写所有必填字段",
  "fields": ["companyName", "website"]
}
```

**响应 (429 Too Many Requests)**

```json
{
  "error": "rate_limited",
  "message": "提交过于频繁，请稍后再试。",
  "retryAfter": 3600
}
```

### 3.2 查询线索列表（后期）

```
GET /api/geo/leads?status=received&page=1&pageSize=20
```

需要认证，MVP 阶段通过 API Key 或 JWT 鉴权。

### 3.3 更新线索状态（后期）

```
PATCH /api/geo/leads/:id
```

```
{
  "status": "contacted",
  "assignedTo": "user_xxx",
  "notes": "已致电客户，约定周四下午 3 点诊断沟通。"
}
```

## 4. 数据表设计

### 4.1 表名：`geo_leads`

```sql
CREATE TABLE geo_leads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name        VARCHAR(200) NOT NULL,
    brand_name          VARCHAR(200) NOT NULL,
    website             VARCHAR(500) NOT NULL,
    industry            VARCHAR(100) NOT NULL,
    target_city         VARCHAR(100),
    competitors         TEXT,
    contact_name        VARCHAR(100) NOT NULL,
    contact_method      VARCHAR(100) NOT NULL,
    notes               TEXT,
    source              VARCHAR(50) NOT NULL DEFAULT 'geo_website_form',

    status              VARCHAR(20) NOT NULL DEFAULT 'received',

    assigned_to         UUID,
    first_contacted_at  TIMESTAMPTZ,
    converted_to_customer_id VARCHAR(100),

    ip_address          VARCHAR(45),
    user_agent          TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_geo_leads_status ON geo_leads(status);
CREATE INDEX idx_geo_leads_created ON geo_leads(created_at);
CREATE INDEX idx_geo_leads_website ON geo_leads(website);
CREATE INDEX idx_geo_leads_contact ON geo_leads(contact_method);
```

### 4.2 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | UUID | 主键，格式 `geo_lead_` + 短 UUID（前端展示用） |
| company_name | VARCHAR(200) | |
| brand_name | VARCHAR(200) | |
| website | VARCHAR(500) | 经过校验的 URL |
| industry | VARCHAR(100) | |
| target_city | VARCHAR(100) | 可空 |
| competitors | TEXT | 可空 |
| contact_name | VARCHAR(100) | |
| contact_method | VARCHAR(100) | 手机号或微信号 |
| notes | TEXT | 可空 |
| source | VARCHAR(50) | 来源，默认 `geo_website_form` |
| status | VARCHAR(20) | 见 §4.3 |
| assigned_to | UUID | 分配给哪位 GEO 顾问 |
| first_contacted_at | TIMESTAMPTZ | 首次联系客户的时间 |
| converted_to_customer_id | VARCHAR(100) | 若转为 MOY App 客户，记录 App 侧 ID |
| ip_address | VARCHAR(45) | 提交 IP（风控用） |
| user_agent | TEXT | 浏览器 UA（风控用） |
| created_at | TIMESTAMPTZ | 服务端接收时间 |
| updated_at | TIMESTAMPTZ | 最后更新时间 |

### 4.3 status 枚举

| 值 | 含义 | 典型触发动作 |
| --- | --- | --- |
| `received` | 已收到，待处理 | 表单提交后自动设置 |
| `contacted` | 已联系客户 | GEO 顾问标记已首次联系 |
| `qualified` | 已确认需求，有合作意向 | 诊断沟通后评估为有效线索 |
| `proposal_sent` | 已发送方案/报价 | |
| `won` | 成交 | 客户确认合作 |
| `lost` | 关闭-未成交 | 客户拒绝 / 无回应 / 不符合条件 |
| `archived` | 归档 | 垃圾 / 重复 / 测试数据 |

### 4.4 与前端表单的字段映射

| 前端 LeadFormData | 后端 API 字段 | 数据库列名 |
| --- | --- | --- |
| companyName | companyName | company_name |
| brandName | brandName | brand_name |
| website | website | website |
| industry | industry | industry |
| targetCity | targetCity | target_city |
| competitors | competitors | competitors |
| contactName | contactName | contact_name |
| contactMethod | contactMethod | contact_method |
| notes | notes | notes |
| — | source | source |
| — | — | status |
| — | — | ip_address |
| — | — | user_agent |

## 5. 风控与反垃圾

### 5.1 Honeypot 字段

前端表单中增加隐藏字段 `_hint`（CSS 隐藏，正常用户不可见）。若该字段有值，即为机器人，直接返回 200 假成功（不写入数据库）。

后端校验：若收到 `_hint` 非空，静默丢弃。

### 5.2 IP 限流

| 策略 | 参数 |
| --- | --- |
| 同一 IP 每分钟最多提交次数 | 5 次 |
| 超出后返回 | 429 + `Retry-After: 60` |

实现：内存计数器（MVP）或 Redis（后期）。

### 5.3 联系方式限流

同一 `contact_method`（手机/微信）24 小时内最多提交 3 次。超出返回 429。

```sql
SELECT COUNT(*) FROM geo_leads
WHERE contact_method = ? AND created_at > now() - INTERVAL '24 hours';
```

### 5.4 website 检查

| 检查 | 说明 |
| --- | --- |
| 格式校验 | 必须是合法 URL（http/https），非 IP 地址 |
| 本地域名禁止 | 拒绝 `localhost`、`127.0.0.1`、`0.0.0.0` |
| 可选的公共后缀检查 | 拒绝已知垃圾域名（后期维护黑名单） |

### 5.5 contactMethod 最小长度

`contactMethod` 长度必须 ≥ 5 个字符（过滤短随机字符串）。

### 5.6 可选验证码

后期接入腾讯验证码或 hCaptcha。MVP 阶段依赖 honeypot + 限流即可。

### 5.7 静默丢弃 vs 明确拒绝

| 场景 | 策略 | 原因 |
| --- | --- | --- |
| Honeypot 触发 | 静默丢弃（返回 200 假成功） | 不暴露检测机制 |
| 限流触发 | 明确 429 | 正常用户偶尔超频需要知道原因 |
| 格式校验失败 | 明确 400 + 字段级错误 | 帮助用户修正 |

## 6. 通知

### 6.1 通知渠道

| 渠道 | 触发条件 | 优先级 |
| --- | --- | --- |
| 邮件 | 新线索提交 → 邮件通知 GEO 团队 | P1 |
| 企业微信/飞书 Webhook | 新线索提交 → 群机器人消息 | P1 |
| MOY App 内部通知 | 后期接入统一通知中心 | P3 |

### 6.2 邮件通知模板

```
主题：【MOY GEO】新诊断申请 - {company_name}

收到新的 AI 可见度诊断申请：

公司：{company_name}
品牌：{brand_name}
官网：{website}
行业：{industry}
联系人：{contact_name} / {contact_method}

查看详情：https://geo.moy.com/admin/leads/{id}
```

### 6.3 企业微信/飞书 Webhook 消息格式

```json
{
  "msgtype": "markdown",
  "markdown": {
    "content": "## 🆕 新 GEO 诊断申请\n\n**公司**：{company_name}\n**品牌**：{brand_name}\n**行业**：{industry}\n**联系人**：{contact_name} / {contact_method}\n\n[查看详情](https://geo.moy.com/admin/leads/{id})"
  }
}
```

## 7. 与 MOY App 的关系

### 7.1 阶段一：完全独立（MVP）

- GEO leads 存储在独立数据库/表
- 不自动写入 MOY App 的任何表
- GEO 团队有自己的线索管理后台（远期 `sites/geo` 内）
- 两条产品线的数据边界清晰

### 7.2 阶段二：人工桥接（S3+）

当一条 GEO lead 状态变为 `qualified` 后，GEO 顾问可手动执行"转入 MOY App"操作：

| 步骤 | 操作 |
| --- | --- |
| 1 | GEO 顾问判断该客户适合 MOY App |
| 2 | 在 GEO 后台点击「转入 MOY App」 |
| 3 | 系统调用 MOY App 的 lead/customer 创建 API（需认证） |
| 4 | GEO lead 的 `converted_to_customer_id` 记录 App 侧 ID |
| 5 | GEO lead 状态保持不变（不自动改为 won） |

### 7.3 为什么不自动同步

| 原因 | 说明 |
| --- | --- |
| 数据质量 | GEO 表单提交者很多只是咨询，不是有效业务线索 |
| 业务判断 | 是否值得跟进需要人工判断，不应自动污染 App 数据 |
| 合规 | 客户提交 GEO 表单 ≠ 同意被加入 MOY App CRM |
| 产品边界 | GEO 是增长服务，App 是经营系统，数据不应默认混用 |

### 7.4 统一账号（S5）

远期 S5 阶段，如 MOY GEO 和 MOY App 共享统一账号体系，GEO lead 可关联 `user_id` 字段。但 MVP 阶段不做。

## 8. 技术栈建议

| 层 | 推荐 | 备注 |
| --- | --- | --- |
| 运行时 | Node.js + TypeScript | 与 MOY App 后端技术栈一致 |
| 框架 | Express / Fastify（轻量） | NestJS 可选，但对 GEO MVP 偏重 |
| ORM | TypeORM / Drizzle | 保持与 MOY App 一致即可 |
| 数据库 | PostgreSQL | `moy_geo` 独立数据库或 `moy_api_hub` 内独立 schema |
| 部署 | Docker | 与 MOY App 同机部署或独立容器 |

如选择 Express，项目结构建议：

```
geo-backend/
├── src/
│   ├── index.ts
│   ├── routes/leads.ts
│   ├── services/leadService.ts
│   ├── middleware/rateLimit.ts
│   ├── middleware/honeypot.ts
│   └── config.ts
├── migrations/
│   └── 001_create_geo_leads.sql
├── package.json
└── tsconfig.json
```

## 9. 后续实现任务拆分

| ID | 任务 | 说明 | 依赖 |
| --- | --- | --- | --- |
| GEO-BE-001 | 创建接口 | `POST /api/geo/leads` Express 路由 + controller | — |
| GEO-BE-002 | 建表与 migration | `geo_leads` 表 DDL + TypeORM entity | — |
| GEO-BE-003 | 基础校验 | 必填字段校验、website 格式校验、contactMethod 长度校验 | GEO-BE-001 |
| GEO-BE-004 | 反垃圾策略 | honeypot、IP 限流、联系方式频次限制 | GEO-BE-001 |
| GEO-BE-005 | 通知 | 新线索邮件 + 企业微信 webhook | GEO-BE-001 |
| GEO-BE-006 | 转入 MOY App 的人工动作 | qualified → 创建 App lead 的桥接逻辑 | GEO-BE-002 + MOY App lead API |
| GEO-BE-007 | 管理后台 | 线索列表、状态流转、分配顾问（后期） | GEO-BE-002 |
| GEO-BE-008 | DevOps | Dockerfile、CI/CD、环境变量配置 | GEO-BE-001 |

## 10. 与前端对接

前端 [LeadForm](file:///c:/Users/15864/Desktop/TongMingTech_Moy/sites/geo/src/components/LeadForm.tsx) 已在 `submitLead()` 中预留远程 POST 路径。只需设置环境变量即可对接：

```bash
# sites/geo/.env
VITE_GEO_LEAD_ENDPOINT=https://api.moy.com/api/geo/leads
```

前端表单字段与后端接口字段**一一对应**（camelCase），无需做字段名转换。详见 [§4.4 字段映射](#44-与前端表单的字段映射)。

## 11. 版本记录

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| v0.1 | 2026-05 | 初版，GEO 线索收集后端接口、数据表、风控、通知、与 MOY App 边界设计 |
