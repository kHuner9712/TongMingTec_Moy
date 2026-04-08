# Tasks — 后端 AI 原生架构升级

## 第一组：实体补全与关系建立

- [x] Task 1: 新增 CustomerStateSnapshot 实体
  - [x] SubTask 1.1: 创建 `backend/src/modules/cor/entities/customer-state-snapshot.entity.ts` — 实体定义：customerId, snapshotType, stateData(jsonb), agentRunId(nullable), triggerEvent, createdAt
  - [x] SubTask 1.2: 修改 `backend/src/modules/cor/cor.module.ts` — 注册新实体到 TypeOrmModule.forFeature
  - [x] SubTask 1.3: 创建 `backend/src/modules/cor/services/snapshot.service.ts` — createSnapshot / getLatestSnapshot / getSnapshots 方法
  - [x] SubTask 1.4: 修改 `backend/src/modules/cor/cor.controller.ts` — 新增 GET /cor/customers/:id/snapshots 端点

- [x] Task 2: 为 ART 核心实体新增 customerId 字段
  - [x] SubTask 2.1: 修改 `backend/src/modules/art/entities/ai-agent-run.entity.ts` — 新增 customerId 字段（uuid, indexed, nullable）
  - [x] SubTask 2.2: 修改 `backend/src/modules/art/entities/ai-approval-request.entity.ts` — 新增 customerId 字段
  - [x] SubTask 2.3: 修改 `backend/src/modules/art/entities/ai-rollback.entity.ts` — 新增 customerId 字段
  - [x] SubTask 2.4: 修改 `backend/src/modules/art/entities/ai-takeover.entity.ts` — 新增 customerId 字段

- [x] Task 3: 更新 ART 服务层传递 customerId
  - [x] SubTask 3.1: 修改 `backend/src/modules/art/services/execution-engine.service.ts` — execute 方法新增 customerId 参数，创建 run 时写入
  - [x] SubTask 3.2: 修改 `backend/src/modules/art/services/approval-engine.service.ts` — createApprovalRequest 新增 customerId 参数
  - [x] SubTask 3.3: 修改 `backend/src/modules/art/services/rollback-engine.service.ts` — rollback 方法从 run 中获取 customerId 并写入
  - [x] SubTask 3.4: 修改 `backend/src/modules/art/services/takeover-engine.service.ts` — takeover 方法从 run 中获取 customerId 并写入
  - [x] SubTask 3.5: 修改 `backend/src/modules/art/dto/execute-agent.dto.ts` — 新增 customerId 字段
  - [x] SubTask 3.6: 修改 `backend/src/modules/art/art.controller.ts` — executeAgent 传递 customerId

- [x] SubTask 3.7: 修改 `backend/src/modules/approval-center/services/approval-center.service.ts` — listPending/listAll 返回结果包含 customerId（无需修改，查询返回完整实体）
- [x] SubTask 3.8: 修改 `backend/src/modules/takeover-center/services/takeover-center.service.ts` — getActiveTakeovers 返回结果包含 customerId（无需修改，查询返回完整实体）
- [x] SubTask 3.9: 修改 `backend/src/modules/rollback-center/services/rollback-center.service.ts` — getRollbackRecords 返回结果包含 customerId（无需修改，查询返回完整实体）

## 第二组：AI Runtime 统一门面模块

- [x] Task 4: 创建 ai-runtime 门面模块
  - [x] SubTask 4.1: 创建 `backend/src/modules/ai-runtime/ai-runtime.module.ts` — 导入 CorModule/CmemModule/ArtModule/ApprovalCenterModule/TakeoverCenterModule/RollbackCenterModule
  - [x] SubTask 4.2: 创建 `backend/src/modules/ai-runtime/ai-runtime.controller.ts` — 统一 API 端点（12 个端点）
  - [x] SubTask 4.3: 创建 `backend/src/modules/ai-runtime/ai-runtime.service.ts` — 聚合服务，编排 COR/CMEM/ART 的调用
  - [x] SubTask 4.4: 创建 `backend/src/modules/ai-runtime/dto/` — ExecuteAgentRuntimeDto / CustomerRuntimeQueryDto / TakeoverRuntimeDto / RollbackRuntimeDto

- [x] Task 5: 注册 ai-runtime 到 AppModule
  - [x] SubTask 5.1: 修改 `backend/src/app.module.ts` — 导入 AiRuntimeModule

## 第三组：全局异常过滤与工程修复

- [x] Task 6: 新增 StateMachineError 全局异常过滤器
  - [x] SubTask 6.1: 创建 `backend/src/common/filters/state-machine-error.filter.ts` — 将 StateMachineError 映射为 HTTP 400
  - [x] SubTask 6.2: 修改 `backend/src/main.ts` — 注册全局过滤器 + 确认 CORS 配置 + 补充注释

- [x] Task 7: 数据库迁移
  - [x] SubTask 7.1: 创建 `backend/src/migrations/1712620800000-AiRuntimeCustomerRelations.ts` — 新增 customer_state_snapshots 表 + 4 个表新增 customer_id 列

- [x] Task 8: 编译验证
  - [x] SubTask 8.1: 后端 `tsc --noEmit` 通过（src/ 目录零错误）

# Task Dependencies

- Task 1-2 (实体补全) 可并行
- Task 3 (服务层更新) 依赖 Task 2
- Task 4 (ai-runtime 门面) 依赖 Task 1 + 3
- Task 5 (AppModule 注册) 依赖 Task 4
- Task 6 (异常过滤) 可独立并行
- Task 7 (迁移) 依赖 Task 1 + 2
- Task 8 (编译验证) 依赖所有前置 Task
