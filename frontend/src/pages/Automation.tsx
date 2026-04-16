import { useState } from "react";
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
} from "antd";
import {
  PlusOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { automationApi, AutomationTrigger, AutomationFlow } from "../services/automation";
import { usePermission } from "../hooks/usePermission";

const TRIGGER_STATUS_CONFIG = {
  active: { text: "运行中", color: "green" },
  paused: { text: "已暂停", color: "orange" },
  archived: { text: "已归档", color: "default" },
};

const FLOW_STATUS_CONFIG = {
  draft: { text: "草稿", color: "default" },
  active: { text: "运行中", color: "green" },
  paused: { text: "已暂停", color: "orange" },
  archived: { text: "已归档", color: "default" },
};

const EVENT_TYPES = [
  "contract.status_changed",
  "contract.expiry_warning",
  "order.status_changed",
  "payment.status_changed",
  "subscription.status_changed",
  "subscription.renewed",
  "quote.status_changed",
  "opportunity.stage_changed",
  "opportunity.result_changed",
];

const ACTION_TYPES = [
  { value: "notify_csm", label: "通知CSM（健康度重新评估）" },
  { value: "send_notification", label: "发送通知" },
  { value: "log", label: "仅记录日志" },
];

export default function Automation() {
  const [activeTab, setActiveTab] = useState("triggers");
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [flowModalOpen, setFlowModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<AutomationTrigger | null>(null);
  const [editingFlow, setEditingFlow] = useState<AutomationFlow | null>(null);
  const [triggerForm] = Form.useForm();
  const [flowForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const canManage = can("PERM-AUTO-MANAGE");
  const canExecute = can("PERM-AUTO-EXECUTE");

  const { data: triggersData, isLoading: triggersLoading } = useQuery(
    ["automation-triggers"],
    () => automationApi.listTriggers()
  );

  const { data: flowsData, isLoading: flowsLoading } = useQuery(
    ["automation-flows"],
    () => automationApi.listFlows()
  );

  const createTriggerMutation = useMutation(
    (data: any) => automationApi.createTrigger(data),
    { onSuccess: () => { queryClient.invalidateQueries(["automation-triggers"]); message.success("触发器创建成功"); setTriggerModalOpen(false); triggerForm.resetFields(); } }
  );

  const updateTriggerMutation = useMutation(
    (data: any) => automationApi.updateTrigger(editingTrigger!.id, data),
    { onSuccess: () => { queryClient.invalidateQueries(["automation-triggers"]); message.success("触发器更新成功"); setTriggerModalOpen(false); setEditingTrigger(null); triggerForm.resetFields(); } }
  );

  const deleteTriggerMutation = useMutation(
    (id: string) => automationApi.deleteTrigger(id),
    { onSuccess: () => { queryClient.invalidateQueries(["automation-triggers"]); message.success("触发器删除成功"); } }
  );

  const createFlowMutation = useMutation(
    (data: any) => automationApi.createFlow(data),
    { onSuccess: () => { queryClient.invalidateQueries(["automation-flows"]); message.success("流程创建成功"); setFlowModalOpen(false); flowForm.resetFields(); } }
  );

  const updateFlowMutation = useMutation(
    (data: any) => automationApi.updateFlow(editingFlow!.id, data),
    { onSuccess: () => { queryClient.invalidateQueries(["automation-flows"]); message.success("流程更新成功"); setFlowModalOpen(false); setEditingFlow(null); flowForm.resetFields(); } }
  );

  const deleteFlowMutation = useMutation(
    (id: string) => automationApi.deleteFlow(id),
    { onSuccess: () => { queryClient.invalidateQueries(["automation-flows"]); message.success("流程删除成功"); } }
  );

  const executeFlowMutation = useMutation(
    (id: string) => automationApi.executeFlow(id),
    { onSuccess: () => { message.success("流程执行已触发"); queryClient.invalidateQueries(["automation-flows"]); } }
  );

  const triggers = triggersData?.items || [];
  const flows = flowsData?.items || [];

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

  const triggerColumns = [
    { title: "名称", dataIndex: "name", key: "name" },
    { title: "事件类型", dataIndex: "eventType", key: "eventType", render: (v: string) => <Tag>{v}</Tag> },
    { title: "动作类型", dataIndex: "actionType", key: "actionType", render: (v: string) => <Tag color="blue">{v}</Tag> },
    {
      title: "状态", dataIndex: "status", key: "status",
      render: (status: keyof typeof TRIGGER_STATUS_CONFIG) => {
        const cfg = TRIGGER_STATUS_CONFIG[status];
        return <Tag color={cfg?.color}>{cfg?.text || status}</Tag>;
      },
    },
    { title: "执行次数", dataIndex: "executionCount", key: "executionCount" },
    { title: "失败次数", dataIndex: "failureCount", key: "failureCount" },
    {
      title: "操作", key: "actions",
      render: (_: any, record: AutomationTrigger) => (
        <Space>
          {canManage && (
            <Button size="small" onClick={() => {
              setEditingTrigger(record);
              triggerForm.setFieldsValue(record);
              setTriggerModalOpen(true);
            }}>编辑</Button>
          )}
          {canManage && record.status === "active" && (
            <Button size="small" onClick={() => {
              updateTriggerMutation.mutate({ id: record.id, status: "paused", version: record.version });
            }}>暂停</Button>
          )}
          {canManage && record.status === "paused" && (
            <Button size="small" type="primary" onClick={() => {
              updateTriggerMutation.mutate({ id: record.id, status: "active", version: record.version });
            }}>启用</Button>
          )}
          {canManage && record.status !== "active" && (
            <Popconfirm title="确定删除此触发器？" onConfirm={() => deleteTriggerMutation.mutate(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const flowColumns = [
    { title: "编码", dataIndex: "code", key: "code" },
    { title: "名称", dataIndex: "name", key: "name" },
    { title: "触发类型", dataIndex: "triggerType", key: "triggerType", render: (v: string) => <Tag>{v}</Tag> },
    { title: "触发事件", dataIndex: "triggerEventType", key: "triggerEventType", render: (v: string) => v ? <Tag color="purple">{v}</Tag> : "-" },
    {
      title: "状态", dataIndex: "status", key: "status",
      render: (status: keyof typeof FLOW_STATUS_CONFIG) => {
        const cfg = FLOW_STATUS_CONFIG[status];
        return <Tag color={cfg?.color}>{cfg?.text || status}</Tag>;
      },
    },
    { title: "步骤数", key: "steps", render: (_: any, record: AutomationFlow) => record.definition?.length || 0 },
    { title: "执行次数", dataIndex: "executionCount", key: "executionCount" },
    {
      title: "操作", key: "actions",
      render: (_: any, record: AutomationFlow) => (
        <Space>
          {canExecute && record.status === "active" && (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => executeFlowMutation.mutate(record.id)}>
              执行
            </Button>
          )}
          {canManage && (
            <Button size="small" onClick={() => {
              setEditingFlow(record);
              flowForm.setFieldsValue(record);
              setFlowModalOpen(true);
            }}>编辑</Button>
          )}
          {canManage && record.status !== "active" && (
            <Popconfirm title="确定删除此流程？" onConfirm={() => deleteFlowMutation.mutate(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
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
            key: "triggers",
            label: "触发器",
            children: (
              <>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                  <h2><ThunderboltOutlined /> 自动化触发器</h2>
                  {canManage && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingTrigger(null); triggerForm.resetFields(); setTriggerModalOpen(true); }}>
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
            key: "flows",
            label: "流程编排",
            children: (
              <>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                  <h2><PlayCircleOutlined /> 自动化流程</h2>
                  {canManage && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingFlow(null); flowForm.resetFields(); setFlowModalOpen(true); }}>
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
        title={editingTrigger ? "编辑触发器" : "新建触发器"}
        open={triggerModalOpen}
        onOk={handleTriggerSubmit}
        onCancel={() => { setTriggerModalOpen(false); setEditingTrigger(null); triggerForm.resetFields(); }}
        confirmLoading={createTriggerMutation.isLoading || updateTriggerMutation.isLoading}
      >
        <Form form={triggerForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: "请输入触发器名称" }]}>
            <Input placeholder="例如：合同到期预警触发器" />
          </Form.Item>
          <Form.Item name="eventType" label="监听事件" rules={[{ required: true, message: "请选择事件类型" }]}>
            <Select placeholder="选择要监听的事件" options={EVENT_TYPES.map(e => ({ value: e, label: e }))} />
          </Form.Item>
          <Form.Item name="actionType" label="执行动作" rules={[{ required: true, message: "请选择动作类型" }]}>
            <Select placeholder="选择触发后执行的动作" options={ACTION_TYPES} />
          </Form.Item>
          {editingTrigger && (
            <Form.Item name="status" label="状态">
              <Select options={[
                { value: "active", label: "运行中" },
                { value: "paused", label: "已暂停" },
                { value: "archived", label: "已归档" },
              ]} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={editingFlow ? "编辑流程" : "新建流程"}
        open={flowModalOpen}
        onOk={handleFlowSubmit}
        onCancel={() => { setFlowModalOpen(false); setEditingFlow(null); flowForm.resetFields(); }}
        confirmLoading={createFlowMutation.isLoading || updateFlowMutation.isLoading}
        width={600}
      >
        <Form form={flowForm} layout="vertical">
          <Form.Item name="code" label="编码" rules={[{ required: true, message: "请输入流程编码" }]}>
            <Input placeholder="例如：contract-expiry-flow" disabled={!!editingFlow} />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: "请输入流程名称" }]}>
            <Input placeholder="例如：合同到期处理流程" />
          </Form.Item>
          <Form.Item name="triggerType" label="触发类型" rules={[{ required: true, message: "请选择触发类型" }]}>
            <Select placeholder="选择触发类型" options={[
              { value: "event", label: "事件触发" },
              { value: "schedule", label: "定时触发" },
              { value: "manual", label: "手动触发" },
            ]} />
          </Form.Item>
          <Form.Item name="triggerEventType" label="触发事件类型">
            <Select placeholder="选择触发事件（事件触发时必填）" options={EVENT_TYPES.map(e => ({ value: e, label: e }))} allowClear />
          </Form.Item>
          {editingFlow && (
            <Form.Item name="status" label="状态">
              <Select options={[
                { value: "draft", label: "草稿" },
                { value: "active", label: "运行中" },
                { value: "paused", label: "已暂停" },
                { value: "archived", label: "已归档" },
              ]} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
