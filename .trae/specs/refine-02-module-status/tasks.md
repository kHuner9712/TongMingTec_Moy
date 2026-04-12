# Tasks — 02 业务域与模块树表述修正

- [x] Task 1: 修正第3节 AUTO 模块说明
  - [x] SubTask 1.1: 将 AUTO 说明从"活动、分群、流程、自动触达"改为"活动、分群、流程、自动触达 + 触发式自动化主干（事件驱动、节点执行）"

- [x] Task 2: 重写第6节"模块与阶段关系"
  - [x] SubTask 2.1: 将第6节改为3大类分类：已实现基线模块、下一阶段主轴模块、后续阶段模块
  - [x] SubTask 2.2: 已实现基线模块行保持不变
  - [x] SubTask 2.3: 下一阶段主轴模块行逐项列出 QT/CT/ORD/PAY/SUB/CSM/KB/DASH/AUTO
  - [x] SubTask 2.4: 后续阶段模块行列出 PLAN/BILL/INV/INT/PLT/I18N/DEPLOY

- [x] Task 3: 新增第6.4节"下一阶段主轴模块详解"
  - [x] SubTask 3.1: 新增 QT 逐项说明（当前状态/下一阶段原因/直接依赖）
  - [x] SubTask 3.2: 新增 CT 逐项说明
  - [x] SubTask 3.3: 新增 ORD 逐项说明
  - [x] SubTask 3.4: 新增 PAY 逐项说明
  - [x] SubTask 3.5: 新增 SUB 逐项说明
  - [x] SubTask 3.6: 新增 CSM 逐项说明
  - [x] SubTask 3.7: 新增 KB 逐项说明
  - [x] SubTask 3.8: 新增 DASH 逐项说明
  - [x] SubTask 3.9: 新增 AUTO 逐项说明
  - [x] SubTask 3.10: 新增成交后衔接主干强调段落

- [x] Task 4: 交叉校验
  - [x] SubTask 4.1: 确认 ORD/PAY/SUB introduced_in=S2 与 01 一致 ✅
  - [x] SubTask 4.2: 确认模块依赖与第5节一致 ✅（已修正6.4依赖列与第5节对齐）
  - [x] SubTask 4.3: 确认阶段归属与 03/11 一致 ✅

# Task Dependencies

- Task 1 和 Task 2 可并行
- Task 3 依赖 Task 2（需要先确定分类结构）
- Task 4 必须最后完成

# 并行化说明

- Task 1/2 可并行
