import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { csmApi } from '../services/csm';
import { SuccessPlan, SuccessPlanStatus } from '../types';
import { usePermission } from '../hooks/usePermission';
import { useAuthStore } from '../stores/authStore';
import CustomerSelect from '../components/CustomerSelect';

const { Text } = Typography;

const STATUS_CONFIG: Record<SuccessPlanStatus, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  active: { text: '执行中', color: 'blue' },
  on_hold: { text: '暂停', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' },
};

export default function SuccessPlanList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const user = useAuthStore((state) => state.user);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<SuccessPlanStatus | undefined>();
  const [customerIdFilter, setCustomerIdFilter] = useState<string | undefined>(
    searchParams.get('customerId') || undefined,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm] = Form.useForm();

  const { data, isLoading } = useQuery(
    ['csm-plans', page, pageSize, statusFilter, customerIdFilter],
    () =>
      csmApi.listSuccessPlans({
        page,
        page_size: pageSize,
        status: statusFilter,
        customerId: customerIdFilter,
      }),
  );

  const createMutation = useMutation(
    (values: { customerId: string; title: string; payload?: Record<string, unknown> }) => {
      if (!user?.id) {
        throw new Error('当前用户未登录');
      }
      return csmApi.createSuccessPlan({
        customerId: values.customerId,
        title: values.title,
        ownerUserId: user.id,
        payload: values.payload,
      });
    },
    {
      onSuccess: (created) => {
        message.success('成功计划已创建');
        setIsCreateOpen(false);
        createForm.resetFields();
        queryClient.invalidateQueries(['csm-plans']);
        navigate(`/workbench/csm/plans/${created.id}`);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || '创建失败');
      },
    },
  );

  const statusStats = useMemo(() => {
    const base: Record<SuccessPlanStatus, number> = {
      draft: 0,
      active: 0,
      on_hold: 0,
      completed: 0,
      cancelled: 0,
    };

    (data?.items || []).forEach((item) => {
      base[item.status] += 1;
    });

    return base;
  }, [data?.items]);

  const columns = [
    {
      title: '计划标题',
      dataIndex: 'title',
      key: 'title',
      render: (value: string, record: SuccessPlan) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/workbench/csm/plans/${record.id}`)}>
          {value}
        </Button>
      ),
    },
    {
      title: '客户ID',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (value: string) => value.slice(0, 8),
    },
    {
      title: '负责人',
      dataIndex: 'ownerUserId',
      key: 'ownerUserId',
      render: (value: string) => value.slice(0, 8),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: SuccessPlanStatus) => (
        <Tag color={STATUS_CONFIG[status]?.color}>{STATUS_CONFIG[status]?.text || status}</Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_: unknown, record: SuccessPlan) => (
        <Space>
          <Button
            size="small"
            type="link"
            onClick={() => navigate(`/workbench/csm/plans/${record.id}`)}
          >
            详情
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() => navigate(`/workbench/csm/health?customerId=${record.customerId}`)}
          >
            健康档案
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() =>
              navigate(`/workbench/csm/visits?customerId=${record.customerId}&create=1`)
            }
          >
            记录回访
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={12} lg={4}>
            <Statistic title="当前页计划数" value={data?.items?.length || 0} />
          </Col>
          <Col xs={12} lg={4}>
            <Statistic title="执行中" value={statusStats.active} />
          </Col>
          <Col xs={12} lg={4}>
            <Statistic title="暂停中" value={statusStats.on_hold} />
          </Col>
          <Col xs={12} lg={4}>
            <Statistic title="已完成" value={statusStats.completed} />
          </Col>
          <Col xs={24} lg={8}>
            <Text type="secondary">
              SuccessPlan 是成交后经营主线。每条计划可直接跳转健康档案与回访执行，避免“有计划无动作”。
            </Text>
          </Col>
        </Row>
      </Card>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space wrap>
          <CustomerSelect
            value={customerIdFilter}
            onChange={(value) => {
              setCustomerIdFilter(value);
              setPage(1);
            }}
            style={{ width: 260 }}
            placeholder="按客户筛选"
          />
          <Select
            allowClear
            placeholder="按状态筛选"
            style={{ width: 200 }}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
              <Select.Option key={key} value={key}>
                {conf.text}
              </Select.Option>
            ))}
          </Select>
        </Space>

        <Space>
          <Button onClick={() => navigate('/workbench/csm/visits')}>查看回访台账</Button>
          <Button type="primary" disabled={!can('PERM-CSM-MANAGE')} onClick={() => setIsCreateOpen(true)}>
            新建 SuccessPlan
          </Button>
        </Space>
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
        title="新建 SuccessPlan"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createMutation.isLoading}
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ customerId: customerIdFilter }}
          onFinish={(values: { customerId: string; title: string; payloadJson?: string }) => {
            let payload: Record<string, unknown> | undefined;
            if (values.payloadJson) {
              try {
                payload = JSON.parse(values.payloadJson);
              } catch {
                message.error('Payload JSON 格式无效');
                return;
              }
            }

            createMutation.mutate({
              customerId: values.customerId,
              title: values.title,
              payload,
            });
          }}
        >
          <Form.Item
            name="customerId"
            label="客户"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <CustomerSelect allowClear={false} />
          </Form.Item>
          <Form.Item
            name="title"
            label="计划标题"
            rules={[{ required: true, message: '请输入计划标题' }]}
          >
            <Input maxLength={255} placeholder="例如：Q2 续约与价值扩展计划" />
          </Form.Item>
          <Form.Item name="payloadJson" label="计划补充字段（JSON，可选）">
            <Input.TextArea rows={4} placeholder='{"goals":["完成验收","推进增购"],"cadence":"biweekly"}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
