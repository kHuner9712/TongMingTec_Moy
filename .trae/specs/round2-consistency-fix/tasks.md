# Tasks — 第二轮 SSOT 小范围一致性修正

- [x] Task 1: 修正 10_AI_Agent 第3.1节 Agent Registry 默认模式
  - [x] SubTask 1.1: 将 AGENT-AI-008 Quality Agent 默认模式从 `auto` 改为 `assist`，在说明列标注"S3 升级为 auto"

- [x] Task 2: 修正 10_AI_Agent 第3.3节 Agent 可操作模块
  - [x] SubTask 2.1: 在 3.3 节开头新增说明段落，明确所列模式为全阶段能力范围，实际允许模式以第13节治理表为准

- [x] Task 3: 修正 10_AI_Agent 第4节阶段约束
  - [x] SubTask 3.1: 在阶段约束表后补充明确说明：S2 严禁 auto 模式；涉及资金/服务开通的动作在 S2 必须走 approval；auto 从 S3 开放且仅限低风险动作

- [x] Task 4: 修正 10_AI_Agent 第7.3节触发式自动化示例
  - [x] SubTask 4.1: 将 `payment.succeeded → 自动激活订单（auto 模式）` 改为 `payment.succeeded → 自动激活订单（approval 模式）`
  - [x] SubTask 4.2: 将 `order.activated → 自动开通订阅（auto 模式）` 改为 `order.activated → 自动开通订阅（approval 模式）`
  - [x] SubTask 4.3: 在"与成交链路的衔接"后新增"S2/S3 阶段差异说明"段落，明确 S2 禁止 auto、S3 升级条件

- [x] Task 5: 修正 10_AI_Agent 第13.2节阶段约束说明
  - [x] SubTask 5.1: 在 S2 说明中补充"严禁 auto 模式"的明确表述
  - [x] SubTask 5.2: 在 S3 说明中补充 auto 开放条件（审计完整、补偿可用、回滚 production_ready、异常恢复自动触发）

- [x] Task 6: 修正 02_业务域与模块树 第3节模块编码总表
  - [x] SubTask 6.1: 将"当前成熟度"列拆分为"当前成熟度"和"阶段目标成熟度"两列
  - [x] SubTask 6.2: 36 个模块逐一填值，消除所有箭头混合写法

- [x] Task 7: 修正 02_业务域与模块树 第6.1/6.2节成熟度说明
  - [x] SubTask 7.1: 第6.1节成熟度说明段落消除箭头写法，改为分别引用当前成熟度和阶段目标成熟度
  - [x] SubTask 7.2: 第6.2节成熟度说明段落消除箭头写法，改为分别引用当前成熟度和阶段目标成熟度

- [x] Task 8: 交叉校验
  - [x] SubTask 8.1: 确认 10_AI_Agent 全文不再存在 S2 语境下的 auto 模式示例
  - [x] SubTask 8.2: 确认 02_业务域与模块树 全文不再存在箭头混合写法
  - [x] SubTask 8.3: 确认两文档修改后与 01_产品范围与阶段地图 不产生新冲突

# Task Dependencies

- Task 1~5 可并行（均为 10_AI_Agent 不同小节修改）
- Task 6 和 Task 7 有依赖：Task 6 先改表结构，Task 7 再改说明段落
- Task 8 必须最后完成

# 并行化说明

- Task 1/2/3/4/5 可并行
- Task 6 完成后才能做 Task 7
- Task 8 在所有其他 Task 完成后执行
