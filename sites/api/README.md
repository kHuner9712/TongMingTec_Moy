# MOY API — 多模型 API 网关平台站

- 域名：`api.moy.com`
- 本地端口：`5177`
- 定位：多模型 API 网关营销站 + 开发者入口

## 启动

```bash
cd sites/api
npm install
npm run dev
```

## 构建部署

```bash
npm run build     # 输出到 dist/
npm run preview   # 本地预览构建产物
```

部署时将 `dist/` 指向 `api.moy.com` 的静态文件服务。
