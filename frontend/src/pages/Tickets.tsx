import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Card,
  Descriptions,
  Drawer,
  Timeline,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  UserSwitchOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ticketApi } from '../services/ticket';
import { Ticket, TicketStatus, TicketPriority, CreateTicketDto } from '../types';
import dayjs from 'dayjs';

const STATUS_CONFIG: Record<TicketStatus, { color: string; text: string }> = {
  pending: { color: 'default', text: '待处理' },
  assigned: { color: 'blue', text: '已分配' },
  in_progress: { color: 'orange', text: '处理中' },
  resolved: { color: 'green', text: '已解决' },
  closed: { color: 'red', text: '已关闭' },
};

const PRIORITY_CONFIG: Record<TicketPriority, { color: string; text: string }> = {
  low: { color: 'default', text: '低' },
  normal: { color: 'blue', text: '普通' },
  high: { color: 'orange', text: '高' },
  urgent: { color: 'red', text: '紧急' },
};

export default function Tickets() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | undefined>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [createForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [resolveForm] = Form.useForm();
  const [closeForm] = Form.useForm();

  const { data, isLoading } = useQuery(
    ['tickets', page, pageSize, statusFilter, priorityFilter],
    () => ticketApi.list({ page, page_size: pageSize, status: statusFilter, priority: priorityFilter }),
    { keepPreviousData: true },
  );

  const { data: ticketDetail, refetch: refetchTicketDetail } = useQuery(
    ['ticket', selectedTicket?.id],
    () => ticketApi.get(selectedTicket!.id),
    { enabled: !!selectedTicket && isDetailDrawerOpen },
  );

  const createMutation = useMutation(ticketApi.create, {
    onSuccess: () => {
      message.success('创建成功');
      setIsCreateModalOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries(['tickets']);
    },
    onError: (error: any) => {
      message.error(error?.message || '创建失败');
    },
  });

  const assignMutation = useMutation(
    (data: { id: string; assigneeUserId: string; version: number }) =>
      ticketApi.assign(data.id, data.assigneeUserId, data.version),
    {
      onSuccess: () => {
        message.success('分配成功');
        setIsAssignModalOpen(false);
        assignForm.resetFields();
        queryClient.invalidateQueries(['tickets']);
        if (selectedTicket) {
          refetchTicketDetail();
        }
      },
      onError: (error: any) => {
        message.error(error?.message || '分配失败');
      },
    },
  );

  const startMutation = useMutation(
    (data: { id: string; version: number }) => ticketApi.start(data.id, data.version),
    {
      onSuccess: () => {
        message.success('开始处理');
        queryClient.invalidateQueries(['tickets']);
        if (selectedTicket) {
          refetchTicketDetail();
        }
      },
      onError: (error: any) => {
        message.error(error?.message || '操作失败');
      },
    },
  );

  const resolveMutation = useMutation(
    (data: { id: string; solution: string; version: number }) =>
      ticketApi.resolve(data.id, data.solution, data.version),
    {
      onSuccess: () => {
        message.success('已标记为解决');
        setIsResolveModalOpen(false);
        resolveForm.resetFields();
        queryClient.invalidateQueries(['tickets']);
        if (selectedTicket) {
          refetchTicketDetail();
        }
      },
      onError: (error: any) => {
        message.error(error?.message || '操作失败');
      },
    },
  );

  const closeMutation = useMutation(
    (data: { id: string; closeReason?: string; version: number }) =>
      ticketApi.close(data.id, data.closeReason, data.version),
    {
      onSuccess: () => {
        message.success('已关闭工单');
        setIsCloseModalOpen(false);
        closeForm.resetFields();
        queryClient.invalidateQueries(['tickets']);
        setIsDetailDrawerOpen(false);
      },
      onError: (error: any) => {
        message.error(error?.message || '操作失败');
      },
    },
  );

  const handleCreate = () => {
    createForm.validateFields().then((values) => {
      createMutation.mutate(values as CreateTicketDto);
    });
  };

  const handleAssign = () => {
    assignForm.validateFields().then((values) => {
      if (selectedTicket) {
        assignMutation.mutate({
          id: selectedTicket.id,
          assigneeUserId: values.assigneeUserId,
          version: selectedTicket.version,
        });
      }
    });
  };

  const handleResolve = () => {
    resolveForm.validateFields().then((values) => {
      if (selectedTicket) {
        resolveMutation.mutate({
          id: selectedTicket.id,
          solution: values.solution,
          version: selectedTicket.version,
        });
      }
    });
  };

  const handleClose = () => {
    closeForm.validateFields().then((values) => {
      if (selectedTicket) {
        closeMutation.mutate({
          id: selectedTicket.id,
          closeReason: values.closeReason,
          version: selectedTicket.version,
        });
      }
    });
  };

  const openDetailDrawer = (record: Ticket) => {
    setSelectedTicket(record);
    setIsDetailDrawerOpen(true);
  };

  const openAssignModal = (record: Ticket) => {
    setSelectedTicket(record);
    assignForm.resetFields();
    setIsAssignModalOpen(true);
  };

  const openResolveModal = (record: Ticket) => {
    setSelectedTicket(record);
    resolveForm.resetFields();
    setIsResolveModalOpen(true);
  };

  const openCloseModal = (record: Ticket) => {
    setSelectedTicket(record);
    closeForm.resetFields();
    setIsCloseModalOpen(true);
  };

  const handleStart = (record: Ticket) => {
    setSelectedTicket(record);
    startMutation.mutate({ id: record.id, version: record.version });
  };

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '客户', dataIndex: 'customerName', key: 'customerName' },
    { title: '负责人', dataIndex: 'assigneeUserName', key: 'assigneeUserName' },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (v: TicketPriority) => (
        <Tag color={PRIORITY_CONFIG[v]?.color}>{PRIORITY_CONFIG[v]?.text || v}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: TicketStatus) => (
        <Tag color={STATUS_CONFIG[v]?.color}>{STATUS_CONFIG[v]?.text || v}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_: any, record: Ticket) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetailDrawer(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" icon={<UserSwitchOutlined />} onClick={() => openAssignModal(record)}>
              分配
            </Button>
          )}
          {record.status === 'assigned' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleStart(record)}>
              开始
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => openResolveModal(record)}>
              解决
            </Button>
          )}
          {record.status === 'resolved' && (
            <Button type="link" size="small" icon={<CloseCircleOutlined />} onClick={() => openCloseModal(record)}>
              关闭
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 120 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            {Object.entries(STATUS_CONFIG).map(([key, { text }]) => (
              <Select.Option key={key} value={key}>
                {text}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="优先级筛选"
            allowClear
            style={{ width: 120 }}
            value={priorityFilter}
            onChange={setPriorityFilter}
          >
            {Object.entries(PRIORITY_CONFIG).map(([key, { text }]) => (
              <Select.Option key={key} value={key}>
                {text}
              </Select.Option>
            ))}
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
          新建工单
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data?.items || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.meta?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title="新建工单"
        open={isCreateModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsCreateModalOpen(false)}
        confirmLoading={createMutation.isLoading}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select allowClear>
              {Object.entries(PRIORITY_CONFIG).map(([key, { text }]) => (
                <Select.Option key={key} value={key}>
                  {text}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="customerId" label="客户ID">
            <Input placeholder="可选，关联客户" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分配工单"
        open={isAssignModalOpen}
        onOk={handleAssign}
        onCancel={() => setIsAssignModalOpen(false)}
        confirmLoading={assignMutation.isLoading}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item name="assigneeUserId" label="负责人" rules={[{ required: true, message: '请输入负责人ID' }]}>
            <Input placeholder="请输入负责人ID（后续改为用户选择器）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="标记为已解决"
        open={isResolveModalOpen}
        onOk={handleResolve}
        onCancel={() => setIsResolveModalOpen(false)}
        confirmLoading={resolveMutation.isLoading}
      >
        <Form form={resolveForm} layout="vertical">
          <Form.Item name="solution" label="解决方案" rules={[{ required: true, message: '请输入解决方案' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="关闭工单"
        open={isCloseModalOpen}
        onOk={handleClose}
        onCancel={() => setIsCloseModalOpen(false)}
        confirmLoading={closeMutation.isLoading}
      >
        <Form form={closeForm} layout="vertical">
          <Form.Item name="closeReason" label="关闭原因">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="工单详情"
        placement="right"
        width={700}
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
      >
        {ticketDetail && (
          <div>
            <Card title="基本信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="标题" span={2}>{ticketDetail.title}</Descriptions.Item>
                <Descriptions.Item label="客户">{ticketDetail.customerName || '-'}</Descriptions.Item>
                <Descriptions.Item label="负责人">{ticketDetail.assigneeUserName || '-'}</Descriptions.Item>
                <Descriptions.Item label="优先级">
                  <Tag color={PRIORITY_CONFIG[ticketDetail.priority]?.color}>
                    {PRIORITY_CONFIG[ticketDetail.priority]?.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={STATUS_CONFIG[ticketDetail.status]?.color}>
                    {STATUS_CONFIG[ticketDetail.status]?.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>{ticketDetail.description || '-'}</Descriptions.Item>
                <Descriptions.Item label="解决方案" span={2}>{ticketDetail.solution || '-'}</Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(ticketDetail.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="解决时间">
                  {ticketDetail.resolvedAt
                    ? dayjs(ticketDetail.resolvedAt).format('YYYY-MM-DD HH:mm:ss')
                    : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="处理记录">
              {ticketDetail.logs && ticketDetail.logs.length > 0 ? (
                <Timeline
                  items={ticketDetail.logs.map((item: any) => ({
                    color: 'blue',
                    children: (
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.action}</div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                        </div>
                        {item.remark && <div>{item.remark}</div>}
                      </div>
                    ),
                  }))}
                />
              ) : (
                <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无处理记录</div>
              )}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
