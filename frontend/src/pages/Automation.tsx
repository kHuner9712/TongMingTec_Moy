import { useMemo, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Tabs,
  message,
  Popconfirm,
  Card,
  List,
  Typography,
  Alert,
  Drawer,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  RocketOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  automationApi,
  AutomationTrigger,
  AutomationFlow,
  AutomationRun,
  AutomationStep,
  AutomationTemplate,
} from '../services/automation';
import { usePermission } from '../hooks/usePermission';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const TRIGGER_STATUS_CONFIG = {
  active: { text: '运行中', color: 'green' },
  paused: { text: '已暂停', color: 'orange' },
  archived: { text: '已归档', color: 'default' },
};

const FLOW_STATUS_CONFIG = {
  draft: { text: '草稿', color: 'default' },
  active: { text: '运行中', color: 'green' },
  paused: { text: '已暂停', color: 'orange' },
  archived: { text: '已归档', color: 'default' },
};

const RUN_STATUS_CONFIG: Record<string, { text: string; color: string }> = {
  pending: { text: '待执行', color: 'default' },
  running: { text: '执行中', color: 'processing' },
  awaiting_approval: { text: '待审批', color: 'gold' },
  completed: { text: '已完成', color: 'green' },
  failed: { text: '失败', color: 'red' },
  cancelled: { text: '已取消', color: 'default' },
};

const STEP_STATUS_CONFIG: Record<string, { text: string; color: string }> = {
  pending: { text: '待执行', color: 'default' },
  running: { text: '执行中', color: 'processing' },
  awaiting_approval: { text: '待审批', color: 'gold' },
  completed: { text: '已完成', color: 'green' },
  failed: { text: '失败', color: 'red' },
  skipped: { text: '已跳过', color: 'default' },
};

const EVENT_TYPES = [
  'contract.status_changed',
  'contract.expiry_warning',
  'order.status_changed',
  'payment.status_changed',
  'subscription.status_changed',
  'subscription.renewed',
  'quote.status_changed',
  'opportunity.stage_changed',
  'opportunity.result_changed',
  'delivery.risk_reported',
  'dash.metric_anomaly',
  'approval.status_changed',
];

const ACTION_TYPES = [
  { value: 'notify_csm', label: '触发 CSM 健康评估' },
  { value: 'send_notification', label: '发送通知' },
  { value: 'create_csm_followup_task', label: '创建 CSM 跟进任务' },
  { value: 'append_csm_risk_signal', label: '写入 CSM 风险视图' },
  { value: 'create_service_attention', label: '创建服务关注项' },
  { value: 'log', label: '仅记录日志' },
];

export default function Automation() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('templates');
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [flowModalOpen, setFlowModalOpen] = useState(false);
  const [runDrawerOpen, setRunDrawerOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<AutomationRun | null>(null);
  const [editingTrigger, setEditingTrigger] = useState<AutomationTrigger | null>(null);
  const [editingFlow, setEditingFlow] = useState<AutomationFlow | null>(null);
  const [triggerForm] = Form.useForm();
  const [flowForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { can } = usePermission();

  const canManage = can('PERM-AUTO-MANAGE');
  const canExecute = can('PERM-AUTO-EXECUTE');

  const { data: triggersData, isLoading: triggersLoading } = useQuery(
    ['automation-triggers'],
    () => automationApi.listTriggers(),
    { enabled: canManage },
  );

  const { data: flowsData, isLoading: flowsLoading } = useQuery(
    ['automation-flows'],
    () => automationApi.listFlows(),
    { enabled: canManage },
  );

  const { data: templatesData, isLoading: templatesLoading } = useQuery(
    ['automation-templates'],
    () => automationApi.listTemplates(),
    { enabled: canManage },
  );

  const { data: runsData, isLoading: runsLoading } = useQuery(
    ['automation-runs'],
    () => automationApi.listRuns({ page: 1, page_size: 50 }),
    { enabled: canManage },
  );

  const { data: runSteps, isLoading: runStepsLoading } = useQuery(
    ['automation-run-steps', selectedRun?.id],
    () => automationApi.getRunSteps(selectedRun?.id || ''),
    { enabled: !!selectedRun?.id && runDrawerOpen && canManage },
  );

  const createTriggerMutation = useMutation(
    (data: any) => automationApi.createTrigger(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['automation-triggers']);
        message.success('触发器创建成功');
        setTriggerModalOpen(false);
        triggerForm.resetFields();
      },
    },
  );

  const updateTriggerMutation = useMutation(
    (data: any) => automationApi.updateTrigger(editingTrigger!.id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['automation-triggers']);
        message.success('触发器更新成功');
        setTriggerModalOpen(false);
        setEditingTrigger(null);
        triggerForm.resetFields();
      },
    },
  );

  const deleteTriggerMutation = useMutation((id: string) => automationApi.deleteTrigger(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-triggers']);
      message.success('触发器删除成功');
    },
  });

  const createFlowMutation = useMutation((data: any) => automationApi.createFlow(data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-flows']);
      message.success('流程创建成功');
      setFlowModalOpen(false);
      flowForm.resetFields();
    },
  });

  const updateFlowMutation = useMutation(
    (data: any) => automationApi.updateFlow(editingFlow!.id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['automation-flows']);
        message.success('流程更新成功');
        setFlowModalOpen(false);
        setEditingFlow(null);
        flowForm.resetFields();
      },
    },
  );

  const deleteFlowMutation = useMutation((id: string) => automationApi.deleteFlow(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-flows']);
      message.success('流程删除成功');
    },
  });

  const executeFlowMutation = useMutation((id: string) => automationApi.executeFlow(id), {
    onSuccess: () => {
      message.success('流程已触发执行');
      queryClient.invalidateQueries(['automation-flows']);
      queryClient.invalidateQueries(['automation-runs']);
    },
  });

  const installTemplateMutation = useMutation(
    (code: string) => automationApi.installTemplate(code),
    {
      onSuccess: () => {
        message.success('模板安装成功并已接入运行');
        queryClient.invalidateQueries(['automation-templates']);
        queryClient.invalidateQueries(['automation-flows']);
      },
    },
  );

  const takeoverRunMutation = useMutation(
    (runId: string) => automationApi.takeoverRun(runId, '人工接管自动化执行'),
    {
      onSuccess: () => {
        message.success('已接管该运行');
        queryClient.invalidateQueries(['automation-runs']);
      },
    },
  );

  const confirmRunMutation = useMutation(
    (runId: string) => automationApi.confirmRun(runId, '人工确认自动化结果'),
    {
      onSuccess: () => {
        message.success('运行结果已确认');
        queryClient.invalidateQueries(['automation-runs']);
      },
    },
  );

  const triggers = triggersData?.items || [];
  const flows = flowsData?.items || [];
  const templates = (templatesData || []) as AutomationTemplate[];
  const runs = runsData?.items || [];

  const flowMap = useMemo(() => {
    const map = new Map<string, AutomationFlow>();
    flows.forEach((flow) => map.set(flow.id, flow));
    return map;
  }, [flows]);

  const handleTriggerSubmit = () => {
    triggerForm.validateFields().then((values) => {
      if (editingTrigger) {
        updateTriggerMutation.mutate({ ...values, version: editingTrigger.version });
      } else {
        createTriggerMutation.mutate(values);
      }
    });
  };

  const handleFlowSubmit = () => {
    flowForm.validateFields().then((values) => {
      if (editingFlow) {
        updateFlowMutation.mutate({ ...values, version: editingFlow.version });
      } else {
        createFlowMutation.mutate(values);
      }
    });
  };

  const renderStatus = (status: string, map: Record<string, { text: string; color: string }>) => {
    const cfg = map[status];
    return <Tag color={cfg?.color || 'default'}>{cfg?.text || status}</Tag>;
  };

  const renderBusinessLinks = (
    refs: Array<{ type: string; id: string; path?: string; label?: string }>,
  ) => {
    if (!refs.length) return <Text type="secondary">-</Text>;

    return (
      <Space wrap>
        {refs.map((ref) => {
          const path = ref.path || resolvePathByRef(ref.type, ref.id);
          return (
            <Button
              key={`${ref.type}-${ref.id}`}
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => path && navigate(path)}
            >
              {ref.label || `${ref.type}:${ref.id.slice(0, 8)}`}
            </Button>
          );
        })}
      </Space>
    );
  };

  const triggerColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '事件类型',
      dataIndex: 'eventType',
      key: 'eventType',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: '动作类型',
      dataIndex: 'actionType',
      key: 'actionType',
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => renderStatus(status, TRIGGER_STATUS_CONFIG),
    },
    { title: '执行次数', dataIndex: 'executionCount', key: 'executionCount' },
    { title: '失败次数', dataIndex: 'failureCount', key: 'failureCount' },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: AutomationTrigger) => (
        <Space>
          {canManage && (
            <Button
              size="small"
              onClick={() => {
                setEditingTrigger(record);
                triggerForm.setFieldsValue(record);
                setTriggerModalOpen(true);
              }}
            >
              编辑
            </Button>
          )}
          {canManage && record.status === 'active' && (
            <Button
              size="small"
              onClick={() => {
                updateTriggerMutation.mutate({ status: 'paused', version: record.version });
              }}
            >
              暂停
            </Button>
          )}
          {canManage && record.status === 'paused' && (
            <Button
              size="small"
              type="primary"
              onClick={() => {
                updateTriggerMutation.mutate({ status: 'active', version: record.version });
              }}
            >
              启用
            </Button>
          )}
          {canManage && record.status !== 'active' && (
            <Popconfirm
              title="确定删除该触发器？"
              onConfirm={() => deleteTriggerMutation.mutate(record.id)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const flowColumns = [
    { title: '编码', dataIndex: 'code', key: 'code' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '触发类型',
      dataIndex: 'triggerType',
      key: 'triggerType',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: '触发事件',
      dataIndex: 'triggerEventType',
      key: 'triggerEventType',
      render: (value: string) => (value ? <Tag color="purple">{value}</Tag> : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => renderStatus(status, FLOW_STATUS_CONFIG),
    },
    {
      title: '步骤数',
      key: 'steps',
      render: (_: unknown, record: AutomationFlow) => record.definition?.length || 0,
    },
    { title: '执行次数', dataIndex: 'executionCount', key: 'executionCount' },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: AutomationFlow) => (
        <Space>
          {canExecute && record.status === 'active' && (
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => executeFlowMutation.mutate(record.id)}
            >
              执行
            </Button>
          )}
          {canManage && (
            <Button
              size="small"
              onClick={() => {
                setEditingFlow(record);
                flowForm.setFieldsValue(record);
                setFlowModalOpen(true);
              }}
            >
              编辑
            </Button>
          )}
          {canManage && record.status !== 'active' && (
            <Popconfirm
              title="确定删除该流程？"
              onConfirm={() => deleteFlowMutation.mutate(record.id)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const runColumns = [
    {
      title: '流程',
      key: 'flow',
      render: (_: unknown, record: AutomationRun) => {
        const flow = flowMap.get(record.flowId);
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{flow?.name || record.flowId.slice(0, 8)}</Text>
            <Text type="secondary">{flow?.code || record.flowId}</Text>
          </Space>
        );
      },
    },
    {
      title: '触发来源',
      key: 'trigger',
      render: (_: unknown, record: AutomationRun) => (
        <Space direction="vertical" size={0}>
          <Text>{record.triggerEventType || 'manual'}</Text>
          <Text type="secondary">{record.triggeredByType}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => renderStatus(status, RUN_STATUS_CONFIG),
    },
    {
      title: '失败原因',
      key: 'error',
      render: (_: unknown, record: AutomationRun) => {
        if (!record.errorCode && !record.errorMessage) return <Text type="secondary">-</Text>;
        return (
          <Space direction="vertical" size={0}>
            {record.errorCode && <Text type="danger">{record.errorCode}</Text>}
            {record.errorMessage && <Text type="secondary">{record.errorMessage}</Text>}
          </Space>
        );
      },
    },
    {
      title: '业务对象',
      key: 'businessContext',
      render: (_: unknown, record: AutomationRun) =>
        renderBusinessLinks(extractBusinessRefsFromContext(record.businessContext)),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: AutomationRun) => (
        <Space>
          <Button
            size="small"
            icon={<FileSearchOutlined />}
            onClick={() => {
              setSelectedRun(record);
              setRunDrawerOpen(true);
            }}
          >
            运行详情
          </Button>
          {canExecute && ['running', 'awaiting_approval'].includes(record.status) && (
            <Button
              size="small"
              icon={<WarningOutlined />}
              onClick={() => takeoverRunMutation.mutate(record.id)}
            >
              人工接管
            </Button>
          )}
          {canExecute && ['completed', 'failed', 'cancelled'].includes(record.status) && (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => confirmRunMutation.mutate(record.id)}
            >
              人工确认
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'templates',
            label: '推荐模板',
            children: (
              <>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="结果链动作闭环模板"
                  description="围绕合同到期、交付高风险、线索漏跟进率与首响异常，直接安装可运行模板。"
                />
                <List
                  loading={templatesLoading}
                  dataSource={templates}
                  grid={{ gutter: 16, xs: 1, md: 2 }}
                  renderItem={(item) => (
                    <List.Item>
                      <Card
                        title={
                          <Space>
                            <RocketOutlined />
                            <span>{item.name}</span>
                          </Space>
                        }
                        extra={
                          item.installed ? (
                            <Tag color="green">已安装</Tag>
                          ) : (
                            <Tag color="blue">推荐</Tag>
                          )
                        }
                        actions={[
                          <Button
                            key="install"
                            type="link"
                            icon={<SyncOutlined />}
                            loading={installTemplateMutation.isLoading}
                            onClick={() => installTemplateMutation.mutate(item.code)}
                          >
                            {item.installed ? '更新模板' : '安装模板'}
                          </Button>,
                        ]}
                      >
                        <Space direction="vertical" size={6} style={{ width: '100%' }}>
                          <Text type="secondary">{item.description}</Text>
                          <Space>
                            <Tag>{item.triggerEventType}</Tag>
                            <Tag color="purple">{item.category}</Tag>
                          </Space>
                          <Text type="secondary">步骤：{item.steps.map((step) => step.actionType).join(' -> ')}</Text>
                        </Space>
                      </Card>
                    </List.Item>
                  )}
                />
              </>
            ),
          },
          {
            key: 'runs',
            label: '运行记录',
            children: (
              <>
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="可追踪性说明"
                  description="每次运行会记录触发来源、触发条件、步骤动作、执行结果、失败原因，以及是否经过人工接管/确认。"
                />
                <Table
                  columns={runColumns}
                  dataSource={runs}
                  rowKey="id"
                  loading={runsLoading}
                  pagination={{ pageSize: 20 }}
                />
              </>
            ),
          },
          {
            key: 'triggers',
            label: '触发器',
            children: (
              <>
                <div
                  style={{
                    marginBottom: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <h2>
                    <ThunderboltOutlined /> 自动化触发器
                  </h2>
                  {canManage && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingTrigger(null);
                        triggerForm.resetFields();
                        setTriggerModalOpen(true);
                      }}
                    >
                      新建触发器
                    </Button>
                  )}
                </div>
                <Table
                  columns={triggerColumns}
                  dataSource={triggers}
                  rowKey="id"
                  loading={triggersLoading}
                  pagination={{ pageSize: 20 }}
                />
              </>
            ),
          },
          {
            key: 'flows',
            label: '流程编排',
            children: (
              <>
                <div
                  style={{
                    marginBottom: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <h2>
                    <PlayCircleOutlined /> 自动化流程
                  </h2>
                  {canManage && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingFlow(null);
                        flowForm.resetFields();
                        setFlowModalOpen(true);
                      }}
                    >
                      新建流程
                    </Button>
                  )}
                </div>
                <Table
                  columns={flowColumns}
                  dataSource={flows}
                  rowKey="id"
                  loading={flowsLoading}
                  pagination={{ pageSize: 20 }}
                />
              </>
            ),
          },
        ]}
      />

      <Modal
        title={editingTrigger ? '编辑触发器' : '新建触发器'}
        open={triggerModalOpen}
        onOk={handleTriggerSubmit}
        onCancel={() => {
          setTriggerModalOpen(false);
          setEditingTrigger(null);
          triggerForm.resetFields();
        }}
        confirmLoading={createTriggerMutation.isLoading || updateTriggerMutation.isLoading}
      >
        <Form form={triggerForm} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入触发器名称' }]}
          >
            <Input placeholder="例如：合同到期预警触发器" />
          </Form.Item>
          <Form.Item
            name="eventType"
            label="监听事件"
            rules={[{ required: true, message: '请选择事件类型' }]}
          >
            <Select
              placeholder="选择要监听的事件"
              options={EVENT_TYPES.map((eventType) => ({ value: eventType, label: eventType }))}
            />
          </Form.Item>
          <Form.Item
            name="actionType"
            label="执行动作"
            rules={[{ required: true, message: '请选择动作类型' }]}
          >
            <Select placeholder="选择触发后的动作" options={ACTION_TYPES} />
          </Form.Item>
          {editingTrigger && (
            <Form.Item name="status" label="状态">
              <Select
                options={[
                  { value: 'active', label: '运行中' },
                  { value: 'paused', label: '已暂停' },
                  { value: 'archived', label: '已归档' },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={editingFlow ? '编辑流程' : '新建流程'}
        open={flowModalOpen}
        onOk={handleFlowSubmit}
        onCancel={() => {
          setFlowModalOpen(false);
          setEditingFlow(null);
          flowForm.resetFields();
        }}
        confirmLoading={createFlowMutation.isLoading || updateFlowMutation.isLoading}
        width={640}
      >
        <Form form={flowForm} layout="vertical">
          <Form.Item
            name="code"
            label="编码"
            rules={[{ required: true, message: '请输入流程编码' }]}
          >
            <Input placeholder="例如：contract-expiry-flow" disabled={!!editingFlow} />
          </Form.Item>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入流程名称' }]}
          >
            <Input placeholder="例如：合同到期处理流程" />
          </Form.Item>
          <Form.Item
            name="triggerType"
            label="触发类型"
            rules={[{ required: true, message: '请选择触发类型' }]}
          >
            <Select
              options={[
                { value: 'event', label: '事件触发' },
                { value: 'schedule', label: '定时触发' },
                { value: 'manual', label: '手动触发' },
              ]}
            />
          </Form.Item>
          <Form.Item name="triggerEventType" label="触发事件类型">
            <Select
              options={EVENT_TYPES.map((eventType) => ({
                value: eventType,
                label: eventType,
              }))}
              allowClear
            />
          </Form.Item>
          {editingFlow && (
            <Form.Item name="status" label="状态">
              <Select
                options={[
                  { value: 'draft', label: '草稿' },
                  { value: 'active', label: '运行中' },
                  { value: 'paused', label: '已暂停' },
                  { value: 'archived', label: '已归档' },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Drawer
        title={selectedRun ? `运行详情 · ${selectedRun.id.slice(0, 8)}` : '运行详情'}
        width={860}
        open={runDrawerOpen}
        onClose={() => {
          setRunDrawerOpen(false);
          setSelectedRun(null);
        }}
      >
        {selectedRun && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="状态">
                {renderStatus(selectedRun.status, RUN_STATUS_CONFIG)}
              </Descriptions.Item>
              <Descriptions.Item label="触发事件">
                {selectedRun.triggerEventType || 'manual'}
              </Descriptions.Item>
              <Descriptions.Item label="触发者类型">{selectedRun.triggeredByType}</Descriptions.Item>
              <Descriptions.Item label="审批态">{selectedRun.approvalState || '-'}</Descriptions.Item>
              <Descriptions.Item label="失败码">{selectedRun.errorCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="失败原因">
                {selectedRun.errorMessage || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="业务对象链接">
              {renderBusinessLinks(extractBusinessRefsFromContext(selectedRun.businessContext))}
            </Card>

            <Card size="small" title="步骤记录" loading={runStepsLoading}>
              <Table
                rowKey="id"
                pagination={false}
                size="small"
                dataSource={(runSteps || []) as AutomationStep[]}
                columns={[
                  { title: '步骤编码', dataIndex: 'stepCode', key: 'stepCode' },
                  { title: '动作类型', dataIndex: 'stepType', key: 'stepType' },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: string) => renderStatus(status, STEP_STATUS_CONFIG),
                  },
                  {
                    title: '审批',
                    key: 'approval',
                    render: (_: unknown, step: AutomationStep) =>
                      step.approvalRequestId ? (
                        <Space direction="vertical" size={0}>
                          <Tag color="gold">需审批</Tag>
                          <Text type="secondary">{step.approvalRequestId.slice(0, 8)}</Text>
                        </Space>
                      ) : (
                        <Text type="secondary">-</Text>
                      ),
                  },
                  {
                    title: '失败原因',
                    key: 'error',
                    render: (_: unknown, step: AutomationStep) =>
                      step.errorMessage ? (
                        <Text type="danger">{step.errorMessage}</Text>
                      ) : (
                        <Text type="secondary">-</Text>
                      ),
                  },
                  {
                    title: '业务对象',
                    key: 'refs',
                    render: (_: unknown, step: AutomationStep) => {
                      const outputRefs = extractBusinessRefsFromOutput(step.outputPayload);
                      return renderBusinessLinks(outputRefs);
                    },
                  },
                ]}
              />
            </Card>
          </Space>
        )}
      </Drawer>
    </div>
  );
}

function resolvePathByRef(type: string, id: string): string | null {
  if (type === 'customer') return `/workbench/csm/health?customerId=${id}`;
  if (type === 'contract') return `/contracts/${id}`;
  if (type === 'order') return `/orders/${id}`;
  if (type === 'payment') return `/payments/${id}`;
  if (type === 'subscription') return `/subscriptions/${id}`;
  if (type === 'delivery') return `/deliveries/${id}`;
  if (type === 'task') return '/workbench';
  if (type === 'conversation') return '/workbench/conversation';
  if (type === 'ticket') return '/tickets';
  if (type === 'metric') return '/cockpit';
  return null;
}

function extractBusinessRefsFromContext(
  context: Record<string, unknown> | null,
): Array<{ type: string; id: string; label?: string; path?: string }> {
  if (!context || typeof context !== 'object') return [];

  const mapping: Array<{ key: string; type: string; label: string }> = [
    { key: 'customerId', type: 'customer', label: '客户视图' },
    { key: 'contractId', type: 'contract', label: '合同详情' },
    { key: 'orderId', type: 'order', label: '订单详情' },
    { key: 'paymentId', type: 'payment', label: '付款详情' },
    { key: 'subscriptionId', type: 'subscription', label: '订阅详情' },
    { key: 'deliveryId', type: 'delivery', label: '交付详情' },
    { key: 'conversationId', type: 'conversation', label: '会话工作台' },
    { key: 'ticketId', type: 'ticket', label: '工单列表' },
  ];

  const refs: Array<{ type: string; id: string; label?: string; path?: string }> = [];

  for (const item of mapping) {
    const id = context[item.key];
    if (!id || typeof id !== 'string') continue;
    refs.push({
      type: item.type,
      id,
      label: item.label,
    });
  }

  return refs;
}

function extractBusinessRefsFromOutput(
  outputPayload: Record<string, unknown> | null,
): Array<{ type: string; id: string; label?: string; path?: string }> {
  if (!outputPayload) return [];

  const refs = outputPayload.businessRefs;
  if (!Array.isArray(refs)) return [];

  const parsed: Array<{ type: string; id: string; label?: string; path?: string }> = [];

  for (const item of refs) {
    if (!item || typeof item !== 'object') continue;
    const ref = item as Record<string, unknown>;
    if (typeof ref.type !== 'string' || typeof ref.id !== 'string') continue;

    parsed.push({
      type: ref.type,
      id: ref.id,
      label: typeof ref.label === 'string' ? ref.label : undefined,
      path: typeof ref.path === 'string' ? ref.path : undefined,
    });
  }

  return parsed;
}
