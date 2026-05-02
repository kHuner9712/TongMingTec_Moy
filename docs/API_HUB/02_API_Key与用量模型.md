# MOY API Key 与用量模型

## 1. 文档用途

本文档定义 MOY API 的核心数据模型，包括 API Key 管理、额度账户、用量明细。供后端建表、ORM 映射、接口设计参考。

## 2. 实体关系概览

```
┌──────────┐       ┌──────────────┐       ┌──────────────┐
│   User   │──1:N──│   Project    │──1:N──│   ApiKey     │
└──────────┘       └──────────────┘       └──────────────┘
                                                 │
                          ┌──────────────────────┼──────────────────────┐
                          │                      │                      │
                   ┌──────▼──────┐       ┌──────▼──────┐       ┌──────▼──────┐
                   │ UsageLog    │       │ QuotaAccount│       │ RateLimit   │
                   │ (调用日志)   │       │ (额度账户)   │       │ (限流计数)   │
                   └─────────────┘       └──────┬──────┘       └─────────────┘
                                                │
                                         ┌──────▼──────┐
                                         │ QuotaLedger │
                                         │ (额度明细)   │
                                         └─────────────┘
```

## 3. User 表

```sql
CREATE TABLE api_user (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    nickname        VARCHAR(100),
    avatar_url      VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'active',   -- active | disabled
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_api_user_email ON api_user(email);
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | UUID | 是 | 主键 |
| email | VARCHAR(255) | 是 | 登录邮箱，唯一 |
| password_hash | VARCHAR(255) | 是 | bcrypt 哈希 |
| nickname | VARCHAR(100) | 否 | 显示名称 |
| avatar_url | VARCHAR(500) | 否 | 头像 URL |
| status | VARCHAR(20) | 是 | active / disabled |
| created_at | TIMESTAMPTZ | 是 | |
| updated_at | TIMESTAMPTZ | 是 | |

## 4. Project 表

```sql
CREATE TABLE api_project (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES api_user(id),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',   -- active | archived
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_project_user ON api_project(user_id);
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | UUID | 是 | 主键 |
| user_id | UUID | 是 | 所属用户 |
| name | VARCHAR(200) | 是 | 项目名称 |
| description | TEXT | 否 | 项目描述 |
| status | VARCHAR(20) | 是 | active / archived |
| created_at | TIMESTAMPTZ | 是 | |
| updated_at | TIMESTAMPTZ | 是 | |

**说明**：MVP 阶段 project_id 等价于 user_id 的 namespace（一个用户可以有多个 project 以区分不同应用的 Key）。远期 S5 阶段 project 会关联 org_id 支持多租户。

## 5. ApiKey 表

```sql
CREATE TABLE api_key (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES api_project(id),
    key_hash        VARCHAR(255) NOT NULL,
    key_prefix      VARCHAR(20) NOT NULL,                     -- sk-moy-xxxxxxxx 的前缀部分
    name            VARCHAR(200),                             -- 备注名称
    enabled         BOOLEAN NOT NULL DEFAULT true,
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_key_project ON api_key(project_id);
CREATE INDEX idx_api_key_hash ON api_key(key_hash);
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | UUID | 是 | 主键 |
| project_id | UUID | 是 | 所属 project |
| key_hash | VARCHAR(255) | 是 | Key 的 SHA-256 哈希，用于验证 |
| key_prefix | VARCHAR(20) | 是 | Key 的前缀，如 `sk-moy-a1b2`，用于界面展示 |
| name | VARCHAR(200) | 否 | 用户为 Key 设置的备注 |
| enabled | BOOLEAN | 是 | 是否启用 |
| last_used_at | TIMESTAMPTZ | 否 | 最近一次使用时间 |
| created_at | TIMESTAMPTZ | 是 | |
| updated_at | TIMESTAMPTZ | 是 | |

### API Key 生成与存储规则

1. **格式**：`sk-moy-` + 32 位随机 hex，示例：`sk-moy-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6`
2. **完整 Key 仅创建时返回一次**，之后不可查询。前端需提示用户立即复制保存
3. **数据库只存 key_hash**（SHA-256），不存储明文
4. **key_prefix 公开存储**，用于界面识别是哪个 Key（取前 12 位，含前缀：`sk-moy-a1b2`）
5. **鉴权流程**：从 Authorization header 取 Bearer token → SHA-256(token) → 查 `api_key WHERE key_hash = ?`

## 6. QuotaAccount 表

```sql
CREATE TABLE api_quota_account (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES api_project(id) UNIQUE,
    balance_amount  DECIMAL(12, 6) NOT NULL DEFAULT 0,        -- 当前余额（人民币）
    total_quota     DECIMAL(12, 6) NOT NULL DEFAULT 0,        -- 累计充值/赠送总额
    total_consumed  DECIMAL(12, 6) NOT NULL DEFAULT 0,        -- 累计消费
    frozen_amount   DECIMAL(12, 6) NOT NULL DEFAULT 0,        -- 冻结金额
    status          VARCHAR(20) NOT NULL DEFAULT 'active',    -- active | frozen | closed
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_quota_account_project ON api_quota_account(project_id);
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | UUID | 是 | 主键 |
| project_id | UUID | 是 | 所属 project，一对一 |
| balance_amount | DECIMAL(12,6) | 是 | 当前可用余额 |
| total_quota | DECIMAL(12,6) | 是 | 历史累计总额度（含赠送） |
| total_consumed | DECIMAL(12,6) | 是 | 历史累计消费 |
| frozen_amount | DECIMAL(12,6) | 是 | 冻结金额（预留） |
| status | VARCHAR(20) | 是 | active / frozen / closed |
| created_at | TIMESTAMPTZ | 是 | |
| updated_at | TIMESTAMPTZ | 是 | |

**说明**：MVP 阶段每个 project 一个额度账户，新用户注册默认赠送 ¥10 额度。实际可用额度 = balance_amount - frozen_amount。

## 7. QuotaLedger 表

```sql
CREATE TABLE api_quota_ledger (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES api_project(id),
    account_id       UUID NOT NULL REFERENCES api_quota_account(id),
    type            VARCHAR(20) NOT NULL,                     -- charge | consume | refund | adjust
    amount          DECIMAL(12, 6) NOT NULL,
    balance_before  DECIMAL(12, 6) NOT NULL,
    balance_after   DECIMAL(12, 6) NOT NULL,
    reference_type  VARCHAR(50),                              -- usage_log | manual | system
    reference_id    UUID,                                     -- 关联的业务 ID（如 usage_log.id）
    remark          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_quota_ledger_project ON api_quota_ledger(project_id);
CREATE INDEX idx_api_quota_ledger_account ON api_quota_ledger(account_id);
CREATE INDEX idx_api_quota_ledger_ref ON api_quota_ledger(reference_type, reference_id);
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | UUID | 是 | 主键 |
| project_id | UUID | 是 | 所属 project |
| account_id | UUID | 是 | 关联的额度账户 |
| type | VARCHAR(20) | 是 | charge(充值) / consume(消费) / refund(退款) / adjust(调账) |
| amount | DECIMAL(12,6) | 是 | 变动金额，充值为正、消费为负 |
| balance_before | DECIMAL(12,6) | 是 | 变动前余额 |
| balance_after | DECIMAL(12,6) | 是 | 变动后余额 |
| reference_type | VARCHAR(50) | 否 | 关联业务类型 |
| reference_id | UUID | 否 | 关联业务 ID |
| remark | TEXT | 否 | |
| created_at | TIMESTAMPTZ | 是 | |

**说明**：QuotaLedger 是额度流水表，不可修改、不可删除。每次额度变动（赠送、消费、将来可能的充值和退款）都必须写入一条流水，确保可审计、可追溯。

## 8. UsageLog 表

完整定义见 [04_调用日志与成本统计](./04_调用日志与成本统计.md)。

```sql
CREATE TABLE api_usage_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES api_project(id),
    api_key_id          UUID NOT NULL REFERENCES api_key(id),
    user_id             UUID NOT NULL REFERENCES api_user(id),
    model               VARCHAR(100) NOT NULL,
    provider            VARCHAR(50) NOT NULL,
    request_id          VARCHAR(100) NOT NULL UNIQUE,
    prompt_tokens       INTEGER NOT NULL DEFAULT 0,
    completion_tokens   INTEGER NOT NULL DEFAULT 0,
    total_tokens        INTEGER NOT NULL DEFAULT 0,
    cost_amount         DECIMAL(12, 8) NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL,                 -- success | error | rate_limited | quota_exceeded
    error_code          VARCHAR(50),
    error_message       TEXT,
    latency_ms          INTEGER,
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_usage_log_project ON api_usage_log(project_id);
CREATE INDEX idx_api_usage_log_key ON api_usage_log(api_key_id);
CREATE INDEX idx_api_usage_log_user ON api_usage_log(user_id);
CREATE INDEX idx_api_usage_log_model ON api_usage_log(model);
CREATE INDEX idx_api_usage_log_created ON api_usage_log(created_at);
CREATE INDEX idx_api_usage_log_status ON api_usage_log(status);
```

## 9. 数据一致性保证

### 额度扣减与调用日志的事务性

每次 API 调用必须在一个数据库事务中完成：

```
BEGIN
  1. 查询并锁定额度账户：SELECT ... FROM api_quota_account WHERE project_id = ? FOR UPDATE
  2. 计算本次调用成本
  3. 检查余额是否充足
  4. UPDATE api_quota_account SET balance_amount = balance_amount - cost
  5. INSERT INTO api_quota_ledger (type='consume', amount=-cost, ...)
  6. INSERT INTO api_usage_log (...)
  7. 转发请求到上游供应商
  8. 更新 api_usage_log 的 token 信息、状态
COMMIT
```

若上游调用失败，回滚整个事务或记录为 error 状态不扣费（具体策略见 04 号文档）。

### 幂等性

- `request_id` 为唯一约束，客户端可传入幂等键
- 重复的 request_id 拒绝写入，返回已有结果（如可检索）

## 10. MVP 简化说明

MVP 阶段以下设计作了简化，远期迭代：

| 简化项 | MVP 做法 | 远期方案 |
| --- | --- | --- |
| 额度单位 | 人民币（元） | 支持多种货币，或改为积分制 |
| 额度充值 | 无，仅新用户赠送 | 接入微信/支付宝充值 |
| 多租户 | 无 org_id | S5 增加 org_id 隔离 |
| 团队 | 一个 user 一个 project | 多成员 project |
| 价格模型 | 固定价格表 | 动态定价（供应商价格波动） |
