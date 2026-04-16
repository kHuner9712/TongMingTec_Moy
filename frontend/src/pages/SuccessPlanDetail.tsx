import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  List,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { csmApi } from '../services/csm';
import { deliveryApi } from '../services/delivery';
import {
  CustomerReturnVisit,
  DeliveryAcceptanceResult,
  DeliveryOrder,
  DeliveryOutcomeStatus,
  DeliveryRiskSeverity,
  DeliveryStatus,
  HealthLevel,
  SuccessPlanStatus,
} from '../types';
import { usePermission } from '../hooks/usePermission';

const { Text } = Typography;

const PLAN_STATUS_CONFIG: Record<SuccessPlanStatus, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  active: { text: '执行中', color: 'blue' },
  on_hold: { text: '暂停', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' },
};

const HEALTH_LEVEL_CONFIG: Record<HealthLevel, { text: string; color: string }> = {
  high: { text: '健康', color: 'green' },
  medium: { text: '一般', color: 'blue' },
  low: { text: '偏低', color: 'orange' },
  critical: { text: '风险', color: 'red' },
};

const DELIVERY_STATUS_TEXT: Record<DeliveryStatus, string> = {
  draft: '草稿',
  active: '进行中',
  blocked: '阻塞',
  ready_for_acceptance: '待验收',
  accepted: '已验收',
  closed: '已关闭',
};

const ACCEPTANCE_TEXT: Record<DeliveryAcceptanceResult, string> = {
  pending: '待验收',
  accepted: '验收通过',
  rejected: '验收驳回',
};

const RISK_COLOR: Record<DeliveryRiskSeverity, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
};

const OUTCOME_TEXT: Record<DeliveryOutcomeStatus, string> = {
  pending: '待测量',
  achieved: '达成',
  partial: '部分达成',
  not_achieved: '未达成',
};

export default function SuccessPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermission();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isVisitOpen, setIsVisitOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [visitForm] = Form.useForm();

  const { data: plan, isLoading } = useQuery(
    ['csm-plan', id],
    () => csmApi.getSuccessPlan(id || ''),
    { enabled: !!id },
  );

  const customerId = plan?.customerId;

  const { data: health } = useQuery(
    ['csm-health-detail', customerId],
    () => csmApi.getHealthScore(customerId || ''),
    { enabled: !!customerId },
  );

  const { data: deliverySummary } = useQuery(
    ['csm-delivery-summary', customerId],
    () => deliveryApi.getCustomerSummary(customerId || ''),
    { enabled: !!customerId },
  );

  const { data: deliveries } = useQuery(
    ['csm-delivery-list', customerId],
    () =>
      deliveryApi.list({
        customerId,
        page: 1,
        page_size: 5,
      }),
    { enabled: !!customerId },
  );

  const latestDelivery: DeliveryOrder | undefined = deliveries?.items?.[0];

  const { data: latestDeliveryDetail } = useQuery(
    ['csm-latest-delivery-detail', latestDelivery?.id],
    () => deliveryApi.get(latestDelivery?.id || ''),
    { enabled: !!latestDelivery?.id },
  );

  const { data: visits } = useQuery(
    ['csm-plan-visits', customerId],
    () => csmApi.listReturnVisits(customerId || '', { page: 1, page_size: 5 }),
    { enabled: !!customerId },
  );

  const updateMutation = useMutation(
    (payload: {
      title?: string;
      status?: SuccessPlanStatus;
      payload?: Record<string, unknown>;
      version: number;
    }) => csmApi.updateSuccessPlan(id || '', payload),
    {
      onSuccess: () => {
        message.success('SuccessPlan 已更新');
        setIsEditOpen(false);
        queryClient.invalidateQueries(['csm-plan', id]);
        queryClient.invalidateQueries(['csm-plans']);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || '更新失败');
      },
    },
  );

  const createVisitMutation = useMutation(
    (payload: { customerId: string; visitType: string; summary: string; nextVisitAt?: string }) =>
      csmApi.createReturnVisit(payload),
    {
      onSuccess: () => {
        message.success('回访记录已创建');
        setIsVisitOpen(false);
        visitForm.resetFields();
        queryClient.invalidateQueries(['csm-plan-visits', customerId]);
        queryClient.invalidateQueries(['csm-visits']);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || '创建回访失败');
      },
    },
  );

  const outcomeStats = useMemo(() => {
    const base: Record<DeliveryOutcomeStatus, number> = {
      pending: 0,
      achieved: 0,
      partial: 0,
      not_achieved: 0,
    };
    (latestDeliveryDetail?.outcomes || []).forEach((item) => {
      base[item.status] += 1;
    });
    return base;
  }, [latestDeliveryDetail?.outcomes]);

  const openRisks = (latestDeliveryDetail?.risks || []).filter(
    (item) => item.status === 'open' || item.status === 'mitigated',
  );
  const latestAcceptance = latestDeliveryDetail?.acceptances?.[0];

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  if (!plan) {
    return <Card>SuccessPlan 不存在</Card>;
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <span>{plan.title}</span>
            <Tag color={PLAN_STATUS_CONFIG[plan.status].color}>
              {PLAN_STATUS_CONFIG[plan.status].text}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button onClick={() => navigate('/workbench/csm/plans')}>返回列表</Button>
            <Button onClick={() => setIsVisitOpen(true)} disabled={!can('PERM-CSM-MANAGE')}>
              记录回访
            </Button>
            <Button
              type="primary"
              onClick={() => {
                editForm.setFieldsValue({
                  title: plan.title,
                  status: plan.status,
                  payloadJson: JSON.stringify(plan.payload || {}, null, 2),
                });
                setIsEditOpen(true);
              }}
              disabled={!can('PERM-CSM-MANAGE')}
            >
              编辑计划
            </Button>
          </Space>
        }
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="计划ID">{plan.id}</Descriptions.Item>
          <Descriptions.Item label="负责人">{plan.ownerUserId.slice(0, 8)}</Descriptions.Item>
          <Descriptions.Item label="客户ID">{plan.customerId}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(plan.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(plan.updatedAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="客户成功入口">
            <Space wrap>
              <Button
                size="small"
                type="link"
                style={{ padding: 0 }}
                onClick={() => navigate(`/workbench/csm/health?customerId=${plan.customerId}`)}
              >
                健康档案
              </Button>
              <Button
                size="small"
                type="link"
                style={{ padding: 0 }}
                onClick={() => navigate(`/workbench/csm/visits?customerId=${plan.customerId}`)}
              >
                回访台账
              </Button>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="健康分"
              value={health?.score || 0}
              suffix={
                health ? (
                  <Tag color={HEALTH_LEVEL_CONFIG[health.level]?.color}>
                    {HEALTH_LEVEL_CONFIG[health.level]?.text}
                  </Tag>
                ) : undefined
              }
            />
            <Text type="secondary">
              最近评估：{health?.evaluatedAt ? dayjs(health.evaluatedAt).format('YYYY-MM-DD HH:mm') : '-'}
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="活跃交付" value={deliverySummary?.activeDeliveries || 0} />
            <Text type="secondary">
              阻塞 {deliverySummary?.blockedDeliveries || 0} / 已验收{' '}
              {deliverySummary?.acceptedDeliveries || 0}
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="结果达成" value={deliverySummary?.achievedOutcomes || 0} />
            <Text type="secondary">
              部分达成 {deliverySummary?.partialOutcomes || 0} / 风险待消化{' '}
              {deliverySummary?.pendingRisks || 0}
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={14}>
          <Card
            title="最近交付透视"
            extra={
              latestDelivery ? (
                <Button size="small" onClick={() => navigate(`/deliveries/${latestDelivery.id}`)}>
                  查看交付详情
                </Button>
              ) : null
            }
          >
            {!latestDelivery ? (
              <Text type="secondary">暂无交付记录</Text>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space wrap>
                  <Tag color="blue">交付单 {latestDelivery.deliveryNo}</Tag>
                  <Tag>{DELIVERY_STATUS_TEXT[latestDelivery.status]}</Tag>
                  {latestAcceptance && (
                    <Tag
                      color={latestAcceptance.result === 'accepted' ? 'green' : latestAcceptance.result === 'rejected' ? 'red' : 'default'}
                    >
                      {ACCEPTANCE_TEXT[latestAcceptance.result]}
                    </Tag>
                  )}
                </Space>

                <div>
                  <Text strong>风险摘要：</Text>
                  {openRisks.length === 0 ? (
                    <Text type="secondary">无进行中风险</Text>
                  ) : (
                    <Space wrap style={{ marginLeft: 8 }}>
                      {openRisks.slice(0, 5).map((risk) => (
                        <Tag key={risk.id} color={RISK_COLOR[risk.severity]}>
                          {risk.title}
                        </Tag>
                      ))}
                    </Space>
                  )}
                </div>

                <div>
                  <Text strong>结果达成情况：</Text>
                  <Space wrap style={{ marginLeft: 8 }}>
                    {Object.entries(outcomeStats).map(([key, count]) => (
                      <Tag key={key}>
                        {OUTCOME_TEXT[key as DeliveryOutcomeStatus]} {count}
                      </Tag>
                    ))}
                  </Space>
                </div>
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="最近回访记录"
            extra={
              <Button size="small" onClick={() => navigate(`/workbench/csm/visits?customerId=${plan.customerId}`)}>
                查看全部
              </Button>
            }
          >
            <List
              size="small"
              dataSource={(visits?.items || []) as CustomerReturnVisit[]}
              locale={{ emptyText: '暂无回访记录' }}
              renderItem={(visit) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag>{visit.visitType}</Tag>
                        <Text type="secondary">{dayjs(visit.createdAt).format('MM-DD HH:mm')}</Text>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text>{visit.summary}</Text>
                        <Text type="secondary">
                          下次回访：{visit.nextVisitAt ? dayjs(visit.nextVisitAt).format('YYYY-MM-DD HH:mm') : '-'}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="计划补充字段（Payload）" style={{ marginTop: 16 }}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(plan.payload || {}, null, 2)}
        </pre>
      </Card>

      <Modal
        title="编辑 SuccessPlan"
        open={isEditOpen}
        onCancel={() => setIsEditOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={updateMutation.isLoading}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values: { title?: string; status?: SuccessPlanStatus; payloadJson?: string }) => {
            let payload: Record<string, unknown> | undefined;
            if (values.payloadJson) {
              try {
                payload = JSON.parse(values.payloadJson);
              } catch {
                message.error('Payload JSON 格式无效');
                return;
              }
            }

            updateMutation.mutate({
              title: values.title,
              status: values.status,
              payload,
              version: plan.version,
            });
          }}
        >
          <Form.Item
            name="title"
            label="计划标题"
            rules={[{ required: true, message: '请输入计划标题' }]}
          >
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select>
              {Object.entries(PLAN_STATUS_CONFIG).map(([key, value]) => (
                <Select.Option key={key} value={key}>
                  {value.text}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="payloadJson" label="计划补充字段（JSON）">
            <Input.TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增回访记录"
        open={isVisitOpen}
        onCancel={() => setIsVisitOpen(false)}
        onOk={() => visitForm.submit()}
        confirmLoading={createVisitMutation.isLoading}
      >
        <Form
          form={visitForm}
          layout="vertical"
          initialValues={{ customerId: plan.customerId, visitType: 'quarterly_review' }}
          onFinish={(values: {
            customerId: string;
            visitType: string;
            summary: string;
            nextVisitAt?: dayjs.Dayjs;
          }) => {
            createVisitMutation.mutate({
              customerId: values.customerId,
              visitType: values.visitType,
              summary: values.summary,
              nextVisitAt: values.nextVisitAt ? values.nextVisitAt.toISOString() : undefined,
            });
          }}
        >
          <Form.Item name="customerId" label="客户ID">
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="visitType"
            label="回访类型"
            rules={[{ required: true, message: '请输入回访类型' }]}
          >
            <Select>
              <Select.Option value="quarterly_review">季度复盘</Select.Option>
              <Select.Option value="delivery_retro">交付复盘</Select.Option>
              <Select.Option value="renewal_check">续约摸底</Select.Option>
              <Select.Option value="risk_followup">风险跟进</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="summary"
            label="回访摘要"
            rules={[{ required: true, message: '请输入回访摘要' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="nextVisitAt" label="下次回访时间（可选）">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
