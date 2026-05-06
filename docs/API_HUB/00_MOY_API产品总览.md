# MOY API 产品总览

## 1. 文档定位

本文档是 MOY API 产品设计与技术实现的唯一总入口，统一定义：

- MOY API 的产品定位与核心价值
- 产品边界与不是什么
- 技术架构概览
- 文档导航

适用对象：产品团队、后端开发团队、前端开发团队、DevOps。

## 2. MOY API 是什么

**MOY API 是 MOY 旗下的多模型 API 网关与开发者平台。**

为开发者提供统一的、OpenAI 兼容的接口，调用背后多个大语言模型供应商的能力，同时提供调用治理、用量管控、成本归集和安全合规能力。

### 三层定位

| 层次 | 定位 | 说明 |
| --- | --- | --- |
| 接入层 | API 中转站 | 一套 OpenAI 兼容接口，背后接入多个模型供应商 |
| 治理层 | 模型调用治理平台 | API Key 管理、用量额度、限流、调用日志、成本归集 |
| 生态层 | 开发者平台 | 开发文档、SDK、状态页、社区（远期） |

### 核心价值

| 价值点 | 说明 |
| --- | --- |
| 统一接口 | 开发者只需对接一套 OpenAI 兼容 API，无需适配多个供应商 |
| 模型可选 | 在统一接口下自由选择不同供应商、不同能力的模型 |
| 用量管控 | API Key 粒度配额、限流，防止滥用和成本失控 |
| 成本透明 | 每次调用可追踪 token 消耗和成本，按项目/用户归集 |
| 安全合规 | Key 不明文存储、内容安全检测、使用边界约束 |

## 3. MOY API 不是什么

| 不是 | 说明 |
| --- | --- |
| 不是低价 API 倒卖站 | 不做"比官网还便宜"的价格战，核心价值在治理层而非差价 |
| 不是裸模型代理 | 不是简单把请求原封不动转发给供应商 |
| 不是面向 C 端的 AI 对话产品 | 不提供 chatbot 界面，面向开发者 |
| 不是模型训练/微调平台 | MVP 不做 fine-tuning，远期视需求评估 |
| 不是内容生成工具 | 不封装文案、图片、视频等上层应用 |

## 4. 产品架构

```
                          ┌─────────────────────────┐
                          │     MOY API 开发者门户    │
                          │  (api.moy.com)           │
                          │  登录 · Key管理 · 文档    │
                          └──────────┬──────────────┘
                                     │
                          ┌──────────▼──────────────┐
                          │     API Gateway 层        │
                          │  认证 · 限流 · 路由 · 日志 │
                          └──────────┬──────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
   ┌──────────▼──────────┐ ┌────────▼────────┐ ┌──────────▼──────────┐
   │  OpenAI 兼容接口层   │ │  用量与计费服务  │ │  安全合规中间层      │
   │  /v1/chat/complet.. │ │  quota/ledger   │ │  内容安全 · 审计     │
   └──────────┬──────────┘ └────────┬────────┘ └──────────┬──────────┘
              │                      │                      │
              └──────────────────────┼──────────────────────┘
                                     │
                          ┌──────────▼──────────────┐
                          │     模型适配层            │
                          │  OpenAI · Azure · 智谱   │
                          │  月之暗面 · 百川 · 等     │
                          └─────────────────────────┘
```

## 5. 核心概念

| 概念 | 说明 |
| --- | --- |
| Project | 开发者创建的项目，一个用户可有多个 project |
| API Key | 属于某个 project，用于鉴权调用 API |
| Model | 可调用的模型标识，如 `gpt-4o`、`moonshot-v1-8k` |
| Provider | 模型供应商，如 `openai`、`azure`、`zhipu` |
| Quota Account | 项目或用户的额度账户，记录可用额度 |
| Quota Ledger | 额度变动明细，每次调用扣减记录 |
| Usage Log | 每次 API 调用的完整记录 |
| Rate Limit | 按 Key / Project / IP 的调用频率限制 |

## 6. 与 MOY 其他产品的关系

| 产品 | 关系 | 说明 |
| --- | --- | --- |
| MOY App | 远期统一账号 | S5 阶段共享统一认证，App 内 AI 能力可走 MOY API 网关 |
| MOY GEO | 独立 | 各自独立运营，短期无交叉 |
| MOY Official | 品牌入口 | Official 站点可引导开发者到 api.moy.com |

## 7. 文档导航

| 文档 | 用途 | 使用者 |
| --- | --- | --- |
| [01_MOY_API_MVP范围](./01_MOY_API_MVP范围.md) | 定义 MVP 阶段的精确边界 | 产品 / 开发 |
| [02_API_Key与用量模型](./02_API_Key与用量模型.md) | 数据模型设计：Key、额度、用量 | 后端开发 |
| [03_OpenAI兼容接口设计](./03_OpenAI兼容接口设计.md) | Chat Completions 接口规格 | 后端 / 前端 |
| [04_调用日志与成本统计](./04_调用日志与成本统计.md) | 日志结构、成本计算、统计方案 | 后端 / DevOps |
| [05_安全合规与使用边界](./05_安全合规与使用边界.md) | 安全基线、合规红线、使用约束 | 全员 |
| [06_后续路线图](./06_后续路线图.md) | S1-S5 阶段演进规划 | 产品 / 开发 |
| [07_MOY_API_MVP后端开发计划](./07_MOY_API_MVP后端开发计划.md) | MVP 后端开发计划与任务拆解 | 后端开发 |
| [08_API_Hub_Foundation实现说明](./08_API_Hub_Foundation实现说明.md) | Foundation 后端实现说明 | 开发 / DevOps |
| [09_OpenAI兼容入口MVP](./09_OpenAI兼容入口MVP.md) | OpenAI-Compatible Entry MVP 实现说明 | 开发 / DevOps |
| [10_Developer_Console_MVP](./10_Developer_Console_MVP.md) | Developer Console MVP 实现说明 | 开发 / DevOps |
| [11_Provider_Proxy设计](./11_Provider_Proxy设计.md) | Provider Proxy 架构设计（下一阶段） | 开发 / DevOps |

## 8. 技术栈（推荐）

| 层 | 技术选型 | 备注 |
| --- | --- | --- |
| API 服务 | NestJS (TypeScript) | 与 MOY App 后端同技术栈 |
| 数据库 | PostgreSQL | 与 MOY App 共用实例或独立 |
| 缓存 | Redis | 限流计数、短期缓存 |
| 网关 | Nginx / Kong | 生产环境 |
| 前端 | React + Vite | 已有 sites/api 骨架 |
| 日志 | Winston / Pino | 结构化日志 |
| 监控 | Prometheus + Grafana | 远期接入 |

## 9. 版本记录

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| v0.7 | 2026-05-07 | Provider Proxy 设计文档：14 个设计维度 + 11 个开发任务，推荐 DeepSeek/OpenAI |
| v0.6 | 2026-05-07 | 文案与示例一致性收口：官网/README/文档统一使用 moy-mock-chat、localhost:3001/v1、api.app.moy.com/v1 |
| v0.5 | 2026-05-07 | Developer Console MVP：sites/api/console 调试控制台，6 大功能区块，后端 quota 错误码收口 (403→402) |
| v0.4 | 2026-05-07 | OpenAI-Compatible Entry MVP 完成：mock /v1/models + /v1/chat/completions，ApiKeyGuard Bearer 鉴权，quota 扣减，usage 记录 |
| v0.3 | 2026-05-06 | Foundation 安全与文档一致性收口：统一 Key 格式 moy_sk_ + 32 hex，拆分安全响应 DTO，修复 keyHash 泄露，更新全系文档 |
| v0.2 | 2026-05-06 | MVP 后端基础搭建完成，新增 08 实施报告 |
| v0.1 | 2026-05 | 初版，MOY API 产品总览与 MVP 设计文档体系建立 |
