# MOY GEO 上线检查清单

## 1. 域名

- [ ] `moy.com` 指向 `sites/official`，可正常访问
- [ ] `geo.moy.com` 指向 `sites/geo`，可正常访问
- [ ] `api.app.moy.com` 指向 `backend`，可正常访问
- [ ] SSL 证书已配置（HTTPS 正常，无证书警告）
- [ ] `www.moy.com` 重定向到 `moy.com`（避免搜索引擎重复收录）
- [ ] `api.app.moy.com` 解析生效（DNS 传播已确认）

## 2. 环境变量

- [ ] backend 环境变量已配置（生产 `.env` 不提交到仓库）
- [ ] `sites/geo` 环境变量已配置 `VITE_GEO_LEAD_ENDPOINT`
- [ ] `GEO_LEAD_NOTIFY_WEBHOOK_TYPE` 已确认（`none` / `feishu` / `wecom`）
- [ ] `GEO_LEAD_NOTIFY_WEBHOOK_URL` 不提交到仓库（服务器环境变量或部署平台面板设置）
- [ ] `JWT_SECRET` 已替换默认值，不是 `change_me_in_production`
- [ ] `DB_PASSWORD` 不是默认值
- [ ] `CORS_ORIGINS` 包含 `https://geo.moy.com` 和 `https://app.moy.com`
- [ ] `DB_SYNCHRONIZE=false`（生产环境必须关闭）
- [ ] 所有站点 `.env.example` 已更新到仓库作为文档模板

## 3. 数据库

- [ ] PostgreSQL 数据库可正常连接
- [ ] `npm run migration:run` 执行成功（backend 目录下）
- [ ] `geo_leads` 表存在，字段与 entity 一致
- [ ] 索引存在且有效：
  - `idx_geo_leads_status`
  - `idx_geo_leads_created_at`
  - `idx_geo_leads_contact_method`
  - `idx_geo_leads_website`

## 4. 后端

- [ ] backend build 成功（`nest build`）
- [ ] backend 启动成功，无启动错误日志
- [ ] `POST /api/geo/leads` 返回 201 或正常响应（非 404）
- [ ] `POST /api/geo/leads` 路径不是 `/api/v1/api/geo/leads`（全局前缀排除生效）
- [ ] `GET /api/v1/geo-leads` 未登录不可访问（返回 401 或 403）
- [ ] `GET /api/v1/geo-leads/:id` 未登录不可访问（返回 401 或 403）
- [ ] `PATCH /api/v1/geo-leads/:id/status` 未登录不可访问（返回 401 或 403）
- [ ] CORS 允许 `https://geo.moy.com`（OPTIONS 预检通过）
- [ ] Swagger 文档可访问（`api.app.moy.com/api/v1/docs`）
- [ ] 健康检查接口可访问

## 5. 前端（sites/geo）

- [ ] `npm run build` 成功（Vite build）
- [ ] 表单 endpoint 指向生产后端（`VITE_GEO_LEAD_ENDPOINT=https://api.app.moy.com/api/geo/leads`）
- [ ] 表单必填校验有效（提交空字段触发错误提示）
- [ ] 网站 URL 校验有效（`localhost` / `127.0.0.1` 被拦截）
- [ ] 表单提交成功后，后端 `geo_leads` 表有对应记录
- [ ] 表单提交成功后，前端显示成功提示
- [ ] DevSubmissionsPanel 不出现（`import.meta.env.DEV` 在构建后为 false）

## 6. 通知

- [ ] 飞书/企业微信 Webhook 已测试（提交测试线索后收到通知）
- [ ] Webhook 通知内容包含完整字段（公司名、品牌、官网、行业、联系人等）
- [ ] Honeypot 触发时不发送通知（机器人表单不产生告警）
- [ ] Webhook 通知失败不影响 lead 创建成功（断网测试 200 OK）

## 7. Smoke Test

- [ ] 本地 smoke test 通过：`npm run test:smoke:geo-leads`
- [ ] 生产 smoke test 通过：`GEO_SMOKE_BASE_URL=https://api.app.moy.com npm run test:smoke:geo-leads`
- [ ] 或手动 cURL 验证通过：

```bash
# 正常提交
curl -X POST https://api.app.moy.com/api/geo/leads \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Test","brandName":"Test","website":"https://example.com","industry":"Test","contactName":"Test","contactMethod":"test_checklist_001"}'

# 期望返回 201，id 不为 geo_lead_ignored

# Honeypot 测试
curl -X POST https://api.app.moy.com/api/geo/leads \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Bot","brandName":"Bot","website":"https://bot.test","industry":"Test","contactName":"Bot","contactMethod":"bot_checklist","_hint":"bot"}'

# 期望返回 201，id 为 geo_lead_ignored

# 管理接口认证测试
curl https://api.app.moy.com/api/v1/geo-leads

# 期望返回 401 或 403
```

## 8. 合规

- [ ] 页面中没有"保证排名"等绝对化承诺
- [ ] 页面中没有"百分百推荐"等虚假宣传
- [ ] 页面中没有虚假客户案例或未授权的引用
- [ ] 表单区域有最小隐私说明（信息仅用于诊断沟通，不公开展示）
- [ ] 已确认后续需要准备正式隐私政策页面
- [ ] 页面中没有将 `api.moy.com` 用作 GEO 表单提交接口的描述

## 9. 回滚

- [ ] 静态站（`sites/geo`）可回滚到上一部署版本
- [ ] 后端（`backend`）可回滚到上一镜像/commit
- [ ] Migration down 可用：`npm run migration:revert`
- [ ] Webhook 可通过设置 `GEO_LEAD_NOTIFY_WEBHOOK_TYPE=none` 关闭
- [ ] 前端表单可通过清空 `VITE_GEO_LEAD_ENDPOINT` 降级到 localStorage

## 10. 监控（最低要求）

- [ ] 后端进程存活确认（PM2 list 或平台面板显示 running）
- [ ] 生产错误日志可查看
- [ ] 如已配置：Uptime 监控报警生效

---

## 版本记录

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| v0.1 | 2026-05 | 初版，GEO 上线检查清单（9 大类，约 40 项） |
