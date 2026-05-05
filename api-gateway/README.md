# MOY API Gateway — 多模型 API 网关

## MVP 阶段范围

| 能力 | 状态 |
| --- | --- |
| API 基础路由（`/v1/chat/completions` OpenAI 兼容） | ✅ 占位实现 |
| 模型列表查询 | ✅ 占位实现 |
| API Key 校验（header authorization） | ✅ 基础校验 |
| 用量统计 | ⬜ 开发中 |
| API Key 管理 | ⬜ 开发中 |
| 调用日志 | ⬜ 开发中 |
| 额度/限流 | ⬜ 开发中 |
| 开发者文档（OpenAPI/Swagger） | ⬜ 开发中 |
| 预付费/计费 | ❌ MVP 不做 |

## 本地启动

```bash
cd api-gateway
npm install
npm run dev
```

- API 基础地址：`http://localhost:3002`
- 健康检查：`http://localhost:3002/health`
