import { useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Spin,
  Steps,
  Table,
  Tag,
  message,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import dayjs from 'dayjs';
import { subscriptionApi } from '../services/subscription';
import { deliveryApi } from '../services/delivery';
import { SubscriptionStatus } from '../types';
import { usePermission } from '../hooks/usePermission';

const STATUS_CONFIG: Record<SubscriptionStatus, { text: string; color: string }> = {
  trial: { text: '试用', color: 'default' },
  active: { text: '生效中', color: 'green' },
  overdue: { text: '逾期', color: 'orange' },
  suspended: { text: '已暂停', color: 'red' },
  expired: { text: '已过期', color: 'default' },
  cancelled: { text: '已取消', color: 'red' },
};

const STATUS_STEPS: { status: SubscriptionStatus; label: string }[] = [
  { status: 'trial', label: '试用' },
  { status: 'active', label: '生效' },
  { status: 'expired', label: '到期' },
];

function getCurrentStep(status: SubscriptionStatus): number {
  if (status === 'cancelled') return 0;
  if (status === 'suspended' || status === 'overdue') return 1;
  const idx = STATUS_STEPS.findIndex((item) => item.status === status);
  return idx >= 0 ? idx : 0;
}

export default function SubscriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermission();

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [editSeatModalOpen, setEditSeatModalOpen] = useState(false);
  const [suspendForm] = Form.useForm();
  const [cancelForm] = Form.useForm();
  const [editSeatForm] = Form.useForm();

  const { data, isLoading } = useQuery(
    ['subscription', id],
    () => subscriptionApi.get(id || ''),
    { enabled: !!id },
  );

  const suspendMutation = useMutation(
    (payload: { id: string; reason: string; version: number }) =>
      subscriptionApi.suspend(payload.id, payload.reason, payload.version),
    {
      onSuccess: () => {
        message.success('订阅已暂停');
        queryClient.invalidateQueries(['subscription', id]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || '操作失败');
      },
    },
  );

  const cancelMutation = useMutation(
    (payload: { id: string; reason?: string }) =>
      subscriptionApi.cancel(payload.id, payload.reason),
    {
      onSuccess: () => {
        message.success('订阅已取消');
        queryClient.invalidateQueries(['subscription', id]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || '操作失败');
      },
    },
  );

  const updateMutation = useMutation(
    (payload: { id: string; seatCount: number; version: number }) =>
      subscriptionApi.update(payload.id, {
        seatCount: payload.seatCount,
        version: payload.version,
      }),
    {
      onSuccess: () => {
        message.success('订阅已更新');
        queryClient.invalidateQueries(['subscription', id]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || '操作失败');
      },
    },
  );

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  const subscription = data?.subscription;
  const seats = data?.seats || [];

  if (!subscription) {
    return <Card>订阅不存在</Card>;
  }

  const currentStep = getCurrentStep(subscription.status);

  const goToDeliveryDetail = async () => {
    try {
      const delivery = await deliveryApi.getBySubscription(subscription.id);
      navigate(`/deliveries/${delivery.id}`);
    } catch {
      navigate(`/deliveries?subscriptionId=${subscription.id}`);
      message.info('该订阅尚未绑定交付单，已进入交付列表并带入订阅筛选');
    }
  };

  return (
    <Card
      title={`订阅 ${subscription.id.slice(0, 8)}`}
      extra={<Button onClick={() => navigate('/subscriptions')}>返回列表</Button>}
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {STATUS_STEPS.map((item) => (
          <Steps.Step key={item.status} title={item.label} />
        ))}
      </Steps>

      {subscription.status === 'suspended' && (
        <Tag color="red" style={{ marginBottom: 16, fontSize: 14 }}>
          已暂停
        </Tag>
      )}
      {subscription.status === 'overdue' && (
        <Tag color="orange" style={{ marginBottom: 16, fontSize: 14 }}>
          逾期
        </Tag>
      )}
      {subscription.status === 'cancelled' && (
        <Tag color="red" style={{ marginBottom: 16, fontSize: 14 }}>
          已取消
        </Tag>
      )}

      <Descriptions bordered column={2}>
        <Descriptions.Item label="订阅ID">{subscription.id}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={STATUS_CONFIG[subscription.status].color}>{STATUS_CONFIG[subscription.status].text}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="客户">
          {subscription.customerId ? (
            <Space size={12} wrap>
              <Button
                type="link"
                size="small"
                style={{ padding: 0 }}
                onClick={() => navigate(`/customer-360/${subscription.customerId}`)}
              >
                查看客户
              </Button>
              <Button
                type="link"
                size="small"
                style={{ padding: 0 }}
                onClick={() => navigate(`/workbench/csm/health?customerId=${subscription.customerId}`)}
              >
                客户成功
              </Button>
              <Button
                type="link"
                size="small"
                style={{ padding: 0 }}
                onClick={() => navigate(`/workbench/csm/plans?customerId=${subscription.customerId}`)}
              >
                SuccessPlan
              </Button>
            </Space>
          ) : (
            '-'
          )}
        </Descriptions.Item>

        <Descriptions.Item label="关联订单">
          {subscription.orderId ? (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => navigate(`/orders/${subscription.orderId}`)}
            >
              查看订单
            </Button>
          ) : (
            '-'
          )}
        </Descriptions.Item>

        <Descriptions.Item label="交付">
          <Space size={12} wrap>
            <Button type="link" size="small" style={{ padding: 0 }} onClick={goToDeliveryDetail}>
              查看交付详情
            </Button>
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => navigate(`/workbench/csm/visits?customerId=${subscription.customerId}`)}
            >
              回访记录
            </Button>
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="套餐ID">{subscription.planId || '-'}</Descriptions.Item>
        <Descriptions.Item label="席位数">
          {subscription.seatCount}
          {can('PERM-SUB-MANAGE') &&
            (subscription.status === 'active' || subscription.status === 'trial') && (
              <Button
                type="link"
                size="small"
                onClick={() => {
                  editSeatForm.setFieldsValue({ seatCount: subscription.seatCount });
                  setEditSeatModalOpen(true);
                }}
              >
                修改
              </Button>
            )}
        </Descriptions.Item>
        <Descriptions.Item label="已使用席位">{subscription.usedCount}</Descriptions.Item>
        <Descriptions.Item label="自动续费">{subscription.autoRenew ? '是' : '否'}</Descriptions.Item>
        <Descriptions.Item label="开始时间">
          {subscription.startsAt ? dayjs(subscription.startsAt).format('YYYY-MM-DD HH:mm') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="结束时间">
          {subscription.endsAt ? dayjs(subscription.endsAt).format('YYYY-MM-DD HH:mm') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="最近账单时间">
          {subscription.lastBillAt ? dayjs(subscription.lastBillAt).format('YYYY-MM-DD HH:mm') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {dayjs(subscription.createdAt).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>
      </Descriptions>

      {seats.length > 0 && (
        <Card title="席位列表" style={{ marginTop: 16 }} size="small">
          <Table
            rowKey="id"
            dataSource={seats}
            pagination={false}
            size="small"
            columns={[
              { title: '席位ID', dataIndex: 'id', key: 'id', render: (value: string) => value?.slice(0, 8) },
              {
                title: '用户ID',
                dataIndex: 'userId',
                key: 'userId',
                render: (value: string) => value?.slice(0, 8) || '-',
              },
              { title: '状态', dataIndex: 'status', key: 'status' },
              {
                title: '分配时间',
                dataIndex: 'assignedAt',
                key: 'assignedAt',
                render: (value: string) =>
                  value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
              },
            ]}
          />
        </Card>
      )}

      <Space style={{ marginTop: 16 }}>
        {(subscription.status === 'active' || subscription.status === 'overdue') && can('PERM-SUB-MANAGE') && (
          <Button danger onClick={() => setSuspendModalOpen(true)}>
            暂停订阅
          </Button>
        )}
        {(subscription.status === 'active' || subscription.status === 'trial') && can('PERM-SUB-MANAGE') && (
          <Button danger onClick={() => setCancelModalOpen(true)}>
            取消订阅
          </Button>
        )}
      </Space>

      <Modal
        title="暂停订阅"
        open={suspendModalOpen}
        onCancel={() => setSuspendModalOpen(false)}
        onOk={() => suspendForm.submit()}
        confirmLoading={suspendMutation.isLoading}
      >
        <Form
          form={suspendForm}
          layout="vertical"
          onFinish={(values: { reason: string }) => {
            suspendMutation.mutate({
              id: subscription.id,
              reason: values.reason,
              version: subscription.version,
            });
            setSuspendModalOpen(false);
          }}
        >
          <Form.Item
            name="reason"
            label="暂停原因"
            rules={[{ required: true, message: '请输入暂停原因' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入暂停原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="取消订阅"
        open={cancelModalOpen}
        onCancel={() => setCancelModalOpen(false)}
        onOk={() => cancelForm.submit()}
        confirmLoading={cancelMutation.isLoading}
      >
        <Form
          form={cancelForm}
          layout="vertical"
          onFinish={(values: { reason?: string }) => {
            cancelMutation.mutate({ id: subscription.id, reason: values.reason });
            setCancelModalOpen(false);
          }}
        >
          <Form.Item name="reason" label="取消原因">
            <Input.TextArea rows={3} placeholder="请输入取消原因（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改席位数"
        open={editSeatModalOpen}
        onCancel={() => setEditSeatModalOpen(false)}
        onOk={() => editSeatForm.submit()}
        confirmLoading={updateMutation.isLoading}
      >
        <Form
          form={editSeatForm}
          layout="vertical"
          onFinish={(values: { seatCount: number }) => {
            updateMutation.mutate({
              id: subscription.id,
              seatCount: values.seatCount,
              version: subscription.version,
            });
            setEditSeatModalOpen(false);
          }}
        >
          <Form.Item
            name="seatCount"
            label="席位数"
            rules={[{ required: true, message: '请输入席位数' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
