# MOY API

多模型 API 网关与开发者平台，对应域名：**api.moy.com**。

## 站点定位

MOY API 为开发者提供 OpenAI 兼容的统一接口，调用多个大语言模型供应商的能力，并提供 API Key 管理、用量统计、调用日志、限流和成本控制。本网站是 API 产品对外展示和开发者入口。

## 本地启动

```bash
npm install
npm run dev        # http://localhost:5177
```

## 构建

```bash
npm run build      # tsc --noEmit && vite build → dist/
```

## 当前状态

**静态 MVP**。产品介绍页 + cURL 示例占位。所有内容为前端展示文本，无后端对接。

## 后续计划

- S2：开发者注册/登录、API Key 自助创建
- S3：在线控制台（用量面板、日志查询）
- S4：在线支付、企业套餐管理
