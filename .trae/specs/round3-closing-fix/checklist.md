# Checklist — 第三轮收口修复

## 任务 1：统一前端 API 响应解包
- [x] ai-runtime.ts 所有方法统一解包 { code, data } → data
- [x] cockpitStore.ts 无手写解包
- [x] approvalStore.ts 无手写解包
- [x] aiStore.ts 无手写解包
- [x] customerContextStore.ts 无手写解包
- [x] Customer360.tsx 无手写解包

## 任务 2：Cockpit 数据流闭环
- [x] 后端 GET /ai-runtime/cockpit 端点存在
- [x] AiRuntimeService.getCockpitData 方法存在
- [x] 前端 aiRuntimeApi.getCockpitData 方法存在
- [x] cockpitStore 调用 getCockpitData 并 set aiInsights/riskSignals/keyMetrics/recentAgentRuns/recommendedTodos
- [x] Cockpit.tsx recommendedTodos 区块展示真实数据

## 任务 3：AiPromptTemplate.version 双义冲突修复
- [x] AiPromptTemplate 实体字段从 version 改为 templateVersion
- [x] seed 数据使用 templateVersion
- [x] 数据库迁移存在
- [x] 前端 types 使用 templateVersion

## 任务 4：SSOT 主链回写
- [x] 05 文档补齐 COR/CMEM/ART 新增对象
- [x] 08 文档补齐 /ai-runtime/* API + 修正 / 重定向口径
- [x] 02 文档与代码一致

## 任务 5：编译验证
- [x] 后端 tsc --noEmit 通过
- [x] 前端 tsc --noEmit 通过
