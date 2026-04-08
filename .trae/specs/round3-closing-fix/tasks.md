# Tasks — 第三轮收口修复

## 任务 1：统一前端 API 响应解包

- [x] Task 1.1: 修改 `frontend/src/services/ai-runtime.ts` — 所有方法统一解包 `{ code, data }` → 返回 data
- [x] Task 1.2: 修改 `frontend/src/stores/cockpitStore.ts` — 移除手写解包，使用 service 返回的直接数据
- [x] Task 1.3: 修改 `frontend/src/stores/approvalStore.ts` — 移除手写解包
- [x] Task 1.4: 修改 `frontend/src/stores/aiStore.ts` — 移除手写解包
- [x] Task 1.5: 修改 `frontend/src/stores/customerContextStore.ts` — 移除手写解包
- [x] Task 1.6: 修改 `frontend/src/pages/Customer360.tsx` — 移除手写解包

## 任务 2：Cockpit 数据流闭环

- [x] Task 2.1: 新增后端 cockpit 聚合接口 — GET /ai-runtime/cockpit
- [x] Task 2.2: 修改 `backend/src/modules/ai-runtime/ai-runtime.controller.ts` — 新增 cockpit 端点
- [x] Task 2.3: 修改 `backend/src/modules/ai-runtime/ai-runtime.service.ts` — 新增 getCockpitData 方法
- [x] Task 2.4: 修改 `frontend/src/services/ai-runtime.ts` — 新增 getCockpitData 方法
- [x] Task 2.5: 修改 `frontend/src/stores/cockpitStore.ts` — 调用 getCockpitData，真正 set 进 aiInsights/riskSignals/keyMetrics/recentAgentRuns/recommendedTodos
- [x] Task 2.6: 修改 `frontend/src/pages/Cockpit.tsx` — 接通 recommendedTodos 区块

## 任务 3：修复 AiPromptTemplate.version 双义冲突

- [x] Task 3.1: 修改 `backend/src/modules/art/entities/ai-prompt-template.entity.ts` — version → templateVersion
- [x] Task 3.2: 修改 `backend/src/modules/art/seeds/prompt-template.seed.ts` — version → templateVersion
- [x] Task 3.3: 新增数据库迁移 — ai_prompt_templates.version → template_version
- [x] Task 3.4: 修改 `frontend/src/types/index.ts` — AiPromptTemplate.version → templateVersion

## 任务 4：SSOT 主链回写

- [x] Task 4.1: 更新 `docs/SSOT/05_对象模型与数据库设计.md` — 补齐 COR/CMEM/ART 新增对象
- [x] Task 4.2: 更新 `docs/SSOT/08_API契约与Schema字典.md` — 补齐 /ai-runtime/* API + 修正 / 重定向口径
- [x] Task 4.3: 校验 `docs/SSOT/02_业务域与模块树.md` — 确认与代码一致

## 任务 5：编译验证

- [x] Task 5.1: 前后端 tsc --noEmit 通过

# Task Dependencies
- Task 1 (API 解包) 无前置依赖
- Task 2 (Cockpit) 依赖 Task 1（store 需要使用解包后的 service）
- Task 3 (version 冲突) 无前置依赖，可与 Task 1/2 并行
- Task 4 (SSOT) 依赖 Task 2/3（文档需反映代码最终状态）
- Task 5 (编译) 依赖所有前置
