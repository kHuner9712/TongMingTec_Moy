import { useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { subscriptionApi } from '../services/subscription';
import { CreateSubscriptionDto, Subscription, SubscriptionStatus } from '../types';
import CustomerSelect from '../components/CustomerSelect';
import { usePermission } from '../hooks/usePermission';

const STATUS_CONFIG: Record<SubscriptionStatus, { text: string; color: string }> = {
  trial: { text: '试用', color: 'default' },
  active: { text: '生效中', color: 'green' },
  overdue: { text: '逾期', color: 'orange' },
  suspended: { text: '已暂停', color: 'red' },
  expired: { text: '已过期', color: 'default' },
  cancelled: { text: '已取消', color: 'red' },
};

export default function Subscriptions() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { can } = usePermission();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | undefined>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  const { data, isLoading } = useQuery(
    ['subscriptions', page, pageSize, statusFilter],
    () =>
      subscriptionApi.list({
        page,
        page_size: pageSize,
        status: statusFilter,
      }),
  );

  const createMutation = useMutation(
    (values: CreateSubscriptionDto) => subscriptionApi.create(values),
    {
      onSuccess: () => {
        message.success('订阅创建成功');
        setIsCreateModalOpen(false);
        createForm.resetFields();
        queryClient.invalidateQueries(['subscriptions']);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || '创建失败');
      },
    },
  );

  const columns = [
    {
      title: '订阅ID',
      dataIndex: 'id',
      key: 'id',
      render: (value: string) => value.slice(0, 8),
    },
    {
      title: '客户ID',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (value: string) => value.slice(0, 8),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: SubscriptionStatus) => (
        <Tag color={STATUS_CONFIG[status].color}>{STATUS_CONFIG[status].text}</Tag>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startsAt',
      key: 'startsAt',
      render: (value: string) => (value ? dayjs(value).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '结束时间',
      dataIndex: 'endsAt',
      key: 'endsAt',
      render: (value: string) => (value ? dayjs(value).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '自动续费',
      dataIndex: 'autoRenew',
      key: 'autoRenew',
      render: (value: boolean) => (value ? '是' : '否'),
    },
    {
      title: '席位数',
      dataIndex: 'seatCount',
      key: 'seatCount',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Subscription) => (
        <Space>
          {can('PERM-SUB-MANAGE') && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/subscriptions/${record.id}`)}
            >
              详情
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 160 }}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <Select.Option key={key} value={key}>
                {config.text}
              </Select.Option>
            ))}
          </Select>
        </Space>

        {can('PERM-SUB-MANAGE') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
            新建订阅
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items || []}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.meta?.total || 0,
          showSizeChanger: true,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage);
            setPageSize(nextSize);
          },
        }}
      />

      <Modal
        title="新建订阅"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createMutation.isLoading}
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ autoRenew: true, seatCount: 1 }}
          onFinish={(values: {
            customerId: string;
            startsAt: dayjs.Dayjs;
            endsAt: dayjs.Dayjs;
            autoRenew?: boolean;
            seatCount?: number;
          }) => {
            createMutation.mutate({
              customerId: values.customerId,
              startsAt: values.startsAt.toISOString(),
              endsAt: values.endsAt.toISOString(),
              autoRenew: values.autoRenew,
              seatCount: values.seatCount,
            });
          }}
        >
          <Form.Item name="customerId" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
            <CustomerSelect allowClear={false} />
          </Form.Item>
          <Form.Item name="startsAt" label="开始时间" rules={[{ required: true, message: '请选择开始时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endsAt" label="结束时间" rules={[{ required: true, message: '请选择结束时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="autoRenew" label="自动续费" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="seatCount" label="席位数">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
