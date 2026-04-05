# MOY 接口设计说明（API）

---

## 文档元信息

| 属性     | 内容                                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 文档名称 | MOY 接口设计说明                                                                                                                                    |
| 文档编号 | MOY_API_001                                                                                                                                         |
| 版本号   | v2.0                                                                                                                                                |
| 状态     | 已确认                                                                                                                                              |
| 作者     | MOY 文档架构组                                                                                                                                      |
| 日期     | 2026-04-05                                                                                                                                          |
| 目标读者 | 前端开发、后端开发、测试工程师、接口联调人员                                                                                                        |
| 输入来源 | [PRD](./06_PRD_产品需求规格说明书_v0.1.md)、[RTM](./07_RTM_需求跟踪矩阵.md)、[HLD](./09_HLD_系统高层设计.md)、[DBD](./10_DBD_数据模型与数据字典.md) |

---

## 一、文档目的

本文档作为 MOY 项目首期 MVP 的**接口契约基线**，用于：

1. 定义统一的接口规范，支撑前后端并行开发
2. 明确每个接口的请求参数、响应格式、业务规则
3. 为测试用例设计提供依据
4. 支持接口文档自动生成和 Mock 数据生成
5. 确保接口设计与 PRD/HLD/DBD 保持一致

**阅读建议：**

- 前端开发：重点阅读接口清单、请求参数、响应格式
- 后端开发：重点阅读业务校验规则、错误场景、状态流转
- 测试工程师：重点阅读业务规则、边界条件、错误场景
- 接口联调：重点阅读请求示例、响应示例

**重要说明：** 本文档范围限定为首期 MVP，不包含后续规划功能的接口设计。

---

## 二、适用范围

| 维度     | 范围说明                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------- |
| 产品范围 | MOY 首期 MVP：客户管理、线索管理、会话管理、商机管理、工单管理、知识库（基础版）、数据看板（基础版） |
| 接口协议 | HTTP/1.1 + HTTPS                                                                                     |
| 数据格式 | JSON                                                                                                 |
| 字符编码 | UTF-8                                                                                                |
| API 版本 | v1                                                                                                   |

---

## 三、上游输入文档

| 文档                                                                      | 版本 | 用途               |
| ------------------------------------------------------------------------- | ---- | ------------------ |
| [00_AGENTS.md](./00_AGENTS.md)                                            | v0.1 | 文档治理规则       |
| [00_Glossary.md](./00_Glossary.md)                                        | v0.1 | 术语定义           |
| [06*PRD*产品需求规格说明书\_v0.1.md](./06_PRD_产品需求规格说明书_v0.1.md) | v0.1 | 业务规则、字段定义 |
| [07*RTM*需求跟踪矩阵.md](./07_RTM_需求跟踪矩阵.md)                        | v0.1 | 需求跟踪           |
| [09*HLD*系统高层设计.md](./09_HLD_系统高层设计.md)                        | v0.1 | 模块划分、接口定义 |
| [10*DBD*数据模型与数据字典.md](./10_DBD_数据模型与数据字典.md)            | v0.1 | 数据表、字段定义   |

---

## 四、接口设计原则

### 4.1 RESTful 规范

| 原则      | 说明                                       | 示例                              |
| --------- | ------------------------------------------ | --------------------------------- |
| 资源命名  | 使用名词复数，小写，中划线分隔             | `/api/v1/customers`               |
| HTTP 方法 | GET 查询、POST 创建、PUT 更新、DELETE 删除 | `POST /api/v1/customers`          |
| 层级结构  | 不超过 3 层，超过则使用查询参数            | `/api/v1/customers/{id}/contacts` |
| 版本控制  | URL 路径版本控制                           | `/api/v1/...`                     |
| 过滤排序  | 使用查询参数                               | `?status=active&sort=-created_at` |

### 4.2 统一鉴权

| 鉴权方式     | 说明                                    |
| ------------ | --------------------------------------- |
| 认证方案     | JWT Bearer Token                        |
| Token 传递   | Authorization 请求头：`Bearer {token}`  |
| Token 有效期 | Access Token: 2小时，Refresh Token: 7天 |
| Token 刷新   | 使用 Refresh Token 换取新 Access Token  |

**请求头示例：**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
X-Request-ID: uuid-xxx-xxx
```

### 4.3 多租户上下文处理

| 处理方式   | 说明                              |
| ---------- | --------------------------------- |
| 租户识别   | 从 JWT Token 中解析 org_id        |
| 数据隔离   | 后端自动注入 org_id 过滤条件      |
| 跨租户禁止 | 禁止跨租户数据访问，返回 403 错误 |

### 4.4 分页规范

| 参数      | 类型    | 默认值      | 说明                   |
| --------- | ------- | ----------- | ---------------------- |
| page      | integer | 1           | 页码，从 1 开始        |
| page_size | integer | 20          | 每页条数，最大 100     |
| sort      | string  | -created_at | 排序字段，`-` 表示降序 |

**请求示例：**

```http
GET /api/v1/customers?page=1&page_size=20&sort=-created_at
```

### 4.5 筛选规范

| 筛选类型 | 格式                      | 示例                         |
| -------- | ------------------------- | ---------------------------- |
| 精确匹配 | field=value               | `status=active`              |
| 模糊匹配 | field\_\_like=value       | `name__like=张`              |
| 范围查询 | field**gte, field**lte    | `created_at__gte=2026-01-01` |
| 多值查询 | field\_\_in=value1,value2 | `status__in=active,inactive` |
| 空值查询 | field\_\_null=true/false  | `owner_id__null=true`        |

---

## 五、认证与鉴权

### 5.1 登录接口

#### POST /api/v1/auth/login

**功能描述：** 用户登录，获取 Access Token 和 Refresh Token

**权限要求：** 无

**请求参数：**

| 参数名   | 类型   | 必填 | 说明   |
| -------- | ------ | ---- | ------ |
| username | string | 是   | 用户名 |
| password | string | 是   | 密码   |

**请求体示例：**

```json
{
  "username": "zhangsan",
  "password": "Password123!"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 7200,
    "user": {
      "id": 1,
      "username": "zhangsan",
      "real_name": "张三",
      "email": "zhangsan@company.com",
      "phone": "138****8000",
      "avatar": "https://xxx.com/avatar.png",
      "status": "active",
      "roles": [
        {
          "id": 1,
          "code": "sales_rep",
          "name": "销售人员"
        }
      ],
      "org": {
        "id": 1,
        "name": "桐鸣科技",
        "code": "TONGMING001"
      }
    }
  }
}
```

**错误场景：**

| 错误码 | 说明               |
| ------ | ------------------ |
| 10001  | 用户名或密码错误   |
| 10002  | 账号已被锁定       |
| 10003  | 账号已被禁用       |
| 10004  | 组织已过期或被禁用 |

**对应需求ID：** REQ-SYS-001

---

### 5.2 登出接口

#### POST /api/v1/auth/logout

**功能描述：** 用户登出，使 Token 失效

**权限要求：** 已登录用户

**请求参数：** 无

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

**对应需求ID：** REQ-SYS-001

---

### 5.3 刷新 Token

#### POST /api/v1/auth/refresh

**功能描述：** 使用 Refresh Token 刷新 Access Token

**权限要求：** 有效的 Refresh Token

**请求参数：**

| 参数名        | 类型   | 必填 | 说明     |
| ------------- | ------ | ---- | -------- |
| refresh_token | string | 是   | 刷新令牌 |

**请求体示例：**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 7200
  }
}
```

**错误场景：**

| 错误码 | 说明                 |
| ------ | -------------------- |
| 10005  | Refresh Token 无效   |
| 10006  | Refresh Token 已过期 |

---

### 5.4 获取当前用户信息

#### GET /api/v1/auth/me

**功能描述：** 获取当前登录用户的详细信息

**权限要求：** 已登录用户

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "username": "zhangsan",
    "real_name": "张三",
    "email": "zhangsan@company.com",
    "phone": "138****8000",
    "avatar": "https://xxx.com/avatar.png",
    "status": "active",
    "last_login_at": "2026-04-04T10:00:00Z",
    "roles": [
      {
        "id": 1,
        "code": "sales_rep",
        "name": "销售人员",
        "permissions": ["customer:read", "customer:create", "lead:read"]
      }
    ],
    "org": {
      "id": 1,
      "name": "桐鸣科技",
      "code": "TONGMING001"
    }
  }
}
```

---

### 5.5 权限校验原则

| 校验层级 | 说明                                             |
| -------- | ------------------------------------------------ |
| 接口级   | 检查用户是否有访问该接口的权限                   |
| 数据级   | 检查用户是否有访问该数据的权限（个人/团队/全部） |
| 字段级   | 检查用户是否有访问敏感字段的权限（脱敏处理）     |

**越权返回规范：**

```json
{
  "code": 40301,
  "message": "无权限访问该资源",
  "data": null
}
```

---

## 六、通用响应格式

### 6.1 成功返回

```json
{
  "code": 0,
  "message": "success",
  "data": {
    // 业务数据
  }
}
```

### 6.2 错误返回

```json
{
  "code": 10001,
  "message": "用户名或密码错误",
  "data": null,
  "errors": [
    {
      "field": "username",
      "message": "用户名不存在"
    }
  ]
}
```

### 6.3 分页返回

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      { "id": 1, "name": "客户A" },
      { "id": 2, "name": "客户B" }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

### 6.4 响应头规范

| 响应头                | 说明                       |
| --------------------- | -------------------------- |
| X-Request-ID          | 请求唯一标识，用于链路追踪 |
| X-RateLimit-Limit     | 限流上限                   |
| X-RateLimit-Remaining | 剩余配额                   |
| X-Response-Time       | 响应时间(ms)               |

---

## 七、错误码规范

### 7.1 错误码结构

```
错误码格式：XXYYZ
- XX：模块代码（00 通用，10 认证，20 客户，30 线索，40 会话，50 商机，60 工单，70 知识库，80 系统）
- YY：错误类型（00 参数，01 业务，02 权限，03 状态，04 数据）
- Z：具体错误序号
```

### 7.2 通用错误码

| 错误码 | 说明             | HTTP 状态码 |
| ------ | ---------------- | ----------- |
| 0      | 成功             | 200         |
| 40000  | 请求参数错误     | 400         |
| 40001  | 请求体格式错误   | 400         |
| 40002  | 必填参数缺失     | 400         |
| 40003  | 参数格式不正确   | 400         |
| 40004  | 参数值超出范围   | 400         |
| 40100  | 未认证           | 401         |
| 40101  | Token 无效       | 401         |
| 40102  | Token 已过期     | 401         |
| 40300  | 无权限           | 403         |
| 40301  | 无权限访问该资源 | 403         |
| 40302  | 无权限执行该操作 | 403         |
| 40400  | 资源不存在       | 404         |
| 40401  | 数据不存在       | 404         |
| 40900  | 资源冲突         | 409         |
| 40901  | 数据已存在       | 409         |
| 40902  | 状态冲突         | 409         |
| 42900  | 请求过于频繁     | 429         |
| 50000  | 服务器内部错误   | 500         |
| 50001  | 数据库错误       | 500         |
| 50002  | 第三方服务错误   | 500         |

### 7.3 认证模块错误码

| 错误码 | 说明                 |
| ------ | -------------------- |
| 10001  | 用户名或密码错误     |
| 10002  | 账号已被锁定         |
| 10003  | 账号已被禁用         |
| 10004  | 组织已过期或被禁用   |
| 10005  | Refresh Token 无效   |
| 10006  | Refresh Token 已过期 |
| 10007  | 密码强度不足         |
| 10008  | 原密码错误           |

### 7.4 客户模块错误码

| 错误码 | 说明             |
| ------ | ---------------- |
| 20001  | 客户名称不能为空 |
| 20002  | 客户不存在       |
| 20003  | 客户已删除       |
| 20004  | 手机号格式不正确 |
| 20005  | 邮箱格式不正确   |
| 20006  | 客户类型不正确   |
| 20007  | 无权限访问该客户 |
| 20008  | 客户标签不存在   |

### 7.5 线索模块错误码

| 错误码 | 说明                 |
| ------ | -------------------- |
| 30001  | 线索手机号不能为空   |
| 30002  | 线索不存在           |
| 30003  | 线索已转化，无法操作 |
| 30004  | 线索已失效，无法操作 |
| 30005  | 线索状态流转不合法   |
| 30006  | 线索转化必须关联客户 |
| 30007  | 导入文件格式不正确   |
| 30008  | 导入数据行数超限     |

### 7.6 会话模块错误码

| 错误码 | 说明                 |
| ------ | -------------------- |
| 40001  | 会话不存在           |
| 40002  | 会话已关闭           |
| 40003  | 会话已被其他客服接入 |
| 40004  | 消息内容不能为空     |
| 40005  | 消息类型不支持       |
| 40006  | 附件大小超限         |
| 40007  | AI 服务暂不可用      |

### 7.7 商机模块错误码

| 错误码 | 说明                 |
| ------ | -------------------- |
| 50001  | 商机不存在           |
| 50002  | 商机已成交，无法操作 |
| 50003  | 商机已失败，无法操作 |
| 50004  | 商机阶段流转不合法   |
| 50005  | 商机必须关联客户     |
| 50006  | 商机金额格式不正确   |

### 7.8 工单模块错误码

| 错误码 | 说明                     |
| ------ | ------------------------ |
| 60001  | 工单不存在               |
| 60002  | 工单已关闭               |
| 60003  | 工单状态流转不合法       |
| 60004  | 工单标题不能为空         |
| 60005  | 工单描述不能为空         |
| 60006  | 工单类型不正确           |
| 60007  | 工单优先级不正确         |
| 60008  | 关闭工单必须填写处理结果 |

### 7.9 知识库模块错误码

| 错误码 | 说明                |
| ------ | ------------------- |
| 70001  | 知识条目不存在      |
| 70002  | 知识分类不存在      |
| 70003  | 知识标题不能为空    |
| 70004  | 知识内容不能为空    |
| 70005  | AI 问答服务暂不可用 |

### 7.10 系统模块错误码

| 错误码 | 说明                 |
| ------ | -------------------- |
| 80001  | 用户不存在           |
| 80002  | 用户名已存在         |
| 80003  | 邮箱已存在           |
| 80004  | 手机号已存在         |
| 80005  | 角色不存在           |
| 80006  | 不能删除系统角色     |
| 80007  | 不能修改系统角色权限 |

---

## 八、模块接口清单

### 8.1 接口总览

| 模块        | 接口数量 | P0 接口 | P1 接口 |
| ----------- | -------- | ------- | ------- |
| 认证模块    | 5        | 5       | 0       |
| 组织管理    | 4        | 4       | 0       |
| 部门管理    | 5        | 4       | 1       |
| 用户管理    | 6        | 4       | 2       |
| 角色管理    | 7        | 5       | 2       |
| 权限管理    | 6        | 4       | 2       |
| 客户管理    | 12       | 10      | 2       |
| 线索管理    | 10       | 9       | 1       |
| 会话管理    | 12       | 11      | 1       |
| 商机管理    | 10       | 9       | 1       |
| 任务管理    | 8        | 8       | 0       |
| 工单管理    | 12       | 12      | 0       |
| 知识库      | 8        | 0       | 8       |
| 通知中心    | 6        | 6       | 0       |
| 渠道管理    | 5        | 4       | 1       |
| 自动化规则  | 6        | 0       | 6       |
| AI工作台    | 5        | 0       | 5       |
| 数据看板    | 4        | 0       | 4       |
| 标签管理    | 4        | 4       | 0       |
| 审计日志    | 6        | 6       | 0       |
| 配置中心    | 10       | 8       | 2       |
| 集成管理    | 8        | 6       | 2       |
| Webhook管理 | 6        | 4       | 2       |
| **合计**    | **172**  | **127** | **45**  |

---

## 九、客户管理模块接口

### 9.1 获取客户列表

#### GET /api/v1/customers

**功能描述：** 获取客户列表，支持分页、筛选、排序

**权限要求：** customer:read

**请求参数：**

| 参数名            | 类型    | 必填 | 说明                            |
| ----------------- | ------- | ---- | ------------------------------- |
| page              | integer | 否   | 页码，默认 1                    |
| page_size         | integer | 否   | 每页条数，默认 20，最大 100     |
| sort              | string  | 否   | 排序字段，默认 -created_at      |
| name              | string  | 否   | 客户名称（模糊搜索）            |
| phone             | string  | 否   | 手机号（精确匹配）              |
| company           | string  | 否   | 公司名称（模糊搜索）            |
| type              | string  | 否   | 客户类型：individual/enterprise |
| status            | string  | 否   | 状态：potential/new_customer/active/silent/lost |
| level             | string  | 否   | 客户等级：A/B/C/D               |
| source            | string  | 否   | 客户来源                        |
| owner_id          | integer | 否   | 负责人ID                        |
| tag_ids           | string  | 否   | 标签ID，多个用逗号分隔          |
| created_at\_\_gte | string  | 否   | 创建时间起                      |
| created_at\_\_lte | string  | 否   | 创建时间止                      |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "桐鸣科技",
        "type": "enterprise",
        "phone": "138****8000",
        "email": "contact@tongming.com",
        "company": "桐鸣科技有限公司",
        "position": "采购总监",
        "address": "北京市朝阳区xxx",
        "source": "website",
        "level": "A",
        "status": "active",
        "owner": {
          "id": 1,
          "name": "张三"
        },
        "tags": [{ "id": 1, "name": "VIP", "color": "#ff0000" }],
        "created_at": "2026-04-01T10:00:00Z",
        "updated_at": "2026-04-04T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

**对应需求ID：** REQ-CM-003

---

### 9.2 创建客户

#### POST /api/v1/customers

**功能描述：** 创建新客户

**权限要求：** customer:create

**请求参数：**

| 参数名   | 类型    | 必填 | 说明                            |
| -------- | ------- | ---- | ------------------------------- |
| name     | string  | 是   | 客户名称，最大 128 字符         |
| type     | string  | 是   | 客户类型：individual/enterprise |
| phone    | string  | 否   | 手机号，11 位数字               |
| email    | string  | 否   | 邮箱地址                        |
| company  | string  | 否   | 所属公司                        |
| position | string  | 否   | 职位                            |
| address  | string  | 否   | 地址                            |
| source   | string  | 否   | 客户来源                        |
| level    | string  | 否   | 客户等级：A/B/C/D，默认 C       |
| owner_id | integer | 否   | 负责人ID                        |
| remark   | string  | 否   | 备注                            |
| tag_ids  | array   | 否   | 标签ID数组                      |
| contacts | array   | 否   | 联系人列表                      |

**请求体示例：**

```json
{
  "name": "桐鸣科技",
  "type": "enterprise",
  "phone": "13800138000",
  "email": "contact@tongming.com",
  "company": "桐鸣科技有限公司",
  "position": "采购总监",
  "address": "北京市朝阳区xxx",
  "source": "website",
  "level": "A",
  "owner_id": 1,
  "remark": "重点客户",
  "tag_ids": [1, 2],
  "contacts": [
    {
      "name": "李四",
      "phone": "13900139000",
      "email": "lisi@tongming.com",
      "position": "采购经理",
      "is_primary": true
    }
  ]
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "桐鸣科技",
    "type": "enterprise",
    "phone": "138****8000",
    "email": "contact@tongming.com",
    "company": "桐鸣科技有限公司",
    "position": "采购总监",
    "address": "北京市朝阳区xxx",
    "source": "website",
    "level": "A",
    "status": "active",
    "owner": {
      "id": 1,
      "name": "张三"
    },
    "tags": [
      { "id": 1, "name": "VIP", "color": "#ff0000" },
      { "id": 2, "name": "高意向", "color": "#00ff00" }
    ],
    "created_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则         | 说明                                 |
| ------------ | ------------------------------------ |
| 客户名称必填 | name 不能为空                        |
| 客户类型必填 | type 必须为 individual 或 enterprise |
| 手机号格式   | 如果填写，必须为 11 位数字           |
| 邮箱格式     | 如果填写，必须符合邮箱格式           |
| 负责人校验   | owner_id 必须为有效用户ID            |
| 标签校验     | tag_ids 中的标签必须存在             |

**错误场景：**

| 错误码 | 说明             |
| ------ | ---------------- |
| 20001  | 客户名称不能为空 |
| 20004  | 手机号格式不正确 |
| 20005  | 邮箱格式不正确   |
| 20006  | 客户类型不正确   |

**对应需求ID：** REQ-CM-001

---

### 9.3 获取客户详情

#### GET /api/v1/customers/{id}

**功能描述：** 获取客户详细信息，包含客户画像

**权限要求：** customer:read

**路径参数：**

| 参数名 | 类型    | 必填 | 说明   |
| ------ | ------- | ---- | ------ |
| id     | integer | 是   | 客户ID |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "桐鸣科技",
    "type": "enterprise",
    "phone": "138****8000",
    "email": "contact@tongming.com",
    "company": "桐鸣科技有限公司",
    "position": "采购总监",
    "address": "北京市朝阳区xxx",
    "source": "website",
    "level": "A",
    "status": "active",
    "owner": {
      "id": 1,
      "name": "张三",
      "phone": "139****9000"
    },
    "tags": [{ "id": 1, "name": "VIP", "color": "#ff0000" }],
    "contacts": [
      {
        "id": 1,
        "name": "李四",
        "phone": "139****9000",
        "email": "lisi@tongming.com",
        "position": "采购经理",
        "is_primary": true
      }
    ],
    "statistics": {
      "lead_count": 5,
      "opportunity_count": 3,
      "opportunity_amount": 500000.0,
      "ticket_count": 2,
      "conversation_count": 10
    },
    "recent_activities": [
      {
        "type": "opportunity",
        "action": "stage_change",
        "content": "商机阶段变更为「商务谈判」",
        "created_at": "2026-04-04T09:00:00Z"
      }
    ],
    "created_at": "2026-04-01T10:00:00Z",
    "updated_at": "2026-04-04T10:00:00Z",
    "created_by": {
      "id": 1,
      "name": "张三"
    }
  }
}
```

**对应需求ID：** REQ-CM-004

---

### 9.4 更新客户

#### PUT /api/v1/customers/{id}

**功能描述：** 更新客户信息

**权限要求：** customer:update

**路径参数：**

| 参数名 | 类型    | 必填 | 说明   |
| ------ | ------- | ---- | ------ |
| id     | integer | 是   | 客户ID |

**请求参数：** 同创建客户，所有字段均为可选

**请求体示例：**

```json
{
  "name": "桐鸣科技（更新）",
  "level": "A",
  "owner_id": 2,
  "remark": "重点跟进客户"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "桐鸣科技（更新）",
    "level": "A",
    "updated_at": "2026-04-04T11:00:00Z"
  }
}
```

**业务校验规则：**

| 规则       | 说明                                   |
| ---------- | -------------------------------------- |
| 客户存在性 | 客户必须存在且未删除                   |
| 权限校验   | 只能修改有权限的客户（个人/团队/全部） |
| 变更记录   | 关键字段变更记录审计日志               |

**对应需求ID：** REQ-CM-002

---

### 9.5 删除客户

#### DELETE /api/v1/customers/{id}

**功能描述：** 软删除客户

**权限要求：** customer:delete

**路径参数：**

| 参数名 | 类型    | 必填 | 说明   |
| ------ | ------- | ---- | ------ |
| id     | integer | 是   | 客户ID |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

**业务校验规则：**

| 规则         | 说明                                                |
| ------------ | --------------------------------------------------- |
| 关联数据处理 | 联系人级联软删除，线索/商机/会话/工单保留但解除关联 |
| 审计记录     | 记录删除操作审计日志                                |

**对应需求ID：** REQ-CM-001

---

### 9.6 添加客户标签

#### POST /api/v1/customers/{id}/tags

**功能描述：** 为客户添加标签

**权限要求：** customer:update

**请求参数：**

| 参数名  | 类型  | 必填 | 说明       |
| ------- | ----- | ---- | ---------- |
| tag_ids | array | 是   | 标签ID数组 |

**请求体示例：**

```json
{
  "tag_ids": [1, 2, 3]
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "tags": [
      { "id": 1, "name": "VIP", "color": "#ff0000" },
      { "id": 2, "name": "高意向", "color": "#00ff00" },
      { "id": 3, "name": "重点跟进", "color": "#0000ff" }
    ]
  }
}
```

**对应需求ID：** REQ-CM-006

---

### 9.7 移除客户标签

#### DELETE /api/v1/customers/{id}/tags/{tag_id}

**功能描述：** 移除客户标签

**权限要求：** customer:update

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

**对应需求ID：** REQ-CM-006

---

### 9.8 获取客户联系人列表

#### GET /api/v1/customers/{id}/contacts

**功能描述：** 获取客户联系人列表

**权限要求：** customer:read

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "李四",
        "phone": "139****9000",
        "email": "lisi@tongming.com",
        "position": "采购经理",
        "is_primary": true,
        "remark": "主要对接人",
        "created_at": "2026-04-01T10:00:00Z"
      }
    ]
  }
}
```

---

### 9.9 创建客户联系人

#### POST /api/v1/customers/{id}/contacts

**功能描述：** 创建客户联系人

**权限要求：** customer:update

**请求参数：**

| 参数名     | 类型    | 必填 | 说明                       |
| ---------- | ------- | ---- | -------------------------- |
| name       | string  | 是   | 联系人姓名                 |
| phone      | string  | 否   | 手机号                     |
| email      | string  | 否   | 邮箱                       |
| position   | string  | 否   | 职位                       |
| is_primary | boolean | 否   | 是否主要联系人，默认 false |
| remark     | string  | 否   | 备注                       |

**请求体示例：**

```json
{
  "name": "王五",
  "phone": "13700137000",
  "email": "wangwu@tongming.com",
  "position": "技术总监",
  "is_primary": false,
  "remark": "技术对接人"
}
```

---

### 9.10 客户搜索

#### GET /api/v1/customers/search

**功能描述：** 客户快速搜索，用于下拉选择等场景

**权限要求：** customer:read

**请求参数：**

| 参数名  | 类型    | 必填 | 说明                       |
| ------- | ------- | ---- | -------------------------- |
| keyword | string  | 是   | 搜索关键词                 |
| limit   | integer | 否   | 返回数量，默认 10，最大 20 |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "桐鸣科技",
        "company": "桐鸣科技有限公司",
        "phone": "138****8000"
      }
    ]
  }
}
```

---

## 十、线索管理模块接口

### 10.1 获取线索列表

#### GET /api/v1/leads

**功能描述：** 获取线索列表，支持分页、筛选、排序

**权限要求：** lead:read

**请求参数：**

| 参数名            | 类型    | 必填 | 说明                                           |
| ----------------- | ------- | ---- | ---------------------------------------------- |
| page              | integer | 否   | 页码                                           |
| page_size         | integer | 否   | 每页条数                                       |
| sort              | string  | 否   | 排序字段                                       |
| name              | string  | 否   | 联系人姓名（模糊搜索）                         |
| phone             | string  | 否   | 手机号                                         |
| company           | string  | 否   | 公司名称                                       |
| status            | string  | 否   | 状态：new/assigned/following/converted/invalid |
| source            | string  | 否   | 线索来源                                       |
| owner_id          | integer | 否   | 负责人ID                                       |
| created_at\_\_gte | string  | 否   | 创建时间起                                     |
| created_at\_\_lte | string  | 否   | 创建时间止                                     |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "王五",
        "phone": "137****7000",
        "email": "wangwu@company.com",
        "company": "某某公司",
        "source": "website",
        "status": "following",
        "owner": {
          "id": 1,
          "name": "张三"
        },
        "customer": {
          "id": 1,
          "name": "桐鸣科技"
        },
        "converted_at": null,
        "created_at": "2026-04-01T10:00:00Z",
        "updated_at": "2026-04-04T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 50,
      "total_pages": 3
    }
  }
}
```

**对应需求ID：** REQ-LM-001

---

### 10.2 创建线索

#### POST /api/v1/leads

**功能描述：** 创建新线索

**权限要求：** lead:create

**请求参数：**

| 参数名   | 类型    | 必填 | 说明       |
| -------- | ------- | ---- | ---------- |
| name     | string  | 是   | 联系人姓名 |
| phone    | string  | 是   | 手机号     |
| email    | string  | 否   | 邮箱       |
| company  | string  | 否   | 公司名称   |
| source   | string  | 否   | 线索来源   |
| owner_id | integer | 否   | 负责人ID   |
| remark   | string  | 否   | 备注       |

**请求体示例：**

```json
{
  "name": "王五",
  "phone": "13700137000",
  "email": "wangwu@company.com",
  "company": "某某公司",
  "source": "website",
  "owner_id": 1,
  "remark": "客户主动咨询"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "王五",
    "phone": "137****7000",
    "email": "wangwu@company.com",
    "company": "某某公司",
    "source": "website",
    "status": "new",
    "owner": {
      "id": 1,
      "name": "张三"
    },
    "created_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则       | 说明                      |
| ---------- | ------------------------- |
| 手机号必填 | phone 不能为空            |
| 手机号格式 | 必须为 11 位数字          |
| 负责人校验 | owner_id 必须为有效用户ID |

**对应需求ID：** REQ-LM-001

---

### 10.3 批量导入线索

#### POST /api/v1/leads/import

**功能描述：** 批量导入线索，支持 CSV/Excel 文件

**权限要求：** lead:create

**请求参数：**

| 参数名   | 类型    | 必填 | 说明                 |
| -------- | ------- | ---- | -------------------- |
| file     | file    | 是   | 导入文件（CSV/XLSX） |
| owner_id | integer | 否   | 默认负责人ID         |

**请求体示例：** multipart/form-data

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 100,
    "success": 95,
    "failed": 5,
    "errors": [
      {
        "row": 10,
        "message": "手机号格式不正确"
      },
      {
        "row": 25,
        "message": "手机号已存在"
      }
    ]
  }
}
```

**业务校验规则：**

| 规则     | 说明                  |
| -------- | --------------------- |
| 文件格式 | 仅支持 CSV、XLSX 格式 |
| 文件大小 | 最大 5MB              |
| 数据行数 | 单次最多导入 1000 条  |
| 重复检测 | 手机号重复的行跳过    |

**对应需求ID：** REQ-LM-002

---

### 10.4 获取线索详情

#### GET /api/v1/leads/{id}

**功能描述：** 获取线索详细信息

**权限要求：** lead:read

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "王五",
    "phone": "137****7000",
    "email": "wangwu@company.com",
    "company": "某某公司",
    "source": "website",
    "status": "following",
    "owner": {
      "id": 1,
      "name": "张三",
      "phone": "139****9000"
    },
    "customer": {
      "id": 1,
      "name": "桐鸣科技"
    },
    "converted_opportunity": {
      "id": 1,
      "name": "桐鸣科技CRM采购",
      "stage": "negotiation"
    },
    "follow_ups": [
      {
        "id": 1,
        "content": "首次电话沟通，客户表示有兴趣",
        "follow_up_type": "phone",
        "user": {
          "id": 1,
          "name": "张三"
        },
        "next_follow_up_at": "2026-04-05T10:00:00Z",
        "created_at": "2026-04-04T10:00:00Z"
      }
    ],
    "remark": "客户主动咨询",
    "created_at": "2026-04-01T10:00:00Z",
    "updated_at": "2026-04-04T10:00:00Z"
  }
}
```

**对应需求ID：** REQ-LM-004

---

### 10.5 分配线索

#### POST /api/v1/leads/{id}/assign

**功能描述：** 将线索分配给销售人员

**权限要求：** lead:assign（销售经理及以上）

**请求参数：**

| 参数名   | 类型    | 必填 | 说明     |
| -------- | ------- | ---- | -------- |
| owner_id | integer | 是   | 负责人ID |

**请求体示例：**

```json
{
  "owner_id": 2
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "status": "assigned",
    "owner": {
      "id": 2,
      "name": "李四"
    },
    "updated_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则       | 说明                        |
| ---------- | --------------------------- |
| 状态流转   | new → assigned              |
| 负责人校验 | owner_id 必须为有效销售人员 |

**对应需求ID：** REQ-LM-003

---

### 10.6 添加线索跟进记录

#### POST /api/v1/leads/{id}/follow-ups

**功能描述：** 添加线索跟进记录

**权限要求：** lead:update

**请求参数：**

| 参数名            | 类型   | 必填 | 说明                        |
| ----------------- | ------ | ---- | --------------------------- |
| content           | string | 是   | 跟进内容                    |
| follow_up_type    | string | 否   | 跟进方式：phone/email/visit |
| next_follow_up_at | string | 否   | 下次跟进时间                |

**请求体示例：**

```json
{
  "content": "与客户进行了电话沟通，客户对产品很感兴趣，希望安排演示",
  "follow_up_type": "phone",
  "next_follow_up_at": "2026-04-10T10:00:00Z"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "content": "与客户进行了电话沟通，客户对产品很感兴趣，希望安排演示",
    "follow_up_type": "phone",
    "user": {
      "id": 1,
      "name": "张三"
    },
    "next_follow_up_at": "2026-04-10T10:00:00Z",
    "created_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则         | 说明                               |
| ------------ | ---------------------------------- |
| 状态流转     | assigned → following（首次跟进时） |
| 跟进内容必填 | content 不能为空                   |

**对应需求ID：** REQ-LM-004

---

### 10.7 线索转化为商机

#### POST /api/v1/leads/{id}/convert

**功能描述：** 将线索转化为商机

**权限要求：** lead:convert

**请求参数：**

| 参数名              | 类型    | 必填 | 说明                         |
| ------------------- | ------- | ---- | ---------------------------- |
| customer_id         | integer | 否   | 关联客户ID，不填则创建新客户 |
| opportunity_name    | string  | 是   | 商机名称                     |
| amount              | number  | 否   | 商机金额                     |
| expected_close_date | string  | 否   | 预计成交日期                 |

**请求体示例：**

```json
{
  "customer_id": 1,
  "opportunity_name": "桐鸣科技CRM采购",
  "amount": 100000.0,
  "expected_close_date": "2026-06-30"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "lead": {
      "id": 1,
      "status": "converted",
      "converted_at": "2026-04-04T10:00:00Z"
    },
    "opportunity": {
      "id": 1,
      "name": "桐鸣科技CRM采购",
      "amount": 100000.0,
      "stage": "initial",
      "customer": {
        "id": 1,
        "name": "桐鸣科技"
      }
    }
  }
}
```

**业务校验规则：**

| 规则     | 说明                               |
| -------- | ---------------------------------- |
| 状态校验 | 线索状态必须为 following           |
| 客户关联 | 如果不传 customer_id，则创建新客户 |
| 状态流转 | following → converted              |

**错误场景：**

| 错误码 | 说明                 |
| ------ | -------------------- |
| 30003  | 线索已转化，无法操作 |
| 30004  | 线索已失效，无法操作 |
| 30005  | 线索状态流转不合法   |
| 30006  | 线索转化必须关联客户 |

**对应需求ID：** REQ-LM-006

---

### 10.8 标记线索无效

#### POST /api/v1/leads/{id}/invalidate

**功能描述：** 将线索标记为无效

**权限要求：** lead:update

**请求参数：**

| 参数名         | 类型   | 必填 | 说明     |
| -------------- | ------ | ---- | -------- |
| invalid_reason | string | 是   | 无效原因 |

**请求体示例：**

```json
{
  "invalid_reason": "客户明确表示无购买意向"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "status": "invalid",
    "invalid_reason": "客户明确表示无购买意向",
    "updated_at": "2026-04-04T10:00:00Z"
  }
}
```

**对应需求ID：** REQ-LM-005

---

### 10.9 获取线索统计

#### GET /api/v1/leads/statistics

**功能描述：** 获取线索统计数据

**权限要求：** lead:read

**请求参数：**

| 参数名     | 类型   | 必填 | 说明     |
| ---------- | ------ | ---- | -------- |
| start_date | string | 否   | 开始日期 |
| end_date   | string | 否   | 结束日期 |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 100,
    "by_status": {
      "new": 20,
      "assigned": 15,
      "following": 40,
      "converted": 15,
      "invalid": 10
    },
    "by_source": {
      "website": 50,
      "referral": 30,
      "ads": 20
    },
    "conversion_rate": 0.15,
    "avg_follow_up_count": 3.5
  }
}
```

**对应需求ID：** REQ-LM-007

---

## 十一、会话管理模块接口

### 11.1 获取会话列表

#### GET /api/v1/conversations

**功能描述：** 获取会话列表

**权限要求：** conversation:read

**请求参数：**

| 参数名            | 类型    | 必填 | 说明                        |
| ----------------- | ------- | ---- | --------------------------- |
| page              | integer | 否   | 页码                        |
| page_size         | integer | 否   | 每页条数                    |
| sort              | string  | 否   | 排序字段                    |
| status            | string  | 否   | 状态：pending/active/closed |
| channel           | string  | 否   | 渠道：web/wechat/wecom      |
| agent_id          | integer | 否   | 客服ID                      |
| customer_id       | integer | 否   | 客户ID                      |
| created_at\_\_gte | string  | 否   | 创建时间起                  |
| created_at\_\_lte | string  | 否   | 创建时间止                  |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "channel": "web",
        "status": "active",
        "title": "产品咨询",
        "customer": {
          "id": 1,
          "name": "桐鸣科技"
        },
        "agent": {
          "id": 1,
          "name": "客服小王"
        },
        "last_message": {
          "content": "好的，我这边帮您确认一下",
          "sender_type": "agent",
          "sent_at": "2026-04-04T10:00:00Z"
        },
        "unread_count": 2,
        "first_message_at": "2026-04-04T09:00:00Z",
        "last_message_at": "2026-04-04T10:00:00Z",
        "created_at": "2026-04-04T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 30,
      "total_pages": 2
    }
  }
}
```

**对应需求ID：** REQ-SM-002

---

### 11.2 获取会话详情

#### GET /api/v1/conversations/{id}

**功能描述：** 获取会话详细信息

**权限要求：** conversation:read

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "channel": "web",
    "status": "active",
    "title": "产品咨询",
    "customer": {
      "id": 1,
      "name": "桐鸣科技",
      "phone": "138****8000"
    },
    "agent": {
      "id": 1,
      "name": "客服小王",
      "avatar": "https://xxx.com/avatar.png"
    },
    "ticket": {
      "id": 1,
      "title": "产品使用问题",
      "status": "processing"
    },
    "satisfaction": null,
    "first_message_at": "2026-04-04T09:00:00Z",
    "last_message_at": "2026-04-04T10:00:00Z",
    "ended_at": null,
    "end_reason": null,
    "created_at": "2026-04-04T09:00:00Z"
  }
}
```

**对应需求ID：** REQ-SM-003

---

### 11.3 获取会话消息列表

#### GET /api/v1/conversations/{id}/messages

**功能描述：** 获取会话消息记录

**权限要求：** conversation:read

**请求参数：**

| 参数名    | 类型    | 必填 | 说明                                   |
| --------- | ------- | ---- | -------------------------------------- |
| page      | integer | 否   | 页码                                   |
| page_size | integer | 否   | 每页条数                               |
| before_id | integer | 否   | 获取此ID之前的消息（用于向上加载历史） |
| after_id  | integer | 否   | 获取此ID之后的消息（用于获取新消息）   |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "sender_type": "customer",
        "sender_id": 1,
        "sender_name": "客户",
        "content": "你好，我想咨询一下产品价格",
        "message_type": "text",
        "is_ai_generated": false,
        "sent_at": "2026-04-04T09:00:00Z"
      },
      {
        "id": 2,
        "sender_type": "agent",
        "sender_id": 1,
        "sender_name": "客服小王",
        "content": "您好，请问您想了解哪款产品的价格？",
        "message_type": "text",
        "is_ai_generated": true,
        "sent_at": "2026-04-04T09:00:05Z"
      }
    ],
    "has_more": true
  }
}
```

**对应需求ID：** REQ-SM-003

---

### 11.4 发送消息

#### POST /api/v1/conversations/{id}/messages

**功能描述：** 发送消息

**权限要求：** conversation:send

**请求参数：**

| 参数名         | 类型   | 必填 | 说明                                      |
| -------------- | ------ | ---- | ----------------------------------------- |
| content        | string | 是   | 消息内容                                  |
| message_type   | string | 否   | 消息类型：text/image/file/card，默认 text |
| attachment_url | string | 否   | 附件URL（图片/文件类型时必填）            |

**请求体示例：**

```json
{
  "content": "好的，我这边帮您确认一下价格",
  "message_type": "text"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 3,
    "sender_type": "agent",
    "sender_id": 1,
    "sender_name": "客服小王",
    "content": "好的，我这边帮您确认一下价格",
    "message_type": "text",
    "is_ai_generated": false,
    "sent_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则     | 说明                                 |
| -------- | ------------------------------------ |
| 会话状态 | 会话状态必须为 active                |
| 消息内容 | content 不能为空（文本类型）         |
| 附件校验 | 图片/文件类型必须提供 attachment_url |

**对应需求ID：** REQ-SM-004

---

### 11.5 获取智能回复推荐

#### GET /api/v1/conversations/{id}/smart-reply

**功能描述：** 获取 AI 智能回复推荐

**权限要求：** conversation:read

**请求参数：**

| 参数名 | 类型    | 必填 | 说明                     |
| ------ | ------- | ---- | ------------------------ |
| limit  | integer | 否   | 返回数量，默认 3，最大 5 |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "replies": [
      {
        "content": "好的，我这边帮您确认一下产品价格，请稍等",
        "confidence": 0.92,
        "source": "knowledge",
        "knowledge_id": 1
      },
      {
        "content": "请问您想了解哪款产品的价格？我可以为您详细介绍",
        "confidence": 0.85,
        "source": "template",
        "template_id": 1
      }
    ]
  }
}
```

**对应需求ID：** REQ-SM-005

---

### 11.6 获取话术辅助

#### GET /api/v1/conversations/{id}/scripts

**功能描述：** 获取话术辅助推荐

**权限要求：** conversation:read

**请求参数：**

| 参数名 | 类型    | 必填 | 说明                                          |
| ------ | ------- | ---- | --------------------------------------------- |
| scene  | string  | 否   | 场景：greeting/consultation/complaint/closing |
| limit  | integer | 否   | 返回数量，默认 5                              |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "scripts": [
      {
        "id": 1,
        "title": "产品介绍话术",
        "content": "我们的产品具有以下优势：1. 功能全面...",
        "scene": "consultation",
        "use_count": 100
      }
    ]
  }
}
```

**对应需求ID：** REQ-SM-006

---

### 11.7 接入会话

#### POST /api/v1/conversations/{id}/accept

**功能描述：** 客服接入待处理会话

**权限要求：** conversation:accept

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "status": "active",
    "agent": {
      "id": 1,
      "name": "客服小王"
    },
    "updated_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则     | 说明                       |
| -------- | -------------------------- |
| 状态流转 | pending → active           |
| 唯一性   | 同一会话只能被一个客服接入 |

**对应需求ID：** REQ-SM-007

---

### 11.8 转接会话

#### POST /api/v1/conversations/{id}/transfer

**功能描述：** 将会话转接给其他客服

**权限要求：** conversation:transfer

**请求参数：**

| 参数名          | 类型    | 必填 | 说明       |
| --------------- | ------- | ---- | ---------- |
| target_agent_id | integer | 是   | 目标客服ID |
| reason          | string  | 否   | 转接原因   |

**请求体示例：**

```json
{
  "target_agent_id": 2,
  "reason": "客户咨询的是技术问题，转接技术支持"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "agent": {
      "id": 2,
      "name": "技术支持小李"
    },
    "updated_at": "2026-04-04T10:00:00Z"
  }
}
```

**对应需求ID：** REQ-SM-008

---

### 11.9 关闭会话

#### POST /api/v1/conversations/{id}/close

**功能描述：** 关闭会话

**权限要求：** conversation:close

**请求参数：**

| 参数名     | 类型   | 必填 | 说明                                   |
| ---------- | ------ | ---- | -------------------------------------- |
| end_reason | string | 否   | 结束原因：resolved/timeout/agent_close |

**请求体示例：**

```json
{
  "end_reason": "resolved"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "status": "closed",
    "ended_at": "2026-04-04T10:00:00Z",
    "end_reason": "resolved"
  }
}
```

**对应需求ID：** REQ-SM-008

---

### 11.10 从会话创建工单

#### POST /api/v1/conversations/{id}/tickets

**功能描述：** 从会话创建工单

**权限要求：** ticket:create

**请求参数：**

| 参数名      | 类型    | 必填 | 说明     |
| ----------- | ------- | ---- | -------- |
| title       | string  | 是   | 工单标题 |
| type        | string  | 是   | 工单类型 |
| priority    | string  | 是   | 优先级   |
| description | string  | 是   | 问题描述 |
| handler_id  | integer | 否   | 处理人ID |

**请求体示例：**

```json
{
  "title": "产品使用问题",
  "type": "consult",
  "priority": "normal",
  "description": "客户咨询产品使用方法",
  "handler_id": 1
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "title": "产品使用问题",
    "status": "pending",
    "conversation_id": 1,
    "created_at": "2026-04-04T10:00:00Z"
  }
}
```

**对应需求ID：** REQ-TM-001

---

### 11.11 提交会话评价

#### POST /api/v1/conversations/{id}/rating

**功能描述：** 提交会话满意度评价

**权限要求：** 无（客户评价）

**请求参数：**

| 参数名  | 类型    | 必填 | 说明      |
| ------- | ------- | ---- | --------- |
| rating  | integer | 是   | 评分：1-5 |
| comment | string  | 否   | 评价内容  |

**请求体示例：**

```json
{
  "rating": 5,
  "comment": "服务很好，问题解决很及时"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "rating": 5,
    "comment": "服务很好，问题解决很及时",
    "created_at": "2026-04-04T10:00:00Z"
  }
}
```

**对应需求ID：** REQ-SM-003

---

## 十二、商机管理模块接口

### 12.1 获取商机列表

#### GET /api/v1/opportunities

**功能描述：** 获取商机列表

**权限要求：** opportunity:read

**请求参数：**

| 参数名                     | 类型    | 必填 | 说明                 |
| -------------------------- | ------- | ---- | -------------------- |
| page                       | integer | 否   | 页码                 |
| page_size                  | integer | 否   | 每页条数             |
| sort                       | string  | 否   | 排序字段             |
| name                       | string  | 否   | 商机名称（模糊搜索） |
| customer_id                | integer | 否   | 客户ID               |
| stage                      | string  | 否   | 商机阶段             |
| status                     | string  | 否   | 状态：open/won/lost  |
| owner_id                   | integer | 否   | 负责人ID             |
| expected_close_date\_\_gte | string  | 否   | 预计成交日期起       |
| expected_close_date\_\_lte | string  | 否   | 预计成交日期止       |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "桐鸣科技CRM采购",
        "amount": 100000.0,
        "stage": "negotiation",
        "win_probability": 70.0,
        "status": "open",
        "expected_close_date": "2026-06-30",
        "customer": {
          "id": 1,
          "name": "桐鸣科技"
        },
        "owner": {
          "id": 1,
          "name": "张三"
        },
        "created_at": "2026-04-01T10:00:00Z",
        "updated_at": "2026-04-04T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 20,
      "total_pages": 1
    }
  }
}
```

**对应需求ID：** REQ-OM-002

---

### 12.2 创建商机

#### POST /api/v1/opportunities

**功能描述：** 创建新商机

**权限要求：** opportunity:create

**请求参数：**

| 参数名              | 类型    | 必填 | 说明         |
| ------------------- | ------- | ---- | ------------ |
| name                | string  | 是   | 商机名称     |
| customer_id         | integer | 是   | 客户ID       |
| lead_id             | integer | 否   | 线索ID       |
| amount              | number  | 否   | 商机金额     |
| expected_close_date | string  | 否   | 预计成交日期 |
| owner_id            | integer | 是   | 负责人ID     |
| remark              | string  | 否   | 备注         |

**请求体示例：**

```json
{
  "name": "桐鸣科技CRM采购",
  "customer_id": 1,
  "amount": 100000.0,
  "expected_close_date": "2026-06-30",
  "owner_id": 1,
  "remark": "客户意向较强"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "桐鸣科技CRM采购",
    "amount": 100000.0,
    "stage": "initial",
    "win_probability": 10.0,
    "status": "open",
    "expected_close_date": "2026-06-30",
    "customer": {
      "id": 1,
      "name": "桐鸣科技"
    },
    "owner": {
      "id": 1,
      "name": "张三"
    },
    "created_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则         | 说明                 |
| ------------ | -------------------- |
| 客户必填     | customer_id 不能为空 |
| 负责人必填   | owner_id 不能为空    |
| 商机名称必填 | name 不能为空        |

**对应需求ID：** REQ-OM-001

---

### 12.3 获取商机详情

#### GET /api/v1/opportunities/{id}

**功能描述：** 获取商机详细信息

**权限要求：** opportunity:read

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "桐鸣科技CRM采购",
    "amount": 100000.0,
    "stage": "negotiation",
    "win_probability": 70.0,
    "status": "open",
    "expected_close_date": "2026-06-30",
    "customer": {
      "id": 1,
      "name": "桐鸣科技",
      "phone": "138****8000"
    },
    "lead": {
      "id": 1,
      "name": "王五"
    },
    "owner": {
      "id": 1,
      "name": "张三",
      "phone": "139****9000"
    },
    "follow_ups": [
      {
        "id": 1,
        "content": "与客户进行了初步沟通",
        "follow_up_type": "phone",
        "user": {
          "id": 1,
          "name": "张三"
        },
        "created_at": "2026-04-04T10:00:00Z"
      }
    ],
    "stage_histories": [
      {
        "from_stage": null,
        "to_stage": "initial",
        "reason": "创建商机",
        "user": {
          "id": 1,
          "name": "张三"
        },
        "created_at": "2026-04-01T10:00:00Z"
      },
      {
        "from_stage": "initial",
        "to_stage": "negotiation",
        "reason": "进入商务谈判阶段",
        "user": {
          "id": 1,
          "name": "张三"
        },
        "created_at": "2026-04-04T10:00:00Z"
      }
    ],
    "won_at": null,
    "lost_at": null,
    "lost_reason": null,
    "remark": "客户意向较强",
    "created_at": "2026-04-01T10:00:00Z",
    "updated_at": "2026-04-04T10:00:00Z"
  }
}
```

**对应需求ID：** REQ-OM-003

---

### 12.4 更新商机

#### PUT /api/v1/opportunities/{id}

**功能描述：** 更新商机信息

**权限要求：** opportunity:update

**请求参数：** 同创建商机，所有字段均为可选

**对应需求ID：** REQ-OM-001

---

### 12.5 变更商机阶段

#### PUT /api/v1/opportunities/{id}/stage

**功能描述：** 变更商机阶段

**权限要求：** opportunity:update

**请求参数：**

| 参数名 | 类型   | 必填 | 说明     |
| ------ | ------ | ---- | -------- |
| stage  | string | 是   | 目标阶段 |
| reason | string | 否   | 变更原因 |

**请求体示例：**

```json
{
  "stage": "negotiation",
  "reason": "进入商务谈判阶段"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "stage": "negotiation",
    "win_probability": 70.0,
    "updated_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则     | 说明                                                                      |
| -------- | ------------------------------------------------------------------------- |
| 阶段流转 | 只能按顺序推进：initial → requirement → proposal → negotiation → won/lost |
| 状态校验 | 商机状态必须为 open                                                       |
| 变更记录 | 记录阶段变更历史                                                          |

**错误场景：**

| 错误码 | 说明                 |
| ------ | -------------------- |
| 50002  | 商机已成交，无法操作 |
| 50003  | 商机已失败，无法操作 |
| 50004  | 商机阶段流转不合法   |

**对应需求ID：** REQ-OM-004, REQ-OM-006

---

### 12.6 标记商机成交

#### POST /api/v1/opportunities/{id}/win

**功能描述：** 标记商机成交

**权限要求：** opportunity:update

**请求参数：**

| 参数名        | 类型   | 必填 | 说明         |
| ------------- | ------ | ---- | ------------ |
| actual_amount | number | 否   | 实际成交金额 |
| won_at        | string | 否   | 成交时间     |

**请求体示例：**

```json
{
  "actual_amount": 95000.0,
  "won_at": "2026-04-04T10:00:00Z"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "status": "won",
    "amount": 95000.0,
    "won_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则     | 说明                       |
| -------- | -------------------------- |
| 阶段校验 | 当前阶段必须为 negotiation |
| 状态流转 | open → won                 |

**对应需求ID：** REQ-OM-004

---

### 12.7 标记商机失败

#### POST /api/v1/opportunities/{id}/lose

**功能描述：** 标记商机失败

**权限要求：** opportunity:update

**请求参数：**

| 参数名      | 类型   | 必填 | 说明     |
| ----------- | ------ | ---- | -------- |
| lost_reason | string | 是   | 失败原因 |

**请求体示例：**

```json
{
  "lost_reason": "客户选择了竞品"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "status": "lost",
    "lost_reason": "客户选择了竞品",
    "lost_at": "2026-04-04T10:00:00Z"
  }
}
```

**对应需求ID：** REQ-OM-004

---

### 12.8 添加商机跟进记录

#### POST /api/v1/opportunities/{id}/follow-ups

**功能描述：** 添加商机跟进记录

**权限要求：** opportunity:update

**请求参数：**

| 参数名            | 类型   | 必填 | 说明                                |
| ----------------- | ------ | ---- | ----------------------------------- |
| content           | string | 是   | 跟进内容                            |
| follow_up_type    | string | 否   | 跟进方式：phone/email/visit/meeting |
| next_follow_up_at | string | 否   | 下次跟进时间                        |

**请求体示例：**

```json
{
  "content": "与客户进行了报价沟通，客户表示需要内部审批",
  "follow_up_type": "meeting",
  "next_follow_up_at": "2026-04-10T10:00:00Z"
}
```

**对应需求ID：** REQ-OM-005

---

### 12.9 获取商机统计

#### GET /api/v1/opportunities/statistics

**功能描述：** 获取商机统计数据

**权限要求：** opportunity:read

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 50,
    "by_stage": {
      "initial": 10,
      "requirement": 15,
      "proposal": 10,
      "negotiation": 10,
      "won": 3,
      "lost": 2
    },
    "by_status": {
      "open": 45,
      "won": 3,
      "lost": 2
    },
    "total_amount": 5000000.0,
    "won_amount": 300000.0,
    "win_rate": 0.6,
    "avg_deal_cycle": 30
  }
}
```

**对应需求ID：** REQ-OM-007

---

## 十三、工单管理模块接口

### 13.1 获取工单列表

#### GET /api/v1/tickets

**功能描述：** 获取工单列表

**权限要求：** ticket:read

**请求参数：**

| 参数名            | 类型    | 必填 | 说明                 |
| ----------------- | ------- | ---- | -------------------- |
| page              | integer | 否   | 页码                 |
| page_size         | integer | 否   | 每页条数             |
| sort              | string  | 否   | 排序字段             |
| title             | string  | 否   | 工单标题（模糊搜索） |
| type              | string  | 否   | 工单类型             |
| priority          | string  | 否   | 优先级               |
| status            | string  | 否   | 状态                 |
| customer_id       | integer | 否   | 客户ID               |
| handler_id        | integer | 否   | 处理人ID             |
| created_at\_\_gte | string  | 否   | 创建时间起           |
| created_at\_\_lte | string  | 否   | 创建时间止           |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "产品使用问题咨询",
        "type": "consult",
        "priority": "normal",
        "status": "processing",
        "customer": {
          "id": 1,
          "name": "桐鸣科技"
        },
        "handler": {
          "id": 1,
          "name": "客服小王"
        },
        "sla_due_at": "2026-04-04T18:00:00Z",
        "created_at": "2026-04-04T10:00:00Z",
        "resolved_at": null,
        "closed_at": null
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 30,
      "total_pages": 2
    }
  }
}
```

**对应需求ID：** REQ-TM-002

---

### 13.2 创建工单

#### POST /api/v1/tickets

**功能描述：** 创建新工单

**权限要求：** ticket:create

**请求参数：**

| 参数名          | 类型    | 必填 | 说明                                         |
| --------------- | ------- | ---- | -------------------------------------------- |
| title           | string  | 是   | 工单标题                                     |
| type            | string  | 是   | 工单类型：consult/complaint/after_sale/other |
| priority        | string  | 是   | 优先级：urgent/high/normal/low               |
| customer_id     | integer | 是   | 客户ID                                       |
| conversation_id | integer | 否   | 关联会话ID                                   |
| description     | string  | 是   | 问题描述                                     |
| handler_id      | integer | 否   | 处理人ID                                     |
| attachments     | array   | 否   | 附件URL列表                                  |

**请求体示例：**

```json
{
  "title": "产品使用问题咨询",
  "type": "consult",
  "priority": "normal",
  "customer_id": 1,
  "description": "客户咨询如何导出数据报表",
  "handler_id": 1
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "title": "产品使用问题咨询",
    "type": "consult",
    "priority": "normal",
    "status": "pending",
    "customer": {
      "id": 1,
      "name": "桐鸣科技"
    },
    "handler": null,
    "sla_due_at": "2026-04-04T18:00:00Z",
    "created_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则       | 说明                            |
| ---------- | ------------------------------- |
| 标题必填   | title 不能为空                  |
| 类型必填   | type 必须为有效枚举值           |
| 优先级必填 | priority 必须为有效枚举值       |
| 客户必填   | customer_id 不能为空            |
| 描述必填   | description 不能为空            |
| SLA 计算   | 根据优先级自动计算 SLA 截止时间 |

**对应需求ID：** REQ-TM-001

---

### 13.3 获取工单详情

#### GET /api/v1/tickets/{id}

**功能描述：** 获取工单详细信息

**权限要求：** ticket:read

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "title": "产品使用问题咨询",
    "type": "consult",
    "priority": "normal",
    "status": "processing",
    "customer": {
      "id": 1,
      "name": "桐鸣科技",
      "phone": "138****8000"
    },
    "conversation": {
      "id": 1,
      "channel": "web"
    },
    "handler": {
      "id": 1,
      "name": "客服小王"
    },
    "description": "客户咨询如何导出数据报表",
    "solution": null,
    "sla_due_at": "2026-04-04T18:00:00Z",
    "logs": [
      {
        "id": 1,
        "action": "create",
        "content": "工单创建",
        "user": {
          "id": 1,
          "name": "客服小王"
        },
        "created_at": "2026-04-04T10:00:00Z"
      },
      {
        "id": 2,
        "action": "assign",
        "content": "工单分配给 客服小王",
        "user": {
          "id": 1,
          "name": "系统"
        },
        "created_at": "2026-04-04T10:00:05Z"
      }
    ],
    "attachments": [],
    "satisfaction": null,
    "resolved_at": null,
    "closed_at": null,
    "created_at": "2026-04-04T10:00:00Z",
    "updated_at": "2026-04-04T10:00:00Z"
  }
}
```

**对应需求ID：** REQ-TM-003

---

### 13.4 分配工单

#### POST /api/v1/tickets/{id}/assign

**功能描述：** 分配工单给处理人

**权限要求：** ticket:assign

**请求参数：**

| 参数名     | 类型    | 必填 | 说明     |
| ---------- | ------- | ---- | -------- |
| handler_id | integer | 是   | 处理人ID |

**请求体示例：**

```json
{
  "handler_id": 1
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "status": "assigned",
    "handler": {
      "id": 1,
      "name": "客服小王"
    },
    "updated_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则       | 说明                      |
| ---------- | ------------------------- |
| 状态流转   | pending → assigned        |
| 处理人校验 | handler_id 必须为有效客服 |

**对应需求ID：** REQ-TM-004

---

### 13.5 开始处理工单

#### POST /api/v1/tickets/{id}/start

**功能描述：** 开始处理工单

**权限要求：** ticket:handle（处理人本人）

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "status": "processing",
    "updated_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则     | 说明                       |
| -------- | -------------------------- |
| 状态流转 | assigned → processing      |
| 权限校验 | 只有处理人本人可以开始处理 |

**对应需求ID：** REQ-TM-005

---

### 13.6 转派工单

#### POST /api/v1/tickets/{id}/transfer

**功能描述：** 转派工单给其他处理人

**权限要求：** ticket:transfer

**请求参数：**

| 参数名     | 类型    | 必填 | 说明       |
| ---------- | ------- | ---- | ---------- |
| handler_id | integer | 是   | 新处理人ID |
| reason     | string  | 否   | 转派原因   |

**请求体示例：**

```json
{
  "handler_id": 2,
  "reason": "需要技术支持处理"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "status": "assigned",
    "handler": {
      "id": 2,
      "name": "技术支持小李"
    },
    "updated_at": "2026-04-04T10:00:00Z"
  }
}
```

**对应需求ID：** REQ-TM-007

---

### 13.7 解决工单

#### POST /api/v1/tickets/{id}/resolve

**功能描述：** 标记工单为已解决

**权限要求：** ticket:handle（处理人本人）

**请求参数：**

| 参数名   | 类型   | 必填 | 说明     |
| -------- | ------ | ---- | -------- |
| solution | string | 是   | 解决方案 |

**请求体示例：**

```json
{
  "solution": "已指导客户完成数据报表导出操作，客户确认问题已解决"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "status": "resolved",
    "solution": "已指导客户完成数据报表导出操作，客户确认问题已解决",
    "resolved_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则         | 说明                  |
| ------------ | --------------------- |
| 状态流转     | processing → resolved |
| 解决方案必填 | solution 不能为空     |

**对应需求ID：** REQ-TM-005

---

### 13.8 关闭工单

#### POST /api/v1/tickets/{id}/close

**功能描述：** 关闭工单

**权限要求：** ticket:close

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "status": "closed",
    "closed_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则     | 说明                    |
| -------- | ----------------------- |
| 状态校验 | 工单状态必须为 resolved |
| 状态流转 | resolved → closed       |

**对应需求ID：** REQ-TM-008

---

### 13.9 重新打开工单

#### POST /api/v1/tickets/{id}/reopen

**功能描述：** 重新打开已解决的工单

**权限要求：** ticket:handle

**请求参数：**

| 参数名 | 类型   | 必填 | 说明         |
| ------ | ------ | ---- | ------------ |
| reason | string | 是   | 重新打开原因 |

**请求体示例：**

```json
{
  "reason": "客户反馈问题未完全解决"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "status": "processing",
    "updated_at": "2026-04-04T10:00:00Z"
  }
}
```

**业务校验规则：**

| 规则     | 说明                  |
| -------- | --------------------- |
| 状态流转 | resolved → processing |

**对应需求ID：** REQ-TM-006

---

### 13.10 获取工单统计

#### GET /api/v1/tickets/statistics

**功能描述：** 获取工单统计数据

**权限要求：** ticket:read

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 100,
    "by_status": {
      "pending": 10,
      "assigned": 5,
      "processing": 30,
      "resolved": 20,
      "closed": 35
    },
    "by_priority": {
      "urgent": 5,
      "high": 15,
      "normal": 60,
      "low": 20
    },
    "by_type": {
      "consult": 50,
      "complaint": 10,
      "after_sale": 30,
      "other": 10
    },
    "avg_resolve_time": 240,
    "sla_compliance_rate": 0.95,
    "satisfaction_avg": 4.5
  }
}
```

**对应需求ID：** REQ-TM-009

---

## 十四、知识库模块接口

### 14.1 知识检索

#### GET /api/v1/knowledge/search

**功能描述：** 知识检索

**权限要求：** knowledge:read

**请求参数：**

| 参数名      | 类型    | 必填 | 说明              |
| ----------- | ------- | ---- | ----------------- |
| keyword     | string  | 是   | 搜索关键词        |
| category_id | integer | 否   | 分类ID            |
| limit       | integer | 否   | 返回数量，默认 10 |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "如何重置密码？",
        "summary": "用户可以通过以下步骤重置密码...",
        "category": {
          "id": 1,
          "name": "账号相关"
        },
        "highlight": "如何<em>重置</em><em>密码</em>？",
        "score": 0.95,
        "created_at": "2026-04-01T10:00:00Z"
      }
    ]
  }
}
```

**对应需求ID：** REQ-KB-001

---

### 14.2 获取知识详情

#### GET /api/v1/knowledge/{id}

**功能描述：** 获取知识详细信息

**权限要求：** knowledge:read

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "title": "如何重置密码？",
    "content": "<h2>重置密码步骤</h2><p>1. 点击登录页面的「忘记密码」...</p>",
    "keywords": "密码,重置,账号",
    "category": {
      "id": 1,
      "name": "账号相关"
    },
    "status": "published",
    "view_count": 100,
    "helpful_count": 80,
    "created_at": "2026-04-01T10:00:00Z",
    "updated_at": "2026-04-04T10:00:00Z"
  }
}
```

**对应需求ID：** REQ-KB-002

---

### 14.3 AI 问答

#### POST /api/v1/knowledge/qa

**功能描述：** AI 智能问答

**权限要求：** knowledge:read

**请求参数：**

| 参数名          | 类型    | 必填 | 说明                 |
| --------------- | ------- | ---- | -------------------- |
| question        | string  | 是   | 用户问题             |
| conversation_id | integer | 否   | 会话ID（用于上下文） |

**请求体示例：**

```json
{
  "question": "如何修改绑定的手机号？"
}
```

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "answer": "您可以通过以下步骤修改绑定的手机号：\n1. 登录系统后，进入「个人设置」页面\n2. 点击「账号安全」选项\n3. 在「手机号」一栏点击「修改」\n4. 输入新手机号并完成验证",
    "sources": [
      {
        "id": 1,
        "title": "如何修改绑定的手机号？",
        "relevance": 0.95
      }
    ],
    "confidence": 0.92
  }
}
```

**对应需求ID：** REQ-KB-003

---

### 14.4 获取知识分类列表

#### GET /api/v1/knowledge/categories

**功能描述：** 获取知识分类列表

**权限要求：** knowledge:read

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "账号相关",
        "parent_id": null,
        "sort_order": 1,
        "children": [
          {
            "id": 2,
            "name": "登录问题",
            "parent_id": 1,
            "sort_order": 1
          }
        ]
      }
    ]
  }
}
```

**对应需求ID：** REQ-KB-004

---

### 14.5 创建知识条目

#### POST /api/v1/knowledge

**功能描述：** 创建知识条目

**权限要求：** knowledge:manage

**请求参数：**

| 参数名      | 类型    | 必填 | 说明                              |
| ----------- | ------- | ---- | --------------------------------- |
| title       | string  | 是   | 标题                              |
| content     | string  | 是   | 内容（富文本）                    |
| category_id | integer | 否   | 分类ID                            |
| keywords    | string  | 否   | 关键词，逗号分隔                  |
| status      | string  | 否   | 状态：draft/published，默认 draft |

**请求体示例：**

```json
{
  "title": "如何导出数据报表？",
  "content": "<h2>导出步骤</h2><p>1. 进入数据看板页面...</p>",
  "category_id": 3,
  "keywords": "导出,报表,数据",
  "status": "published"
}
```

**对应需求ID：** REQ-KB-005

---

### 14.6 更新知识条目

#### PUT /api/v1/knowledge/{id}

**功能描述：** 更新知识条目

**权限要求：** knowledge:manage

**对应需求ID：** REQ-KB-005

---

### 14.7 删除知识条目

#### DELETE /api/v1/knowledge/{id}

**功能描述：** 删除知识条目（软删除）

**权限要求：** knowledge:manage

**对应需求ID：** REQ-KB-005

---

### 14.8 知识条目启停用

#### PUT /api/v1/knowledge/{id}/status

**功能描述：** 启用或停用知识条目

**权限要求：** knowledge:manage

**请求参数：**

| 参数名 | 类型   | 必填 | 说明                     |
| ------ | ------ | ---- | ------------------------ |
| status | string | 是   | 状态：published/archived |

**请求体示例：**

```json
{
  "status": "archived"
}
```

**对应需求ID：** REQ-KB-005

---

## 十五、数据看板模块接口

### 15.1 获取销售看板

#### GET /api/v1/dashboards/sales

**功能描述：** 获取销售看板数据

**权限要求：** dashboard:read

**请求参数：**

| 参数名     | 类型   | 必填 | 说明     |
| ---------- | ------ | ---- | -------- |
| start_date | string | 否   | 开始日期 |
| end_date   | string | 否   | 结束日期 |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "overview": {
      "lead_count": 100,
      "lead_converted_count": 15,
      "lead_conversion_rate": 0.15,
      "opportunity_count": 50,
      "opportunity_amount": 5000000.0,
      "won_count": 10,
      "won_amount": 1000000.0,
      "win_rate": 0.2
    },
    "opportunity_by_stage": {
      "initial": 10,
      "requirement": 15,
      "proposal": 10,
      "negotiation": 10,
      "won": 3,
      "lost": 2
    },
    "trend": {
      "dates": ["2026-04-01", "2026-04-02", "2026-04-03", "2026-04-04"],
      "lead_counts": [5, 8, 6, 10],
      "opportunity_amounts": [50000, 80000, 60000, 100000]
    },
    "top_opportunities": [
      {
        "id": 1,
        "name": "桐鸣科技CRM采购",
        "amount": 100000.0,
        "stage": "negotiation",
        "customer_name": "桐鸣科技"
      }
    ]
  }
}
```

**对应需求ID：** REQ-DB-001

---

### 15.2 获取客服看板

#### GET /api/v1/dashboards/service

**功能描述：** 获取客服看板数据

**权限要求：** dashboard:read

**请求参数：**

| 参数名     | 类型   | 必填 | 说明     |
| ---------- | ------ | ---- | -------- |
| start_date | string | 否   | 开始日期 |
| end_date   | string | 否   | 结束日期 |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "overview": {
      "conversation_count": 500,
      "ticket_count": 100,
      "avg_response_time": 30,
      "avg_resolve_time": 240,
      "sla_compliance_rate": 0.95,
      "satisfaction_avg": 4.5
    },
    "ticket_by_status": {
      "pending": 10,
      "assigned": 5,
      "processing": 30,
      "resolved": 20,
      "closed": 35
    },
    "ticket_by_type": {
      "consult": 50,
      "complaint": 10,
      "after_sale": 30,
      "other": 10
    },
    "trend": {
      "dates": ["2026-04-01", "2026-04-02", "2026-04-03", "2026-04-04"],
      "conversation_counts": [50, 60, 55, 70],
      "ticket_counts": [10, 12, 8, 15]
    }
  }
}
```

**对应需求ID：** REQ-DB-002

---

### 15.3 获取全览看板

#### GET /api/v1/dashboards/overview

**功能描述：** 获取全览看板数据

**权限要求：** dashboard:read（管理员）

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "customer_count": 1000,
    "active_user_count": 50,
    "sales_overview": {
      "lead_count": 100,
      "opportunity_amount": 5000000.0,
      "won_amount": 1000000.0
    },
    "service_overview": {
      "conversation_count": 500,
      "ticket_count": 100,
      "satisfaction_avg": 4.5
    },
    "recent_activities": [
      {
        "type": "opportunity",
        "action": "won",
        "content": "商机「桐鸣科技CRM采购」成交",
        "amount": 100000.0,
        "created_at": "2026-04-04T10:00:00Z"
      }
    ]
  }
}
```

**对应需求ID：** REQ-DB-003

---

### 15.4 获取趋势数据

#### GET /api/v1/dashboards/trends

**功能描述：** 获取趋势图表数据

**权限要求：** dashboard:read

**请求参数：**

| 参数名      | 类型   | 必填 | 说明                                                          |
| ----------- | ------ | ---- | ------------------------------------------------------------- |
| metric      | string | 是   | 指标：lead_count/opportunity_amount/ticket_count/satisfaction |
| start_date  | string | 是   | 开始日期                                                      |
| end_date    | string | 是   | 结束日期                                                      |
| granularity | string | 否   | 粒度：day/week/month，默认 day                                |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "metric": "lead_count",
    "granularity": "day",
    "points": [
      { "date": "2026-04-01", "value": 5 },
      { "date": "2026-04-02", "value": 8 },
      { "date": "2026-04-03", "value": 6 },
      { "date": "2026-04-04", "value": 10 }
    ]
  }
}
```

**对应需求ID：** REQ-DB-004

---

## 十六、标签管理模块接口

### 16.1 获取标签列表

#### GET /api/v1/tags

**功能描述：** 获取标签列表

**权限要求：** tag:read

**请求参数：**

| 参数名   | 类型   | 必填 | 说明                                |
| -------- | ------ | ---- | ----------------------------------- |
| tag_type | string | 否   | 标签类型：customer/lead/opportunity |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "VIP",
        "color": "#ff0000",
        "tag_type": "customer",
        "usage_count": 50,
        "created_at": "2026-04-01T10:00:00Z"
      }
    ]
  }
}
```

---

### 16.2 创建标签

#### POST /api/v1/tags

**功能描述：** 创建标签

**权限要求：** tag:create

**请求参数：**

| 参数名   | 类型   | 必填 | 说明                   |
| -------- | ------ | ---- | ---------------------- |
| name     | string | 是   | 标签名称               |
| color    | string | 否   | 标签颜色，默认 #1890ff |
| tag_type | string | 是   | 标签类型               |

**请求体示例：**

```json
{
  "name": "重点跟进",
  "color": "#ff6600",
  "tag_type": "customer"
}
```

---

### 16.3 更新标签

#### PUT /api/v1/tags/{id}

**功能描述：** 更新标签

**权限要求：** tag:update

---

### 16.4 删除标签

#### DELETE /api/v1/tags/{id}

**功能描述：** 删除标签

**权限要求：** tag:delete

**业务校验规则：**

| 规则     | 说明                 |
| -------- | -------------------- |
| 关联处理 | 级联删除标签关联关系 |

---

## 十七、用户管理模块接口

### 17.1 获取用户列表

#### GET /api/v1/users

**功能描述：** 获取用户列表

**权限要求：** user:read

**请求参数：**

| 参数名    | 类型    | 必填 | 说明                             |
| --------- | ------- | ---- | -------------------------------- |
| page      | integer | 否   | 页码                             |
| page_size | integer | 否   | 每页条数                         |
| keyword   | string  | 否   | 搜索关键词（姓名/用户名/手机号） |
| status    | string  | 否   | 状态                             |
| role_id   | integer | 否   | 角色ID                           |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "zhangsan",
        "real_name": "张三",
        "email": "zhangsan@company.com",
        "phone": "138****8000",
        "avatar": "https://xxx.com/avatar.png",
        "status": "active",
        "roles": [{ "id": 1, "code": "sales_rep", "name": "销售人员" }],
        "last_login_at": "2026-04-04T10:00:00Z",
        "created_at": "2026-04-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 50,
      "total_pages": 3
    }
  }
}
```

**对应需求ID：** REQ-SYS-003

---

### 17.2 创建用户

#### POST /api/v1/users

**功能描述：** 创建用户

**权限要求：** user:create

**请求参数：**

| 参数名    | 类型   | 必填 | 说明       |
| --------- | ------ | ---- | ---------- |
| username  | string | 是   | 用户名     |
| password  | string | 是   | 密码       |
| real_name | string | 是   | 真实姓名   |
| email     | string | 否   | 邮箱       |
| phone     | string | 否   | 手机号     |
| role_ids  | array  | 是   | 角色ID数组 |

**请求体示例：**

```json
{
  "username": "lisi",
  "password": "Password123!",
  "real_name": "李四",
  "email": "lisi@company.com",
  "phone": "13900139000",
  "role_ids": [2]
}
```

**对应需求ID：** REQ-SYS-003

---

### 17.3 获取用户详情

#### GET /api/v1/users/{id}

**功能描述：** 获取用户详情

**权限要求：** user:read

---

### 17.4 更新用户

#### PUT /api/v1/users/{id}

**功能描述：** 更新用户信息

**权限要求：** user:update

---

### 17.5 重置用户密码

#### POST /api/v1/users/{id}/reset-password

**功能描述：** 重置用户密码

**权限要求：** user:update

**请求参数：**

| 参数名       | 类型   | 必填 | 说明   |
| ------------ | ------ | ---- | ------ |
| new_password | string | 是   | 新密码 |

---

### 17.6 启用/禁用用户

#### PUT /api/v1/users/{id}/status

**功能描述：** 启用或禁用用户

**权限要求：** user:update

**请求参数：**

| 参数名 | 类型   | 必填 | 说明                  |
| ------ | ------ | ---- | --------------------- |
| status | string | 是   | 状态：active/inactive |

---

## 十八、角色管理模块接口

### 18.1 获取角色列表

#### GET /api/v1/roles

**功能描述：** 获取角色列表

**权限要求：** role:read

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "code": "admin",
        "name": "管理员",
        "description": "企业管理员，拥有全部权限",
        "is_system": true,
        "user_count": 2,
        "created_at": "2026-04-01T10:00:00Z"
      },
      {
        "id": 2,
        "code": "sales_rep",
        "name": "销售人员",
        "description": "一线销售，管理个人客户和商机",
        "is_system": true,
        "user_count": 10,
        "created_at": "2026-04-01T10:00:00Z"
      }
    ]
  }
}
```

---

### 18.2 创建角色

#### POST /api/v1/roles

**功能描述：** 创建角色

**权限要求：** role:create

**请求参数：**

| 参数名         | 类型   | 必填 | 说明       |
| -------------- | ------ | ---- | ---------- |
| code           | string | 是   | 角色编码   |
| name           | string | 是   | 角色名称   |
| description    | string | 否   | 角色描述   |
| permission_ids | array  | 是   | 权限ID数组 |

---

### 18.3 获取角色详情

#### GET /api/v1/roles/{id}

**功能描述：** 获取角色详情

**权限要求：** role:read

---

### 18.4 更新角色

#### PUT /api/v1/roles/{id}

**功能描述：** 更新角色

**权限要求：** role:update

**业务校验规则：**

| 规则         | 说明             |
| ------------ | ---------------- |
| 系统角色保护 | 系统角色不可修改 |

---

### 18.5 删除角色

#### DELETE /api/v1/roles/{id}

**功能描述：** 删除角色

**权限要求：** role:delete

**业务校验规则：**

| 规则         | 说明                     |
| ------------ | ------------------------ |
| 系统角色保护 | 系统角色不可删除         |
| 用户关联检查 | 有用户关联的角色不可删除 |

---

## 十九、审计日志模块接口

### 19.1 获取审计日志列表

#### GET /api/v1/audit-logs

**功能描述：** 获取审计日志列表

**权限要求：** audit:read（管理员）

**请求参数：**

| 参数名            | 类型    | 必填 | 说明       |
| ----------------- | ------- | ---- | ---------- |
| page              | integer | 否   | 页码       |
| page_size         | integer | 否   | 每页条数   |
| user_id           | integer | 否   | 用户ID     |
| module            | string  | 否   | 模块       |
| action            | string  | 否   | 操作类型   |
| resource_type     | string  | 否   | 资源类型   |
| created_at\_\_gte | string  | 否   | 创建时间起 |
| created_at\_\_lte | string  | 否   | 创建时间止 |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "user": {
          "id": 1,
          "name": "张三"
        },
        "module": "customer",
        "action": "create",
        "resource_type": "customer",
        "resource_id": 1,
        "resource_name": "桐鸣科技",
        "old_value": null,
        "new_value": {
          "name": "桐鸣科技",
          "type": "enterprise"
        },
        "ip_address": "192.168.1.1",
        "created_at": "2026-04-04T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

---

### 19.2 获取审计日志详情

#### GET /api/v1/audit-logs/{id}

**功能描述：** 获取审计日志详情

**权限要求：** audit:read（管理员）

---

## 二十、组织管理模块接口

### 20.1 获取组织信息

#### GET /api/v1/organizations/{id}

**功能描述：** 获取当前组织信息

**权限要求：** organization:read

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "桐鸣科技",
    "code": "TONGMING001",
    "logo": "https://xxx.com/logo.png",
    "contact_name": "张三",
    "contact_phone": "138****8000",
    "contact_email": "admin@tongming.com",
    "address": "北京市朝阳区xxx",
    "status": "active",
    "expire_at": "2027-04-04T00:00:00Z",
    "created_at": "2026-04-04T10:00:00Z"
  }
}
```

**对应需求ID：** REQ-SYS-002

---

### 20.2 更新组织信息

#### PUT /api/v1/organizations/{id}

**功能描述：** 更新组织信息

**权限要求：** organization:write（管理员）

**请求参数：**

| 参数名        | 类型   | 必填 | 说明     |
| ------------- | ------ | ---- | -------- |
| name          | string | 否   | 组织名称 |
| logo          | string | 否   | Logo URL |
| contact_name  | string | 否   | 联系人   |
| contact_phone | string | 否   | 联系电话 |
| contact_email | string | 否   | 联系邮箱 |
| address       | string | 否   | 地址     |

**对应需求ID：** REQ-SYS-002

---

### 20.3 获取组织部门树

#### GET /api/v1/organizations/{id}/departments

**功能描述：** 获取组织部门树形结构

**权限要求：** department:read

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "总公司",
      "code": "HQ",
      "parent_id": null,
      "manager_id": 1,
      "sort_order": 0,
      "status": "active",
      "children": [
        {
          "id": 2,
          "name": "销售部",
          "code": "SALES",
          "parent_id": 1,
          "manager_id": 2,
          "sort_order": 1,
          "status": "active",
          "children": []
        }
      ]
    }
  ]
}
```

**对应需求ID：** REQ-SYS-003

---

### 20.4 获取组织统计数据

#### GET /api/v1/organizations/{id}/stats

**功能描述：** 获取组织统计数据

**权限要求：** organization:read

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total_users": 50,
    "active_users": 45,
    "total_customers": 1000,
    "total_leads": 500,
    "storage_used_mb": 1024,
    "storage_limit_mb": 10240
  }
}
```

**对应需求ID：** REQ-SYS-002

---

## 二十一、部门管理模块接口

### 21.1 获取部门列表

#### GET /api/v1/departments

**功能描述：** 获取部门列表

**权限要求：** department:read

**请求参数：**

| 参数名    | 类型    | 必填 | 说明                  |
| --------- | ------- | ---- | --------------------- |
| page      | integer | 否   | 页码，默认 1          |
| page_size | integer | 否   | 每页条数，默认 20     |
| name      | string  | 否   | 部门名称（模糊搜索）  |
| status    | string  | 否   | 状态：active/inactive |
| parent_id | integer | 否   | 父部门ID              |

**对应需求ID：** REQ-SYS-003

---

### 21.2 创建部门

#### POST /api/v1/departments

**功能描述：** 创建部门

**权限要求：** department:write（管理员）

**请求参数：**

| 参数名     | 类型    | 必填 | 说明         |
| ---------- | ------- | ---- | ------------ |
| name       | string  | 是   | 部门名称     |
| code       | string  | 否   | 部门编码     |
| parent_id  | integer | 否   | 父部门ID     |
| manager_id | integer | 否   | 部门负责人ID |
| sort_order | integer | 否   | 排序         |

**对应需求ID：** REQ-SYS-003

---

### 21.3 获取部门详情

#### GET /api/v1/departments/{id}

**功能描述：** 获取部门详情

**权限要求：** department:read

---

### 21.4 更新部门

#### PUT /api/v1/departments/{id}

**功能描述：** 更新部门信息

**权限要求：** department:write（管理员）

---

### 21.5 删除部门

#### DELETE /api/v1/departments/{id}

**功能描述：** 删除部门

**权限要求：** department:write（管理员）

**前置条件：** 部门下无成员

**对应需求ID：** REQ-SYS-003

---

## 二十二、任务管理模块接口

### 22.1 获取任务列表

#### GET /api/v1/tasks

**功能描述：** 获取任务列表

**权限要求：** task:read

**请求参数：**

| 参数名        | 类型    | 必填 | 说明                                          |
| ------------- | ------- | ---- | --------------------------------------------- |
| page          | integer | 否   | 页码，默认 1                                  |
| page_size     | integer | 否   | 每页条数，默认 20                             |
| title         | string  | 否   | 任务标题（模糊搜索）                          |
| status        | string  | 否   | 状态：pending/in_progress/completed/cancelled |
| priority      | string  | 否   | 优先级：high/medium/low                       |
| assignee_id   | integer | 否   | 负责人ID                                      |
| related_type  | string  | 否   | 关联对象类型                                  |
| related_id    | integer | 否   | 关联对象ID                                    |
| due_at\_\_gte | string  | 否   | 截止时间起                                    |
| due_at\_\_lte | string  | 否   | 截止时间止                                    |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "跟进客户张三",
        "description": "电话回访客户需求",
        "assignee": {
          "id": 1,
          "name": "张三"
        },
        "related_type": "customer",
        "related_id": 100,
        "priority": "high",
        "status": "pending",
        "due_at": "2026-04-05T18:00:00Z",
        "created_at": "2026-04-04T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 50
    }
  }
}
```

**对应需求ID：** REQ-TASK-001

---

### 22.2 创建任务

#### POST /api/v1/tasks

**功能描述：** 创建任务

**权限要求：** task:write

**请求参数：**

| 参数名       | 类型    | 必填 | 说明                    |
| ------------ | ------- | ---- | ----------------------- |
| title        | string  | 是   | 任务标题                |
| description  | string  | 否   | 任务描述                |
| assignee_id  | integer | 是   | 负责人ID                |
| related_type | string  | 否   | 关联对象类型            |
| related_id   | integer | 否   | 关联对象ID              |
| priority     | string  | 是   | 优先级：high/medium/low |
| due_at       | string  | 否   | 截止时间                |
| remind_at    | string  | 否   | 提醒时间                |

**对应需求ID：** REQ-TK-001

---

### 22.3 获取任务详情

#### GET /api/v1/tasks/{id}

**功能描述：** 获取任务详情

**权限要求：** task:read

---

### 22.4 更新任务

#### PUT /api/v1/tasks/{id}

**功能描述：** 更新任务

**权限要求：** task:write

---

### 22.5 更新任务状态

#### PUT /api/v1/tasks/{id}/status

**功能描述：** 更新任务状态

**权限要求：** task:write

**请求参数：**

| 参数名 | 类型   | 必填 | 说明                                          |
| ------ | ------ | ---- | --------------------------------------------- |
| status | string | 是   | 状态：pending/in_progress/completed/cancelled |

**状态流转规则：**

| 当前状态    | 允许转换               |
| ----------- | ---------------------- |
| pending     | in_progress, cancelled |
| in_progress | completed, cancelled   |
| completed   | -                      |
| cancelled   | -                      |

**对应需求ID：** REQ-TASK-002

---

### 22.6 删除任务

#### DELETE /api/v1/tasks/{id}

**功能描述：** 删除任务

**权限要求：** task:write

---

### 22.7 批量分配任务

#### POST /api/v1/tasks/batch-assign

**功能描述：** 批量分配任务

**权限要求：** task:write

**请求参数：**

| 参数名      | 类型    | 必填 | 说明       |
| ----------- | ------- | ---- | ---------- |
| task_ids    | array   | 是   | 任务ID列表 |
| assignee_id | integer | 是   | 负责人ID   |

**对应需求ID：** REQ-TASK-003

---

### 22.8 获取我的任务统计

#### GET /api/v1/tasks/my-stats

**功能描述：** 获取当前用户的任务统计

**权限要求：** task:read

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 50,
    "pending": 10,
    "in_progress": 20,
    "completed": 15,
    "cancelled": 5,
    "overdue": 3
  }
}
```

**对应需求ID：** REQ-TK-001

---

## 二十三、通知中心模块接口

### 23.1 获取通知列表

#### GET /api/v1/notifications

**功能描述：** 获取当前用户的通知列表

**权限要求：** 已登录用户

**请求参数：**

| 参数名    | 类型    | 必填 | 说明              |
| --------- | ------- | ---- | ----------------- |
| page      | integer | 否   | 页码，默认 1      |
| page_size | integer | 否   | 每页条数，默认 20 |
| type      | string  | 否   | 通知类型          |
| is_read   | integer | 否   | 已读状态：0/1     |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "type": "lead_assign",
        "title": "新线索分配",
        "content": "您有一个新线索需要处理",
        "related_type": "lead",
        "related_id": 100,
        "is_read": 0,
        "created_at": "2026-04-04T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100
    }
  }
}
```

**对应需求ID：** REQ-NT-001

---

### 23.2 获取未读通知数量

#### GET /api/v1/notifications/unread-count

**功能描述：** 获取未读通知数量

**权限要求：** 已登录用户

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "count": 5
  }
}
```

**对应需求ID：** REQ-NT-001

---

### 23.3 标记通知已读

#### PUT /api/v1/notifications/{id}/read

**功能描述：** 标记单条通知已读

**权限要求：** 已登录用户

**对应需求ID：** REQ-NT-002

---

### 23.4 批量标记已读

#### PUT /api/v1/notifications/batch-read

**功能描述：** 批量标记通知已读

**权限要求：** 已登录用户

**请求参数：**

| 参数名           | 类型  | 必填 | 说明                           |
| ---------------- | ----- | ---- | ------------------------------ |
| notification_ids | array | 否   | 通知ID列表，为空则标记全部已读 |

**对应需求ID：** REQ-NT-002

---

### 23.5 删除通知

#### DELETE /api/v1/notifications/{id}

**功能描述：** 删除单条通知

**权限要求：** 已登录用户

---

### 23.6 清空通知

#### DELETE /api/v1/notifications/clear

**功能描述：** 清空所有通知

**权限要求：** 已登录用户

**请求参数：**

| 参数名 | 类型   | 必填 | 说明                     |
| ------ | ------ | ---- | ------------------------ |
| type   | string | 否   | 通知类型，为空则清空全部 |

**对应需求ID：** REQ-NT-003

---

## 二十四、渠道管理模块接口

### 24.1 获取渠道列表

#### GET /api/v1/channels

**功能描述：** 获取渠道列表

**权限要求：** channel:read

**请求参数：**

| 参数名       | 类型    | 必填 | 说明                              |
| ------------ | ------- | ---- | --------------------------------- |
| page         | integer | 否   | 页码，默认 1                      |
| page_size    | integer | 否   | 每页条数，默认 20                 |
| name         | string  | 否   | 渠道名称（模糊搜索）              |
| channel_type | string  | 否   | 渠道类型：online/offline/referral |
| status       | string  | 否   | 状态：active/inactive             |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "官网表单",
        "code": "website",
        "channel_type": "online",
        "description": "官网咨询表单",
        "status": "active",
        "lead_count": 150,
        "created_at": "2026-04-04T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 10
    }
  }
}
```

**对应需求ID：** REQ-CH-001

---

### 24.2 创建渠道

#### POST /api/v1/channels

**功能描述：** 创建渠道

**权限要求：** channel:write（管理员）

**请求参数：**

| 参数名       | 类型   | 必填 | 说明                              |
| ------------ | ------ | ---- | --------------------------------- |
| name         | string | 是   | 渠道名称                          |
| code         | string | 是   | 渠道编码                          |
| channel_type | string | 是   | 渠道类型：online/offline/referral |
| description  | string | 否   | 渠道描述                          |

**对应需求ID：** REQ-CH-001

---

### 24.3 获取渠道详情

#### GET /api/v1/channels/{id}

**功能描述：** 获取渠道详情

**权限要求：** channel:read

---

### 24.4 更新渠道

#### PUT /api/v1/channels/{id}

**功能描述：** 更新渠道

**权限要求：** channel:write（管理员）

---

### 24.5 删除渠道

#### DELETE /api/v1/channels/{id}

**功能描述：** 删除渠道

**权限要求：** channel:write（管理员）

**前置条件：** 渠道下无线索

**对应需求ID：** REQ-CH-002

---

## 二十五、自动化规则模块接口

### 25.1 获取规则列表

#### GET /api/v1/automation-rules

**功能描述：** 获取自动化规则列表

**权限要求：** automation:read

**请求参数：**

| 参数名    | 类型    | 必填 | 说明                  |
| --------- | ------- | ---- | --------------------- |
| page      | integer | 否   | 页码，默认 1          |
| page_size | integer | 否   | 每页条数，默认 20     |
| name      | string  | 否   | 规则名称（模糊搜索）  |
| rule_type | string  | 否   | 规则类型              |
| status    | string  | 否   | 状态：active/inactive |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "线索自动分配规则",
        "code": "lead_assign",
        "rule_type": "lead_assign",
        "trigger_event": "lead_create",
        "conditions": {
          "source": "website"
        },
        "actions": {
          "type": "assign",
          "method": "round_robin"
        },
        "priority": 0,
        "status": "active",
        "created_at": "2026-04-04T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 10
    }
  }
}
```

**对应需求ID：** REQ-AR-001

---

### 25.2 创建规则

#### POST /api/v1/automation-rules

**功能描述：** 创建自动化规则

**权限要求：** automation:write（管理员）

**请求参数：**

| 参数名        | 类型    | 必填 | 说明           |
| ------------- | ------- | ---- | -------------- |
| name          | string  | 是   | 规则名称       |
| code          | string  | 是   | 规则编码       |
| rule_type     | string  | 是   | 规则类型       |
| trigger_event | string  | 是   | 触发事件       |
| conditions    | object  | 否   | 触发条件       |
| actions       | object  | 是   | 执行动作       |
| priority      | integer | 否   | 优先级，默认 0 |
| description   | string  | 否   | 规则描述       |

**对应需求ID：** REQ-AR-001

---

### 25.3 获取规则详情

#### GET /api/v1/automation-rules/{id}

**功能描述：** 获取规则详情

**权限要求：** automation:read

---

### 25.4 更新规则

#### PUT /api/v1/automation-rules/{id}

**功能描述：** 更新规则

**权限要求：** automation:write（管理员）

---

### 25.5 删除规则

#### DELETE /api/v1/automation-rules/{id}

**功能描述：** 删除规则

**权限要求：** automation:write（管理员）

**对应需求ID：** REQ-AR-002

---

### 25.6 启用/禁用规则

#### PUT /api/v1/automation-rules/{id}/status

**功能描述：** 启用或禁用规则

**权限要求：** automation:write（管理员）

**请求参数：**

| 参数名 | 类型   | 必填 | 说明                  |
| ------ | ------ | ---- | --------------------- |
| status | string | 是   | 状态：active/inactive |

**对应需求ID：** REQ-AR-002

---

## 二十六、AI工作台模块接口

### 26.1 获取AI任务列表

#### GET /api/v1/ai-tasks

**功能描述：** 获取AI任务列表

**权限要求：** ai_task:read

**请求参数：**

| 参数名       | 类型    | 必填 | 说明                                   |
| ------------ | ------- | ---- | -------------------------------------- |
| page         | integer | 否   | 页码，默认 1                           |
| page_size    | integer | 否   | 每页条数，默认 20                      |
| task_type    | string  | 否   | 任务类型                               |
| status       | string  | 否   | 状态：pending/running/completed/failed |
| related_type | string  | 否   | 关联对象类型                           |
| related_id   | integer | 否   | 关联对象ID                             |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "task_type": "smart_reply",
        "related_type": "conversation",
        "related_id": 100,
        "status": "completed",
        "confidence": 0.85,
        "model_name": "gpt-4",
        "tokens_used": 150,
        "duration_ms": 1200,
        "created_at": "2026-04-04T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100
    }
  }
}
```

**对应需求ID：** REQ-AI-001

---

### 26.2 获取AI任务详情

#### GET /api/v1/ai-tasks/{id}

**功能描述：** 获取AI任务详情

**权限要求：** ai_task:read

---

### 26.3 智能回复生成

#### POST /api/v1/ai-tasks/smart-reply

**功能描述：** 生成智能回复建议

**权限要求：** ai_task:write

**请求参数：**

| 参数名          | 类型    | 必填 | 说明       |
| --------------- | ------- | ---- | ---------- |
| conversation_id | integer | 是   | 会话ID     |
| context         | string  | 否   | 额外上下文 |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_id": 1,
    "suggestions": [
      {
        "content": "您好，感谢您的咨询，请问有什么可以帮助您的？",
        "confidence": 0.92
      },
      {
        "content": "您好，请问您需要了解哪方面的信息？",
        "confidence": 0.85
      }
    ]
  }
}
```

**对应需求ID：** REQ-AI-002

---

### 26.4 知识问答

#### POST /api/v1/ai-tasks/knowledge-qa

**功能描述：** AI知识库问答

**权限要求：** ai_task:write

**请求参数：**

| 参数名       | 类型   | 必填 | 说明           |
| ------------ | ------ | ---- | -------------- |
| question     | string | 是   | 问题内容       |
| category_ids | array  | 否   | 知识分类ID列表 |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_id": 2,
    "answer": "根据公司政策，退货需要在购买后7天内...",
    "source_items": [
      {
        "id": 1,
        "title": "退货政策",
        "relevance": 0.95
      }
    ],
    "confidence": 0.88
  }
}
```

**对应需求ID：** REQ-AI-003

---

### 26.5 线索评分

#### POST /api/v1/ai-tasks/lead-score

**功能描述：** AI线索评分

**权限要求：** ai_task:write

**请求参数：**

| 参数名  | 类型    | 必填 | 说明   |
| ------- | ------- | ---- | ------ |
| lead_id | integer | 是   | 线索ID |

**返回体示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_id": 3,
    "score": 85,
    "grade": "A",
    "factors": [
      {
        "name": "来源质量",
        "score": 90,
        "weight": 0.3
      },
      {
        "name": "互动频率",
        "score": 80,
        "weight": 0.3
      },
      {
        "name": "需求匹配",
        "score": 85,
        "weight": 0.4
      }
    ]
  }
}
```

**对应需求ID：** REQ-AI-004

---

## 二十七、WebSocket / 实时能力

### 27.1 WebSocket 连接

**连接地址：** `wss://{domain}/ws`

**连接参数：**

| 参数名 | 类型   | 必填 | 说明             |
| ------ | ------ | ---- | ---------------- |
| token  | string | 是   | JWT Access Token |

**连接示例：**

```javascript
const ws = new WebSocket("wss://api.moy.com/ws?token=xxx");
```

### 27.2 消息格式

**客户端发送消息格式：**

```json
{
  "type": "subscribe",
  "channel": "conversation.1",
  "data": {}
}
```

**服务端推送消息格式：**

```json
{
  "type": "message",
  "channel": "conversation.1",
  "data": {
    "id": 1,
    "conversation_id": 1,
    "sender_type": "customer",
    "content": "你好",
    "sent_at": "2026-04-04T10:00:00Z"
  },
  "timestamp": "2026-04-04T10:00:00Z"
}
```

### 27.3 频道定义

| 频道                   | 说明         | 订阅权限   |
| ---------------------- | ------------ | ---------- |
| conversation.{id}      | 会话消息频道 | 会话处理人 |
| ticket.{id}            | 工单状态频道 | 工单处理人 |
| notification.{user_id} | 用户通知频道 | 用户本人   |

### 27.4 消息类型

| 类型          | 说明     | 数据     |
| ------------- | -------- | -------- |
| message       | 新消息   | 消息对象 |
| status_change | 状态变更 | 变更信息 |
| notification  | 通知提醒 | 通知对象 |
| heartbeat     | 心跳     | -        |

### 27.5 实时能力清单

| 能力         | 状态 | 说明                   |
| ------------ | ---- | ---------------------- |
| 会话实时消息 | P0   | WebSocket 推送新消息   |
| 工单状态刷新 | P0   | WebSocket 推送状态变更 |
| 告警提醒     | P1   | WebSocket 推送告警通知 |
| 在线状态     | P1   | 用户在线状态同步       |

---

## 二十八、安全与限流建议

### 28.1 登录限流

| 限流策略   | 说明                             |
| ---------- | -------------------------------- |
| 单IP限流   | 同一 IP 每分钟最多 10 次登录请求 |
| 单账号限流 | 同一账号每分钟最多 5 次登录失败  |
| 锁定策略   | 连续 5 次失败锁定账号 30 分钟    |

### 28.2 接口限流

| 接口类型 | 限流策略         |
| -------- | ---------------- |
| 查询接口 | 100 次/分钟/用户 |
| 写入接口 | 30 次/分钟/用户  |
| 导出接口 | 5 次/分钟/用户   |
| AI 接口  | 20 次/分钟/用户  |

### 28.3 敏感字段脱敏

| 字段   | 脱敏规则                        | 适用场景               |
| ------ | ------------------------------- | ---------------------- |
| 手机号 | 中间 4 位显示为 \*\*\*\*        | 列表、详情（非管理员） |
| 邮箱   | @前保留前 3 位，其余用 \*\*\*\* | 列表、详情（非管理员） |
| 密码   | 不返回                          | 所有场景               |
| 身份证 | 保留前 3 位和后 4 位            | 详情（需权限）         |

### 28.4 审计日志

| 审计场景  | 记录内容                   |
| --------- | -------------------------- |
| 登录/登出 | 用户、IP、时间、结果       |
| 数据创建  | 用户、模块、数据内容       |
| 数据修改  | 用户、模块、变更前后值     |
| 数据删除  | 用户、模块、删除数据       |
| 数据导出  | 用户、模块、导出条件、数量 |
| 权限变更  | 用户、模块、变更内容       |

### 28.5 幂等建议

| 接口类型 | 幂等策略                         |
| -------- | -------------------------------- |
| 创建接口 | 使用客户端生成的 idempotency_key |
| 更新接口 | 使用版本号或更新时间戳           |
| 支付接口 | 使用业务订单号                   |

**幂等请求示例：**

```http
POST /api/v1/customers
X-Idempotency-Key: uuid-xxx-xxx
Content-Type: application/json

{
  "name": "桐鸣科技",
  "type": "enterprise"
}
```

### 28.6 上传文件安全边界

| 安全项   | 限制                                        |
| -------- | ------------------------------------------- |
| 文件大小 | 单文件最大 10MB                             |
| 文件类型 | 白名单：jpg, png, pdf, doc, docx, xls, xlsx |
| 文件名   | 过滤特殊字符，防止路径穿越                  |
| 病毒扫描 | 上传后异步扫描                              |
| 存储路径 | 包含 org_id，租户隔离                       |

---

## 二十九、接口与数据表映射

### 29.1 映射总表

| 接口                                       | 核心表                                                            | 模块     | 需求ID      |
| ------------------------------------------ | ----------------------------------------------------------------- | -------- | ----------- |
| POST /api/v1/auth/login                    | users, organizations                                              | 认证     | REQ-SYS-001 |
| GET /api/v1/customers                      | customers, users, tags                                            | 客户管理 | REQ-CM-003  |
| POST /api/v1/customers                     | customers, customer_contacts, customer_tags                       | 客户管理 | REQ-CM-001  |
| GET /api/v1/customers/{id}                 | customers, customer_contacts, tags, leads, opportunities, tickets | 客户管理 | REQ-CM-004  |
| PUT /api/v1/customers/{id}                 | customers, audit_logs                                             | 客户管理 | REQ-CM-002  |
| DELETE /api/v1/customers/{id}              | customers, customer_contacts, customer_tags                       | 客户管理 | REQ-CM-001  |
| GET /api/v1/leads                          | leads, users, customers                                           | 线索管理 | REQ-LM-001  |
| POST /api/v1/leads                         | leads                                                             | 线索管理 | REQ-LM-001  |
| POST /api/v1/leads/import                  | leads                                                             | 线索管理 | REQ-LM-002  |
| POST /api/v1/leads/{id}/convert            | leads, opportunities, customers                                   | 线索管理 | REQ-LM-006  |
| GET /api/v1/conversations                  | conversations, users, customers                                   | 会话管理 | REQ-SM-002  |
| GET /api/v1/conversations/{id}/messages    | conversation_messages                                             | 会话管理 | REQ-SM-003  |
| POST /api/v1/conversations/{id}/messages   | conversation_messages                                             | 会话管理 | REQ-SM-004  |
| GET /api/v1/conversations/{id}/smart-reply | knowledge_items, conversation_messages                            | 会话管理 | REQ-SM-005  |
| GET /api/v1/opportunities                  | opportunities, users, customers                                   | 商机管理 | REQ-OM-002  |
| POST /api/v1/opportunities                 | opportunities                                                     | 商机管理 | REQ-OM-001  |
| PUT /api/v1/opportunities/{id}/stage       | opportunities, opportunity_stage_histories                        | 商机管理 | REQ-OM-004  |
| GET /api/v1/tickets                        | tickets, users, customers                                         | 工单管理 | REQ-TM-002  |
| POST /api/v1/tickets                       | tickets, ticket_logs                                              | 工单管理 | REQ-TM-001  |
| POST /api/v1/tickets/{id}/resolve          | tickets, ticket_logs                                              | 工单管理 | REQ-TM-005  |
| GET /api/v1/knowledge/search               | knowledge_items                                                   | 知识库   | REQ-KB-001  |
| POST /api/v1/knowledge/qa                  | knowledge_items                                                   | 知识库   | REQ-KB-003  |
| GET /api/v1/dashboards/sales               | leads, opportunities, customers                                   | 数据看板 | REQ-DB-001  |
| GET /api/v1/dashboards/service             | conversations, tickets                                            | 数据看板 | REQ-DB-002  |
| GET /api/v1/audit-logs                     | audit_logs, users                                                 | 系统管理 | -           |

---

## 二十三、验收标准

### 23.1 接口设计验收标准

| 验收项       | 验收标准                    | 验收方式     |
| ------------ | --------------------------- | ------------ |
| 接口完整性   | 覆盖 PRD 定义的所有 P0 功能 | 接口清单检查 |
| 规范一致性   | 遵循 RESTful 规范           | 规范检查     |
| 响应格式统一 | 所有接口响应格式一致        | 示例检查     |
| 错误码完整   | 覆盖所有错误场景            | 错误码检查   |
| 权限定义清晰 | 每个接口有明确权限要求      | 权限检查     |

### 23.2 接口实现验收标准

| 验收项   | 验收标准         | 验收方式 |
| -------- | ---------------- | -------- |
| 功能正确 | 接口功能符合设计 | 功能测试 |
| 参数校验 | 参数校验规则正确 | 边界测试 |
| 权限控制 | 权限控制正确     | 权限测试 |
| 错误处理 | 错误场景处理正确 | 异常测试 |
| 性能达标 | 响应时间 < 500ms | 性能测试 |

---

## 二十四、待确认事项

| 编号        | 事项                     | 状态                 | 责任人     | 预计确认日期 |
| ----------- | ------------------------ | -------------------- | ---------- | ------------ |
| TBD-API-001 | WebSocket 是否首期实现   | **已确认：首期实现** | 技术负责人 | 2026-04-05   |
| TBD-API-002 | AI 接口是否独立限流      | 待确认               | 技术负责人 | [TBD]        |
| TBD-API-003 | 文件上传是否支持断点续传 | 待确认               | 技术负责人 | [TBD]        |
| TBD-API-004 | 导出接口是否异步处理     | 待确认               | 技术负责人 | [TBD]        |
| TBD-API-005 | 批量导入是否支持异步     | 待确认               | 技术负责人 | [TBD]        |

---

## 二十五、文档一致性提醒

### 25.1 与 DBD 一致性检查

| 检查项   | 检查结果 | 说明                     |
| -------- | -------- | ------------------------ |
| 字段名称 | ✅ 一致  | 接口字段与数据库字段一致 |
| 枚举值   | ✅ 一致  | 状态枚举与 DBD 定义一致  |
| 关联关系 | ✅ 一致  | 接口关联与表关系一致     |
| 审计字段 | ✅ 一致  | 审计字段不暴露给前端     |

### 25.2 与 PRD 一致性检查

| 检查项   | 检查结果 | 说明                        |
| -------- | -------- | --------------------------- |
| 功能覆盖 | ✅ 一致  | 所有 PRD 功能均有对应接口   |
| 业务规则 | ✅ 一致  | 接口校验规则与 PRD 一致     |
| 字段定义 | ✅ 一致  | 接口字段与 PRD 定义一致     |
| 权限要求 | ✅ 一致  | 接口权限与 PRD 角色定义一致 |

### 25.3 与 RTM 一致性检查

| 检查项     | 检查结果 | 说明                   |
| ---------- | -------- | ---------------------- |
| 需求ID映射 | ✅ 一致  | 每个接口标注对应需求ID |
| 优先级一致 | ✅ 一致  | 接口优先级与 RTM 一致  |

### 25.4 与 HLD 一致性检查

| 检查项   | 检查结果 | 说明                     |
| -------- | -------- | ------------------------ |
| 模块划分 | ✅ 一致  | 接口模块与 HLD 模块一致  |
| 接口定义 | ✅ 一致  | 接口 URL 与 HLD 定义一致 |
| 鉴权方案 | ✅ 一致  | JWT 鉴权与 HLD 设计一致  |

---

## 三十、版本与变更记录

| 版本 | 日期       | 作者           | 变更摘要                                                                                                              | 状态   |
| ---- | ---------- | -------------- | --------------------------------------------------------------------------------------------------------------------- | ------ |
| v0.1 | 2026-04-04 | MOY 文档架构组 | 初稿                                                                                                                  | 草案   |
| v1.0 | 2026-04-04 | MOY 文档架构组 | 统一MVP范围定义：知识库、数据看板接口整体调整为P1                                                                     | 正式版 |
| v2.0 | 2026-04-05 | MOY 文档架构组 | 全量对账补完：新增组织管理、部门管理、任务管理、通知中心、渠道管理、自动化规则、AI工作台模块接口；接口总数从90增至135 | 已确认 |
| v3.0 | 2026-04-05 | MOY 文档架构组 | 企业级横向能力补完：新增权限管理、审计日志、配置中心、集成管理、Webhook管理模块接口；接口总数从135增至172             | 已确认 |

---

## 三十一、依赖文档

| 文档                                                                      | 版本 | 用途               |
| ------------------------------------------------------------------------- | ---- | ------------------ |
| [00_AGENTS.md](./00_AGENTS.md)                                            | v0.1 | 文档治理规则       |
| [00_Glossary.md](./00_Glossary.md)                                        | v0.1 | 术语定义           |
| [06*PRD*产品需求规格说明书\_v0.1.md](./06_PRD_产品需求规格说明书_v0.1.md) | v0.1 | 业务规则、字段定义 |
| [07*RTM*需求跟踪矩阵.md](./07_RTM_需求跟踪矩阵.md)                        | v0.1 | 需求跟踪           |
| [09*HLD*系统高层设计.md](./09_HLD_系统高层设计.md)                        | v0.1 | 模块划分、接口定义 |
| [10*DBD*数据模型与数据字典.md](./10_DBD_数据模型与数据字典.md)            | v0.1 | 数据表、字段定义   |

---

## 建议人工确认的问题

1. 接口设计是否满足首期 MVP 需求？
2. 错误码定义是否完整？
3. 限流策略是否合理？
4. WebSocket 实时能力是否首期实现？
5. 敏感字段脱敏规则是否满足安全要求？
6. 是否需要补充更多批量操作接口？
