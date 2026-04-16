import { useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { deliveryApi } from '../services/delivery';
import { DeliveryOrder, DeliveryStatus } from '../types';
import CustomerSelect from '../components/CustomerSelect';
import dayjs from 'dayjs';
import { usePermission } from '../hooks/usePermission';

const STATUS_CONFIG: Record<DeliveryStatus, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  active: { text: '进行中', color: 'blue' },
  blocked: { text: '阻塞', color: 'red' },
  ready_for_acceptance: { text: '待验收', color: 'orange' },
  accepted: { text: '已验收', color: 'green' },
  closed: { text: '已关闭', color: 'success' },
};

export default function Deliveries() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | undefined>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const orderId = searchParams.get('orderId') || undefined;
  const subscriptionId = searchParams.get('subscriptionId') || undefined;

  const listParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      status: statusFilter,
      orderId,
      subscriptionId,
    }),
    [page, pageSize, statusFilter, orderId, subscriptionId],
  );

  const { data, isLoading } = useQuery(['deliveries', listParams], () =>
    deliveryApi.list(listParams),
  );

  const createMutation = useMutation(deliveryApi.create, {
    onSuccess: (created) => {
      message.success('交付单创建成功');
      setIsCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries(['deliveries']);
      navigate(`/deliveries/${created.id}`);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      message.error(err?.message || '创建失败');
    },
  });

  const columns = [
    {
      title: '交付单号',
      dataIndex: 'deliveryNo',
      key: 'deliveryNo',
      render: (v: string, record: DeliveryOrder) => (
        <a onClick={() => navigate(`/deliveries/${record.id}`)}>{v}</a>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: DeliveryStatus) => (
        <Tag color={STATUS_CONFIG[status]?.color}>{STATUS_CONFIG[status]?.text || status}</Tag>
      ),
    },
    {
      title: '订单',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (v: string | null) => (v ? v.slice(0, 8) : '-'),
    },
    {
      title: '订阅',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      render: (v: string | null) => (v ? v.slice(0, 8) : '-'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: DeliveryOrder) => (
        <Button
          size="small"
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/deliveries/${record.id}`)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Space>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 180 }}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            {Object.entries(STATUS_CONFIG).map(([key, { text }]) => (
              <Select.Option key={key} value={key}>
                {text}
              </Select.Option>
            ))}
          </Select>
          {orderId && <Tag color="blue">来自订单：{orderId.slice(0, 8)}</Tag>}
          {subscriptionId && (
            <Tag color="purple">来自订阅：{subscriptionId.slice(0, 8)}</Tag>
          )}
        </Space>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={!can('PERM-DLV-MANAGE')}
          onClick={() => {
            form.setFieldsValue({
              orderId,
              subscriptionId,
            });
            setIsCreateOpen(true);
          }}
        >
          新建交付单
        </Button>
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
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title="新建交付单"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isLoading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values: {
            title: string;
            description?: string;
            customerId: string;
            contractId?: string;
            orderId?: string;
            subscriptionId?: string;
            targetOutcomeSummary?: string;
          }) => {
            createMutation.mutate({
              title: values.title,
              description: values.description,
              customerId: values.customerId,
              contractId: values.contractId,
              orderId: values.orderId,
              subscriptionId: values.subscriptionId,
              targetOutcomeSummary: values.targetOutcomeSummary,
            });
          }}
        >
          <Form.Item
            name="title"
            label="交付标题"
            rules={[{ required: true, message: '请输入交付标题' }]}
          >
            <Input placeholder="如：企业微信营销系统一期交付" />
          </Form.Item>

          <Form.Item
            name="customerId"
            label="客户"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <CustomerSelect />
          </Form.Item>

          <Form.Item name="contractId" label="关联合同ID">
            <Input placeholder="可选" />
          </Form.Item>

          <Form.Item name="orderId" label="关联订单ID">
            <Input placeholder="可选" />
          </Form.Item>

          <Form.Item name="subscriptionId" label="关联订阅ID">
            <Input placeholder="可选" />
          </Form.Item>

          <Form.Item name="description" label="实施说明">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="targetOutcomeSummary" label="目标结果">
            <Input.TextArea rows={2} placeholder="客户承诺结果/验收口径" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
