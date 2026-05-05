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

**可交付线索收集 MVP**。表单已升级为可真实收集客户诊断信息的交互组件：

- 9 个字段（公司名称、品牌名称、官网、行业、目标城市、主要竞品、联系人、手机/微信、备注）
- 前端校验（必填字段、URL 格式）
- **默认存储：localStorage**（`moy_geo_submissions` key）
- **开发环境**：右下角有「Debug: 提交记录」按钮，可查看所有 localStorage 中的提交

## 表单存储方案

### 默认：localStorage

表单提交后写入 `localStorage` key `moy_geo_submissions`，包含全部字段 + `submittedAt` 时间戳。

### 接入真实接口

在项目根目录创建 `.env` 文件或设置环境变量：

```bash
VITE_GEO_LEAD_ENDPOINT=https://your-api.com/api/geo/leads
```

设置后，表单提交将自动 POST 到该 endpoint（JSON body 格式与 LeadSubmission 一致），不再写入 localStorage。

也可修改 `src/config.ts` 直接硬编码 endpoint。

### 数据结构

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

## 后续计划

- S2：接入真实诊断表单 → 后台 CRM / 独立 GEO backend
- S3：客户登录后台、诊断报告在线查看
- S4：在线支付、服务订阅管理
