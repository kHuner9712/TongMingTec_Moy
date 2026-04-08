# Tasks — 第三轮收口验收自检

## 任务 1：响应结构一致性验证

- [x] Task 1.1: 全仓库搜索 `(result as any)` 模式，确认无残留
- [x] Task 1.2: 全仓库搜索 `|| result || []` 模式，确认无残留
- [x] Task 1.3: 逐个检查所有 ai-runtime 前端调用点（stores + pages），确认统一使用 unwrap<T>()
- [x] Task 1.4: 检查是否存在页面层自行解包而非 service 层统一解包的情况

## 任务 2：Cockpit 真数据闭环验证

- [x] Task 2.1: 检查 Cockpit.tsx 中 aiInsights 区块数据来源
- [x] Task 2.2: 检查 Cockpit.tsx 中 riskSignals 区块数据来源
- [x] Task 2.3: 检查 Cockpit.tsx 中 keyMetrics 区块数据来源
- [x] Task 2.4: 检查 Cockpit.tsx 中 recentAgentRuns 区块数据来源
- [x] Task 2.5: 检查 Cockpit.tsx 中 recommendedTodos 区块数据来源
- [x] Task 2.6: 检查后端 getCockpitData 聚合逻辑是否返回真实数据

## 任务 3：建模冲突彻底分离验证

- [x] Task 3.1: 检查 BaseEntity.version 字段定义
- [x] Task 3.2: 检查 AiPromptTemplate 实体是否使用 templateVersion
- [x] Task 3.3: 检查 migration 是否正确重命名
- [x] Task 3.4: 检查前端 types 是否使用 templateVersion
- [x] Task 3.5: 全仓库搜索 AiPromptTemplate 相关的 `version` 字段残留

## 任务 4：SSOT 一致性验证

- [x] Task 4.1: 对比 02 文档与 backend/src/modules 实际目录结构
- [x] Task 4.2: 对比 05 文档中 COR/CMEM/ART 表定义与实际 entity 代码
- [x] Task 4.3: 对比 08 文档中 /ai-runtime/* API 与实际 controller 代码
- [x] Task 4.4: 检查 08 文档中 /cockpit 主入口口径是否已替换 /dashboard

## 任务 5：编译与运行时风险验证

- [x] Task 5.1: 后端 tsc --noEmit（排除 test/）
- [x] Task 5.2: 前端 tsc --noEmit
- [x] Task 5.3: 汇总运行时风险清单

# Task Dependencies
- Task 1-4 可并行执行
- Task 5 独立执行
