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
├── App.tsx                        # 页面布局（导航 + 9 个 section）
├── config.ts                      # GEO_LEAD_ENDPOINT 配置
├── types.ts                       # LeadFormData / LeadSubmission 类型
├── leadStorage.ts                 # localStorage 读写 + 可选 POST
├── styles.tsx                     # 样式常量
└── components/
    ├── LeadForm.tsx               # 表单组件（校验 + 提交）
    └── DevSubmissionsPanel.tsx    # 开发调试面板（仅 dev 可见）
```

## 相关后台接口

| 接口 | 说明 |
|------|------|
| `POST /api/geo/leads` | 公开表单提交 |
| `GET /api/v1/geo-leads` | 管理端：线索列表（需 JWT） |
| `GET /api/v1/geo-leads/:id` | 管理端：线索详情（需 JWT） |
| `PATCH /api/v1/geo-leads/:id/status` | 管理端：状态流转（需 JWT） |

## 后续计划

- S3：客户登录后台、诊断报告在线查看
- S4：在线支付、服务订阅管理

## 合规与隐私

- 表单区域已有占位隐私说明："提交信息仅用于 MOY GEO 诊断沟通与服务跟进，不会公开展示。"
- **生产上线前需准备正式隐私政策页面**（`geo.moy.com/privacy`），当前为占位版本
- 页面无"保证排名"、"百分百推荐"等违规承诺
- 不将 `api.moy.com` 用作 GEO 表单提交接口
