# Checklist — 后端 AI 原生架构升级验收

## 实体补全与关系建立

- [x] CustomerStateSnapshot 实体：`backend/src/modules/cor/entities/customer-state-snapshot.entity.ts` 存在且包含 customerId / snapshotType / stateData / agentRunId / triggerEvent
- [x] COR 模块注册：cor.module.ts 包含 CustomerStateSnapshot
- [x] SnapshotService：提供 createSnapshot / getLatestSnapshot / getSnapshots 方法
- [x] COR Controller：GET /cor/customers/:id/snapshots 端点存在
- [x] AiAgentRun 新增 customerId：字段存在且为 uuid + indexed + nullable
- [x] AiApprovalRequest 新增 customerId：字段存在且为 uuid + indexed + nullable
- [x] AiRollback 新增 customerId：字段存在且为 uuid + indexed + nullable
- [x] AiTakeover 新增 customerId：字段存在且为 uuid + indexed + nullable
- [x] ExecuteAgentDto 新增 customerId：字段存在
- [x] ExecutionEngineService：execute 方法接受并传递 customerId
- [x] ApprovalEngineService：createApprovalRequest 接受并传递 customerId
- [x] ApprovalCenterService：返回结果包含 customerId（查询返回完整实体，自动包含）
- [x] TakeoverCenterService：返回结果包含 customerId（查询返回完整实体，自动包含）
- [x] RollbackCenterService：返回结果包含 customerId（查询返回完整实体，自动包含）

## AI Runtime 统一门面模块

- [x] ai-runtime 模块目录：`backend/src/modules/ai-runtime/` 存在
- [x] AiRuntimeModule：导入 CorModule/CmemModule/ArtModule/ApprovalCenterModule/TakeoverCenterModule/RollbackCenterModule
- [x] AiRuntimeController：提供 /ai-runtime/* 统一 API 端点（12 个端点）
- [x] AiRuntimeService：聚合编排 COR/CMEM/ART 调用
- [x] DTO：ExecuteAgentRuntimeDto / CustomerRuntimeQueryDto / TakeoverRuntimeDto / RollbackRuntimeDto 存在
- [x] AppModule 注册：AiRuntimeModule 已导入

## 全局异常过滤与工程修复

- [x] StateMachineError 过滤器：`backend/src/common/filters/state-machine-error.filter.ts` 存在
- [x] main.ts 注册：全局过滤器已注册
- [x] main.ts CORS：配置正确
- [x] 数据库迁移：新增 customer_state_snapshots 表 + 4 个表新增 customer_id 列

## 编译验证

- [x] 后端编译通过：tsc --noEmit 零错误（src/ 目录）
