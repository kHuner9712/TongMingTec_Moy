# MOY API 错误码清单

---

## 文档元信息

| 属性 | 内容 |
|------|------|
| 文档名称 | MOY API 错误码清单 |
| 文档编号 | MOY_ERROR_CODE_001 |
| 版本号 | v1.0 |
| 状态 | 已确认 |
| 作者 | MOY 文档架构组 |
| 日期 | 2026-04-05 |
| 目标读者 | 后端开发、前端开发、测试工程师 |
| 输入来源 | [API接口设计说明](./11_API_接口设计说明.md) |

---

## 一、错误码设计规范

### 1.1 错误码格式

错误码采用 `XXYYZZ` 格式：

| 位置 | 含义 | 说明 |
|------|------|------|
| XX | 模块代码 | 2位数字，标识业务模块 |
| YY | 错误类型 | 2位数字，标识错误类型 |
| ZZ | 具体错误 | 2位数字，标识具体错误 |

### 1.2 模块代码表

| 代码 | 模块 | 前缀 |
|------|------|------|
| 01 | 系统通用 | SYS |
| 02 | 认证授权 | AUTH |
| 03 | 用户管理 | USER |
| 04 | 组织管理 | ORG |
| 05 | 客户管理 | CM |
| 06 | 线索管理 | LM |
| 07 | 会话管理 | SM |
| 08 | 商机管理 | OM |
| 09 | 工单管理 | TM |
| 10 | 知识库 | KB |
| 11 | 数据看板 | DB |
| 12 | 任务管理 | TASK |
| 13 | 通知管理 | NT |
| 14 | 渠道管理 | CH |
| 15 | 自动化规则 | AR |
| 16 | AI工作台 | AI |

### 1.3 错误类型代码表

| 代码 | 类型 | HTTP状态码 |
|------|------|------------|
| 01 | 参数错误 | 400 |
| 02 | 认证错误 | 401 |
| 03 | 权限错误 | 403 |
| 04 | 资源不存在 | 404 |
| 05 | 业务规则错误 | 422 |
| 06 | 状态错误 | 409 |
| 07 | 数据冲突 | 409 |
| 08 | 限流错误 | 429 |
| 09 | 系统错误 | 500 |
| 10 | 外部服务错误 | 502 |

### 1.4 错误响应格式

```json
{
  "code": "050501",
  "message": "客户名称不能为空",
  "details": [
    {
      "field": "name",
      "message": "客户名称是必填项"
    }
  ],
  "requestId": "req-abc123",
  "timestamp": "2026-04-05T10:00:00Z"
}
```

---

## 二、系统通用错误码 (01)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 010101 | INVALID_PARAMETER | 参数格式错误 | 400 |
| 010102 | MISSING_PARAMETER | 缺少必填参数 | 400 |
| 010103 | PARAMETER_OUT_OF_RANGE | 参数超出范围 | 400 |
| 010104 | INVALID_JSON | JSON格式错误 | 400 |
| 010105 | INVALID_DATE_FORMAT | 日期格式错误 | 400 |
| 010106 | INVALID_PAGE_PARAM | 分页参数错误 | 400 |
| 010107 | INVALID_SORT_PARAM | 排序参数错误 | 400 |
| 010108 | INVALID_FILTER_PARAM | 筛选参数错误 | 400 |
| 010901 | INTERNAL_ERROR | 系统内部错误 | 500 |
| 010902 | DATABASE_ERROR | 数据库错误 | 500 |
| 010903 | CACHE_ERROR | 缓存错误 | 500 |
| 010904 | MESSAGE_QUEUE_ERROR | 消息队列错误 | 500 |
| 011001 | EXTERNAL_SERVICE_ERROR | 外部服务错误 | 502 |
| 011002 | AI_SERVICE_ERROR | AI服务错误 | 502 |
| 011003 | SMS_SERVICE_ERROR | 短信服务错误 | 502 |
| 011004 | EMAIL_SERVICE_ERROR | 邮件服务错误 | 502 |
| 010801 | RATE_LIMIT_EXCEEDED | 请求频率超限 | 429 |
| 010802 | CONCURRENT_LIMIT_EXCEEDED | 并发数超限 | 429 |

---

## 三、认证授权错误码 (02)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 020201 | TOKEN_MISSING | Token缺失 | 401 |
| 020202 | TOKEN_EXPIRED | Token已过期 | 401 |
| 020203 | TOKEN_INVALID | Token无效 | 401 |
| 020204 | TOKEN_MALFORMED | Token格式错误 | 401 |
| 020205 | REFRESH_TOKEN_EXPIRED | 刷新Token已过期 | 401 |
| 020206 | REFRESH_TOKEN_INVALID | 刷新Token无效 | 401 |
| 020301 | PERMISSION_DENIED | 权限不足 | 403 |
| 020302 | ROLE_NOT_FOUND | 角色不存在 | 403 |
| 020303 | ORGANIZATION_SUSPENDED | 组织已暂停 | 403 |
| 020304 | USER_INACTIVE | 用户已停用 | 403 |
| 020305 | USER_LOCKED | 用户已锁定 | 403 |
| 020306 | FEATURE_NOT_ENABLED | 功能未启用 | 403 |
| 020501 | LOGIN_FAILED | 登录失败 | 422 |
| 020502 | PASSWORD_INCORRECT | 密码错误 | 422 |
| 020503 | ACCOUNT_NOT_FOUND | 账号不存在 | 422 |
| 020504 | ACCOUNT_DISABLED | 账号已禁用 | 422 |
| 020505 | TOO_MANY_LOGIN_ATTEMPTS | 登录尝试次数过多 | 422 |
| 020506 | VERIFICATION_CODE_EXPIRED | 验证码已过期 | 422 |
| 020507 | VERIFICATION_CODE_INVALID | 验证码无效 | 422 |
| 020508 | PASSWORD_TOO_WEAK | 密码强度不足 | 422 |
| 020509 | PASSWORD_RECENTLY_USED | 密码近期已使用 | 422 |

---

## 四、用户管理错误码 (03)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 030401 | USER_NOT_FOUND | 用户不存在 | 404 |
| 030701 | EMAIL_ALREADY_EXISTS | 邮箱已存在 | 409 |
| 030702 | PHONE_ALREADY_EXISTS | 手机号已存在 | 409 |
| 030703 | USERNAME_ALREADY_EXISTS | 用户名已存在 | 409 |
| 030501 | CANNOT_DELETE_SELF | 不能删除自己 | 422 |
| 030502 | CANNOT_DISABLE_SELF | 不能停用自己 | 422 |
| 030503 | USER_HAS_ACTIVE_TASKS | 用户有进行中的任务 | 422 |
| 030504 | CANNOT_REMOVE_LAST_ADMIN | 不能移除最后一个管理员 | 422 |

---

## 五、组织管理错误码 (04)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 040401 | ORGANIZATION_NOT_FOUND | 组织不存在 | 404 |
| 040402 | DEPARTMENT_NOT_FOUND | 部门不存在 | 404 |
| 040701 | ORGANIZATION_NAME_EXISTS | 组织名称已存在 | 409 |
| 040702 | DEPARTMENT_NAME_EXISTS | 部门名称已存在 | 409 |
| 040501 | DEPARTMENT_HAS_MEMBERS | 部门下有成员 | 422 |
| 040502 | DEPARTMENT_HAS_SUBDEPARTMENTS | 部门下有子部门 | 422 |
| 040503 | CANNOT_ARCHIVE_DEFAULT_DEPARTMENT | 不能归档默认部门 | 422 |
| 040601 | ORGANIZATION_ALREADY_ACTIVE | 组织已是正常状态 | 409 |
| 040602 | ORGANIZATION_ALREADY_SUSPENDED | 组织已是暂停状态 | 409 |
| 040603 | ORGANIZATION_ALREADY_CLOSED | 组织已关闭 | 409 |

---

## 六、客户管理错误码 (05)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 050401 | CUSTOMER_NOT_FOUND | 客户不存在 | 404 |
| 050701 | CUSTOMER_NAME_EXISTS | 客户名称已存在 | 409 |
| 050702 | CUSTOMER_PHONE_EXISTS | 客户手机号已存在 | 409 |
| 050703 | CUSTOMER_EMAIL_EXISTS | 客户邮箱已存在 | 409 |
| 050501 | CANNOT_DELETE_CUSTOMER_WITH_ORDERS | 客户有订单，不能删除 | 422 |
| 050502 | CANNOT_DELETE_CUSTOMER_WITH_OPPORTUNITIES | 客户有商机，不能删除 | 422 |
| 050601 | INVALID_CUSTOMER_STATUS | 无效的客户状态 | 409 |
| 050602 | CUSTOMER_STATUS_TRANSITION_NOT_ALLOWED | 客户状态流转不允许 | 409 |

---

## 七、线索管理错误码 (06)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 060401 | LEAD_NOT_FOUND | 线索不存在 | 404 |
| 060701 | LEAD_PHONE_EXISTS | 线索手机号已存在 | 409 |
| 060702 | LEAD_EMAIL_EXISTS | 线索邮箱已存在 | 409 |
| 060501 | LEAD_ALREADY_CONVERTED | 线索已转化 | 422 |
| 060502 | LEAD_ALREADY_INVALID | 线索已标记无效 | 422 |
| 060503 | LEAD_CONVERSION_REQUIRES_CUSTOMER_OR_OPPORTUNITY | 转化需关联客户或商机 | 422 |
| 060504 | CANNOT_CONVERT_INVALID_LEAD | 无效线索不能转化 | 422 |
| 060601 | INVALID_LEAD_STATUS | 无效的线索状态 | 409 |
| 060602 | LEAD_STATUS_TRANSITION_NOT_ALLOWED | 线索状态流转不允许 | 409 |
| 060603 | LEAD_ALREADY_ASSIGNED | 线索已分配 | 409 |

---

## 八、会话管理错误码 (07)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 070401 | CONVERSATION_NOT_FOUND | 会话不存在 | 404 |
| 070402 | MESSAGE_NOT_FOUND | 消息不存在 | 404 |
| 070501 | CONVERSATION_ALREADY_CLOSED | 会话已关闭 | 422 |
| 070502 | CONVERSATION_NOT_ACTIVE | 会话非活跃状态 | 422 |
| 070503 | AGENT_NOT_AVAILABLE | 客服不在线 | 422 |
| 070504 | QUEUE_FULL | 排队队列已满 | 422 |
| 070505 | MESSAGE_TOO_LONG | 消息过长 | 422 |
| 070506 | ATTACHMENT_TOO_LARGE | 附件过大 | 422 |
| 070507 | UNSUPPORTED_ATTACHMENT_TYPE | 不支持的附件类型 | 422 |
| 070601 | INVALID_CONVERSATION_STATUS | 无效的会话状态 | 409 |
| 070602 | CONVERSATION_STATUS_TRANSITION_NOT_ALLOWED | 会话状态流转不允许 | 409 |

---

## 九、商机管理错误码 (08)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 080401 | OPPORTUNITY_NOT_FOUND | 商机不存在 | 404 |
| 080701 | OPPORTUNITY_NAME_EXISTS | 商机名称已存在 | 409 |
| 080501 | OPPORTUNITY_ALREADY_CLOSED | 商机已关闭 | 422 |
| 080502 | WON_OPPORTUNITY_CANNOT_BE_MODIFIED | 赢单商机不能修改 | 422 |
| 080503 | LOST_OPPORTUNITY_CANNOT_BE_MODIFIED | 输单商机不能修改 | 422 |
| 080504 | WIN_AMOUNT_REQUIRED | 赢单需填写成交金额 | 422 |
| 080505 | LOST_REASON_REQUIRED | 输单需填写原因 | 422 |
| 080601 | INVALID_OPPORTUNITY_STAGE | 无效的商机阶段 | 409 |
| 080602 | OPPORTUNITY_STAGE_TRANSITION_NOT_ALLOWED | 商机阶段流转不允许 | 409 |

---

## 十、工单管理错误码 (09)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 090401 | TICKET_NOT_FOUND | 工单不存在 | 404 |
| 090501 | TICKET_ALREADY_CLOSED | 工单已关闭 | 422 |
| 090502 | TICKET_NOT_ASSIGNED | 工单未分配 | 422 |
| 090503 | TICKET_RESOLUTION_REQUIRED | 工单解决需填写解决方案 | 422 |
| 090504 | TICKET_REOPEN_LIMIT_EXCEEDED | 工单重开次数超限 | 422 |
| 090505 | SLA_ALREADY_BREACHED | SLA已违约 | 422 |
| 090601 | INVALID_TICKET_STATUS | 无效的工单状态 | 409 |
| 090602 | TICKET_STATUS_TRANSITION_NOT_ALLOWED | 工单状态流转不允许 | 409 |
| 090603 | TICKET_PRIORITY_INVALID | 无效的工单优先级 | 409 |
| 090604 | TICKET_TYPE_INVALID | 无效的工单类型 | 409 |

---

## 十一、知识库错误码 (10)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 100401 | KNOWLEDGE_NOT_FOUND | 知识条目不存在 | 404 |
| 100402 | CATEGORY_NOT_FOUND | 分类不存在 | 404 |
| 100701 | KNOWLEDGE_TITLE_EXISTS | 知识标题已存在 | 409 |
| 100702 | CATEGORY_NAME_EXISTS | 分类名称已存在 | 409 |
| 100501 | KNOWLEDGE_UNDER_REVIEW | 知识审核中 | 422 |
| 100502 | KNOWLEDGE_ALREADY_ARCHIVED | 知识已归档 | 422 |
| 100503 | CATEGORY_HAS_KNOWLEDGE | 分类下有知识条目 | 422 |
| 100504 | CATEGORY_HAS_SUBCATEGORIES | 分类下有子分类 | 422 |
| 100601 | INVALID_KNOWLEDGE_STATUS | 无效的知识状态 | 409 |
| 100602 | KNOWLEDGE_STATUS_TRANSITION_NOT_ALLOWED | 知识状态流转不允许 | 409 |

---

## 十二、数据看板错误码 (11)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 110401 | DASHBOARD_NOT_FOUND | 看板配置不存在 | 404 |
| 110402 | WIDGET_NOT_FOUND | 组件不存在 | 404 |
| 110501 | INVALID_DATE_RANGE | 无效的日期范围 | 422 |
| 110502 | DATE_RANGE_TOO_LARGE | 日期范围过大 | 422 |
| 110503 | EXPORT_IN_PROGRESS | 导出进行中 | 422 |
| 110901 | DATA_AGGREGATION_ERROR | 数据聚合错误 | 500 |

---

## 十三、任务管理错误码 (12)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 120401 | TASK_NOT_FOUND | 任务不存在 | 404 |
| 120501 | TASK_ALREADY_COMPLETED | 任务已完成 | 422 |
| 120502 | TASK_ALREADY_CANCELLED | 任务已取消 | 422 |
| 120503 | TASK_DUE_DATE_PASSED | 任务已过期 | 422 |
| 120504 | TASK_ASSIGNMENT_REQUIRED | 任务需指定负责人 | 422 |
| 120601 | INVALID_TASK_STATUS | 无效的任务状态 | 409 |
| 120602 | TASK_STATUS_TRANSITION_NOT_ALLOWED | 任务状态流转不允许 | 409 |

---

## 十四、通知管理错误码 (13)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 130401 | NOTIFICATION_NOT_FOUND | 通知不存在 | 404 |
| 130501 | NOTIFICATION_ALREADY_READ | 通知已读 | 422 |
| 130502 | NOTIFICATION_TEMPLATE_NOT_FOUND | 通知模板不存在 | 422 |
| 130503 | NOTIFICATION_SEND_FAILED | 通知发送失败 | 422 |

---

## 十五、渠道管理错误码 (14)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 140401 | CHANNEL_NOT_FOUND | 渠道不存在 | 404 |
| 140701 | CHANNEL_NAME_EXISTS | 渠道名称已存在 | 409 |
| 140501 | CHANNEL_ALREADY_ACTIVE | 渠道已启用 | 422 |
| 140502 | CHANNEL_ALREADY_INACTIVE | 渠道已停用 | 422 |
| 140503 | CHANNEL_CONFIG_INVALID | 渠道配置无效 | 422 |
| 140504 | CHANNEL_CONNECTION_FAILED | 渠道连接失败 | 422 |
| 140505 | CHANNEL_AUTHENTICATION_FAILED | 渠道认证失败 | 422 |

---

## 十六、自动化规则错误码 (15)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 150401 | AUTOMATION_RULE_NOT_FOUND | 自动化规则不存在 | 404 |
| 150701 | RULE_NAME_EXISTS | 规则名称已存在 | 409 |
| 150501 | RULE_CONDITION_INVALID | 规则条件无效 | 422 |
| 150502 | RULE_ACTION_INVALID | 规则动作无效 | 422 |
| 150503 | RULE_EXECUTION_FAILED | 规则执行失败 | 422 |
| 150504 | CIRCULAR_RULE_DEPENDENCY | 规则循环依赖 | 422 |

---

## 十七、AI工作台错误码 (16)

| 错误码 | 错误名称 | 错误描述 | HTTP状态码 |
|--------|----------|----------|------------|
| 160401 | AI_TASK_NOT_FOUND | AI任务不存在 | 404 |
| 160501 | AI_TASK_ALREADY_RUNNING | AI任务执行中 | 422 |
| 160502 | AI_TASK_ALREADY_COMPLETED | AI任务已完成 | 422 |
| 160503 | AI_TASK_ALREADY_FAILED | AI任务已失败 | 422 |
| 160504 | AI_MODEL_NOT_AVAILABLE | AI模型不可用 | 422 |
| 160505 | AI_QUOTA_EXCEEDED | AI配额超限 | 422 |
| 160506 | AI_RESPONSE_TIMEOUT | AI响应超时 | 422 |
| 160507 | AI_CONTENT_FILTERED | AI内容被过滤 | 422 |
| 160508 | AI_FALLBACK_TRIGGERED | AI降级触发 | 422 |
| 160601 | INVALID_AI_TASK_STATUS | 无效的AI任务状态 | 409 |
| 160602 | AI_TASK_STATUS_TRANSITION_NOT_ALLOWED | AI任务状态流转不允许 | 409 |

---

## 十八、错误码使用示例

### 18.1 后端使用示例

```typescript
import { BusinessException } from '@moy/common';

throw new BusinessException('050401', '客户不存在', {
  customerId: 123,
});

throw new BusinessException('060602', '线索状态流转不允许', {
  currentStatus: 'converted',
  targetStatus: 'following',
  allowedTransitions: [],
});
```

### 18.2 前端处理示例

```typescript
async function handleApiError(error: ApiError) {
  const { code, message, details } = error;
  
  switch (code.substring(0, 2)) {
    case '02':
      if (code === '020202') {
        router.push('/login');
      }
      break;
    case '05':
      if (code === '050401') {
        message.error('客户不存在');
      }
      break;
    default:
      message.error(message);
  }
}
```

---

## 十九、版本与变更记录

| 版本 | 日期 | 作者 | 变更摘要 | 状态 |
|------|------|------|----------|------|
| v1.0 | 2026-04-05 | MOY 文档架构组 | 初稿 | 已确认 |

---

## 二十、依赖文档

| 文档 | 版本 | 用途 |
|------|------|------|
| [11_API_接口设计说明.md](./11_API_接口设计说明.md) | v2.0 | 接口设计 |

---

## 二十一、待确认事项

1. 是否需要支持多语言错误消息？
2. 是否需要支持错误码自定义扩展？
3. 是否需要错误码使用统计？
