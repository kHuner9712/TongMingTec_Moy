# Checklist — 第三轮收口验收自检

## 任务 1：响应结构一致性
- [x] 全仓库无 `(result as any)?.items || result || []` 残留
- [x] 全仓库无页面层自行解包 ai-runtime 响应
- [x] 所有 ai-runtime 调用点统一使用 unwrap<T>()

## 任务 2：Cockpit 真数据闭环
- [x] aiInsights 区块从后端聚合接口获取真实数据
- [x] riskSignals 区块从后端聚合接口获取真实数据
- [x] keyMetrics 区块从后端聚合接口获取真实数据
- [x] recentAgentRuns 区块从后端聚合接口获取真实数据
- [x] recommendedTodos 区块从后端聚合接口获取真实数据
- [x] 无区块是空壳/永远空数组

## 任务 3：建模冲突彻底分离
- [x] BaseEntity.version 保持乐观锁语义
- [x] AiPromptTemplate 使用 templateVersion 表示业务版本
- [x] migration 正确重命名 version → template_version
- [x] 前端 types 使用 templateVersion
- [x] 全链路无 `version` 双义残留

## 任务 4：SSOT 一致性
- [x] 02 文档 COR/CMEM/ART/APC/TKC/RBC 与代码一致
- [x] 05 文档 CustomerStateSnapshot 等新对象已写入
- [x] 08 文档 /ai-runtime/* API 已写入
- [x] 08 文档 /cockpit 已替换 /dashboard 主入口口径

## 任务 5：编译与运行时风险
- [x] 后端 tsc --noEmit（src/）零错误
- [x] 前端 tsc --noEmit 零错误
- [x] 运行时风险清单已汇总
