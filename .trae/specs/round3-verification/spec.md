# 第三轮收口验收自检 Spec

## Why
第三轮收口修复已标记全部完成，但需要严格自检确认是否真正闭环，而非表面完成。需逐文件、逐接口、逐字段核验 5 类问题。

## What Changes
- 不新增功能，只做验证和修复
- 逐个检查 ai-runtime 前端调用点是否仍有坏味道
- 检查 Cockpit 5 个区块数据流是否真闭环
- 检查 BaseEntity.version / AiPromptTemplate.templateVersion 是否彻底分离
- 检查 SSOT 3 个文档是否与代码同步
- 执行前后端编译检查

## Impact
- Affected code: 所有第三轮修改涉及的文件
- Affected docs: 02/05/08 SSOT 文档

## ADDED Requirements

### Requirement: 响应结构一致性验证
系统 SHALL 不存在任何 `(result as any)?.items || result || []` 手写解包模式，所有 ai-runtime 调用点 SHALL 通过 service 层 `unwrap<T>()` 统一解包。

#### Scenario: 全仓库扫描无残留坏味道
- **WHEN** 扫描所有 frontend/src 下文件
- **THEN** 不存在 `(result as any)?.items`、`|| result || []`、直接把 `{ code, data }` 当业务对象的模式

### Requirement: Cockpit 真数据闭环验证
Cockpit 页面 5 个区块 SHALL 全部从后端聚合接口获取真实数据。

#### Scenario: 5 个区块均有数据源
- **WHEN** 访问 /cockpit 页面
- **THEN** aiInsights / riskSignals / keyMetrics / recentAgentRuns / recommendedTodos 均来自 GET /ai-runtime/cockpit 返回的真实聚合数据

### Requirement: 建模冲突彻底分离验证
BaseEntity.version（乐观锁）与 AiPromptTemplate.templateVersion（模板业务版本）SHALL 在全链路（entity/migration/dto/service/前端types）彻底分离。

#### Scenario: 无双义字段
- **WHEN** 检查所有相关文件
- **THEN** 不存在 AiPromptTemplate 使用 `version` 字段表示业务版本的情况

### Requirement: SSOT 一致性验证
02/05/08 文档 SHALL 与代码真实状态一致。

#### Scenario: 文档与代码对齐
- **WHEN** 对比文档描述与代码实现
- **THEN** COR/CMEM/ART 模块、CustomerStateSnapshot 等新对象、/ai-runtime/* API、/cockpit 主入口口径均一致

### Requirement: 编译零错误验证
前后端 TypeScript 编译 SHALL 零错误（排除 test/ 目录预存问题）。

#### Scenario: tsc --noEmit 通过
- **WHEN** 执行 tsc --noEmit
- **THEN** 后端 src/ 和前端均零错误
