# MOY Official — 品牌官网

- 域名：`moy.com`
- 本地端口：`5175`
- 定位：MOY 母品牌官网，产品矩阵入口

## 启动

```bash
cd sites/official
npm install
npm run dev
```

## 构建部署

```bash
npm run build     # 输出到 dist/
npm run preview   # 本地预览构建产物
```

部署时将 `dist/` 指向 `moy.com` 的静态文件服务。
