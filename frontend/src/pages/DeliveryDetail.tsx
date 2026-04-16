import { useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Steps,
  Table,
  Tag,
  message,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { deliveryApi } from '../services/delivery';
import {
  DeliveryAcceptanceResult,
  DeliveryMilestoneStatus,
  DeliveryOutcomeStatus,
  DeliveryRiskSeverity,
  DeliveryStatus,
} from '../types';
import { usePermission } from '../hooks/usePermission';

const STATUS_CONFIG: Record<DeliveryStatus, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  active: { text: '进行中', color: 'blue' },
  blocked: { text: '阻塞', color: 'red' },
  ready_for_acceptance: { text: '待验收', color: 'orange' },
  accepted: { text: '已验收', color: 'green' },
  closed: { text: '已关闭', color: 'success' },
};

const STATUS_STEPS: DeliveryStatus[] = [
  'draft',
  'active',
  'blocked',
  'ready_for_acceptance',
  'accepted',
  'closed',
];

export default function DeliveryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermission();

  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [riskOpen, setRiskOpen] = useState(false);
  const [acceptanceOpen, setAcceptanceOpen] = useState(false);
  const [outcomeOpen, setOutcomeOpen] = useState(false);

  const [milestoneForm] = Form.useForm();
  const [taskForm] = Form.useForm();
  const [riskForm] = Form.useForm();
  const [acceptanceForm] = Form.useForm();
  const [outcomeForm] = Form.useForm();

  const { data, isLoading } = useQuery(['delivery', id], () => deliveryApi.get(id || ''), {
    enabled: !!id,
  });

  const refreshDetail = () => {
    queryClient.invalidateQueries(['delivery', id]);
    queryClient.invalidateQueries(['deliveries']);
  };

  const changeStatusMutation = useMutation(
    (payload: { status: DeliveryStatus; reason?: string; version: number }) =>
      deliveryApi.changeStatus(id || '', payload),
    {
      onSuccess: () => {
        message.success('状态更新成功');
        refreshDetail();
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || '状态更新失败');
      },
    },
  );

  const createMilestoneMutation = useMutation(
    (payload: {
      title: string;
      description?: string;
      sequence?: number;
      status?: DeliveryMilestoneStatus;
    }) => deliveryApi.createMilestone(id || '', payload),
    {
      onSuccess: () => {
        message.success('里程碑已创建');
        setMilestoneOpen(false);
        milestoneForm.resetFields();
        refreshDetail();
      },
      onError: () => {
        message.error('创建失败');
      },
    },
  );

  const createTaskMutation = useMutation(
    (payload: { title: string; description?: string }) =>
      deliveryApi.createTask(id || '', payload),
    {
      onSuccess: () => {
        message.success('交付任务已创建');
        setTaskOpen(false);
        taskForm.resetFields();
        refreshDetail();
      },
      onError: () => {
        message.error('创建失败');
      },
    },
  );

  const createRiskMutation = useMutation(
    (payload: {
      title: string;
      mitigationPlan?: string;
      severity?: DeliveryRiskSeverity;
    }) => deliveryApi.createRisk(id || '', payload),
    {
      onSuccess: () => {
        message.success('风险项已创建');
        setRiskOpen(false);
        riskForm.resetFields();
        refreshDetail();
      },
      onError: () => {
        message.error('创建失败');
      },
    },
  );

  const createAcceptanceMutation = useMutation(
    (payload: { summary: string; result?: DeliveryAcceptanceResult }) =>
      deliveryApi.createAcceptance(id || '', payload),
    {
      onSuccess: () => {
        message.success('验收记录已创建');
        setAcceptanceOpen(false);
        acceptanceForm.resetFields();
        refreshDetail();
      },
      onError: () => {
        message.error('创建失败');
      },
    },
  );

  const createOutcomeMutation = useMutation(
    (payload: {
      outcomeCode: string;
      promisedValue: string;
      actualValue?: string;
      status?: DeliveryOutcomeStatus;
      note?: string;
    }) => deliveryApi.createOutcome(id || '', payload),
    {
      onSuccess: () => {
        message.success('目标结果已创建');
        setOutcomeOpen(false);
        outcomeForm.resetFields();
        refreshDetail();
      },
      onError: () => {
        message.error('创建失败');
      },
    },
  );

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  const delivery = data?.delivery;
  if (!delivery) {
    return <Card>交付单不存在</Card>;
  }

  const currentStep = Math.max(STATUS_STEPS.indexOf(delivery.status), 0);

  return (
    <Card
      title={`交付单 ${delivery.deliveryNo}`}
      extra={<Button onClick={() => navigate('/deliveries')}>返回列表</Button>}
    >
      <Steps current={currentStep} style={{ marginBottom: 20 }}>
        {STATUS_STEPS.map((status) => (
          <Steps.Step key={status} title={STATUS_CONFIG[status].text} />
        ))}
      </Steps>

      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="标题">{delivery.title}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={STATUS_CONFIG[delivery.status].color}>{STATUS_CONFIG[delivery.status].text}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="客户">
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() => navigate(`/customer-360/${delivery.customerId}`)}
          >
            查看客户
          </Button>
        </Descriptions.Item>
        <Descriptions.Item label="订单">
          {delivery.orderId ? (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => navigate(`/orders/${delivery.orderId}`)}
            >
              查看订单
            </Button>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="订阅">
          {delivery.subscriptionId ? (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => navigate(`/subscriptions/${delivery.subscriptionId}`)}
            >
              查看订阅
            </Button>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="关联合同">
          {delivery.contractId ? (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => navigate(`/contracts/${delivery.contractId}`)}
            >
              查看合同
            </Button>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="目标结果" span={2}>
          {delivery.targetOutcomeSummary || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">{dayjs(delivery.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{dayjs(delivery.updatedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
      </Descriptions>

      <Space style={{ marginTop: 16, marginBottom: 8 }} wrap>
        {delivery.status === 'draft' && (
          <Button
            type="primary"
            disabled={!can('PERM-DLV-MANAGE')}
            loading={changeStatusMutation.isLoading}
            onClick={() =>
              changeStatusMutation.mutate({
                status: 'active',
                version: delivery.version,
                reason: '手动启动交付',
              })
            }
          >
            启动交付
          </Button>
        )}

        {delivery.status === 'active' && (
          <Button
            danger
            disabled={!can('PERM-DLV-MANAGE')}
            loading={changeStatusMutation.isLoading}
            onClick={() =>
              changeStatusMutation.mutate({
                status: 'blocked',
                version: delivery.version,
                reason: '实施受阻',
              })
            }
          >
            标记阻塞
          </Button>
        )}

        {(delivery.status === 'active' || delivery.status === 'blocked') && (
          <Button
            type="primary"
            disabled={!can('PERM-DLV-MANAGE')}
            loading={changeStatusMutation.isLoading}
            onClick={() =>
              changeStatusMutation.mutate({
                status: 'ready_for_acceptance',
                version: delivery.version,
                reason: '交付内容已就绪，进入验收',
              })
            }
          >
            进入待验收
          </Button>
        )}

        {delivery.status === 'ready_for_acceptance' && (
          <Button
            type="primary"
            disabled={!can('PERM-DLV-ACCEPT')}
            loading={changeStatusMutation.isLoading}
            onClick={() =>
              changeStatusMutation.mutate({
                status: 'accepted',
                version: delivery.version,
                reason: '客户验收通过',
              })
            }
          >
            标记已验收
          </Button>
        )}

        {delivery.status === 'accepted' && (
          <Button
            type="primary"
            disabled={!can('PERM-DLV-MANAGE')}
            loading={changeStatusMutation.isLoading}
            onClick={() =>
              changeStatusMutation.mutate({
                status: 'closed',
                version: delivery.version,
                reason: '交付收尾完成',
              })
            }
          >
            关闭交付
          </Button>
        )}
      </Space>

      <Card
        title="里程碑"
        size="small"
        style={{ marginTop: 16 }}
        extra={
          <Button
            size="small"
            onClick={() => setMilestoneOpen(true)}
            disabled={!can('PERM-DLV-MANAGE')}
          >
            新增里程碑
          </Button>
        }
      >
        <Table
          rowKey="id"
          pagination={false}
          size="small"
          dataSource={data?.milestones || []}
          columns={[
            { title: '序号', dataIndex: 'sequence', key: 'sequence', width: 80 },
            { title: '标题', dataIndex: 'title', key: 'title' },
            { title: '状态', dataIndex: 'status', key: 'status' },
            {
              title: '截止时间',
              dataIndex: 'dueAt',
              key: 'dueAt',
              render: (v: string | null) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
            },
          ]}
        />
      </Card>

      <Card
        title="交付任务"
        size="small"
        style={{ marginTop: 16 }}
        extra={
          <Button
            size="small"
            onClick={() => setTaskOpen(true)}
            disabled={!can('PERM-DLV-MANAGE')}
          >
            新增任务
          </Button>
        }
      >
        <Table
          rowKey="id"
          pagination={false}
          size="small"
          dataSource={data?.tasks || []}
          columns={[
            { title: '标题', dataIndex: 'title', key: 'title' },
            { title: '状态', dataIndex: 'status', key: 'status' },
            {
              title: '截止时间',
              dataIndex: 'dueAt',
              key: 'dueAt',
              render: (v: string | null) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
            },
          ]}
        />
      </Card>

      <Card
        title="风险项"
        size="small"
        style={{ marginTop: 16 }}
        extra={
          <Button
            size="small"
            onClick={() => setRiskOpen(true)}
            disabled={!can('PERM-DLV-MANAGE')}
          >
            新增风险
          </Button>
        }
      >
        <Table
          rowKey="id"
          pagination={false}
          size="small"
          dataSource={data?.risks || []}
          columns={[
            { title: '标题', dataIndex: 'title', key: 'title' },
            {
              title: '严重度',
              dataIndex: 'severity',
              key: 'severity',
              render: (v: DeliveryRiskSeverity) => {
                const color =
                  v === 'critical' ? 'red' : v === 'high' ? 'orange' : v === 'medium' ? 'blue' : 'default';
                return <Tag color={color}>{v}</Tag>;
              },
            },
            { title: '状态', dataIndex: 'status', key: 'status' },
            { title: '缓解方案', dataIndex: 'mitigationPlan', key: 'mitigationPlan', render: (v: string | null) => v || '-' },
          ]}
        />
      </Card>

      <Card
        title="验收记录"
        size="small"
        style={{ marginTop: 16 }}
        extra={
          <Button
            size="small"
            onClick={() => setAcceptanceOpen(true)}
            disabled={!can('PERM-DLV-ACCEPT')}
          >
            新增验收
          </Button>
        }
      >
        <Table
          rowKey="id"
          pagination={false}
          size="small"
          dataSource={data?.acceptances || []}
          columns={[
            { title: '类型', dataIndex: 'acceptanceType', key: 'acceptanceType', width: 120 },
            { title: '结果', dataIndex: 'result', key: 'result', width: 120 },
            { title: '摘要', dataIndex: 'summary', key: 'summary' },
            {
              title: '时间',
              dataIndex: 'acceptedAt',
              key: 'acceptedAt',
              render: (v: string | null) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
            },
          ]}
        />
      </Card>

      <Card
        title="客户目标结果"
        size="small"
        style={{ marginTop: 16 }}
        extra={
          <Button
            size="small"
            onClick={() => setOutcomeOpen(true)}
            disabled={!can('PERM-DLV-MANAGE')}
          >
            新增结果
          </Button>
        }
      >
        <Table
          rowKey="id"
          pagination={false}
          size="small"
          dataSource={data?.outcomes || []}
          columns={[
            { title: '结果编码', dataIndex: 'outcomeCode', key: 'outcomeCode', width: 140 },
            { title: '承诺值', dataIndex: 'promisedValue', key: 'promisedValue' },
            { title: '实际值', dataIndex: 'actualValue', key: 'actualValue', render: (v: string | null) => v || '-' },
            { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
          ]}
        />
      </Card>

      <Modal
        title="新增里程碑"
        open={milestoneOpen}
        onCancel={() => setMilestoneOpen(false)}
        onOk={() => milestoneForm.submit()}
        confirmLoading={createMilestoneMutation.isLoading}
      >
        <Form
          form={milestoneForm}
          layout="vertical"
          onFinish={(values: {
            title: string;
            description?: string;
            sequence?: number;
            status?: DeliveryMilestoneStatus;
          }) => createMilestoneMutation.mutate(values)}
        >
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="sequence" label="序号" initialValue={1}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="pending">
            <Select>
              <Select.Option value="pending">pending</Select.Option>
              <Select.Option value="done">done</Select.Option>
              <Select.Option value="blocked">blocked</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增交付任务"
        open={taskOpen}
        onCancel={() => setTaskOpen(false)}
        onOk={() => taskForm.submit()}
        confirmLoading={createTaskMutation.isLoading}
      >
        <Form
          form={taskForm}
          layout="vertical"
          onFinish={(values: { title: string; description?: string }) => createTaskMutation.mutate(values)}
        >
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增风险项"
        open={riskOpen}
        onCancel={() => setRiskOpen(false)}
        onOk={() => riskForm.submit()}
        confirmLoading={createRiskMutation.isLoading}
      >
        <Form
          form={riskForm}
          layout="vertical"
          onFinish={(values: {
            title: string;
            mitigationPlan?: string;
            severity?: DeliveryRiskSeverity;
          }) => createRiskMutation.mutate(values)}
        >
          <Form.Item name="title" label="风险标题" rules={[{ required: true, message: '请输入风险标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="severity" label="严重度" initialValue="medium">
            <Select>
              <Select.Option value="low">low</Select.Option>
              <Select.Option value="medium">medium</Select.Option>
              <Select.Option value="high">high</Select.Option>
              <Select.Option value="critical">critical</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="mitigationPlan" label="缓解方案">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增验收记录"
        open={acceptanceOpen}
        onCancel={() => setAcceptanceOpen(false)}
        onOk={() => acceptanceForm.submit()}
        confirmLoading={createAcceptanceMutation.isLoading}
      >
        <Form
          form={acceptanceForm}
          layout="vertical"
          onFinish={(values: { summary: string; result?: DeliveryAcceptanceResult }) =>
            createAcceptanceMutation.mutate(values)
          }
        >
          <Form.Item name="result" label="验收结果" initialValue="accepted">
            <Select>
              <Select.Option value="pending">pending</Select.Option>
              <Select.Option value="accepted">accepted</Select.Option>
              <Select.Option value="rejected">rejected</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="summary" label="验收摘要" rules={[{ required: true, message: '请输入验收摘要' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增目标结果"
        open={outcomeOpen}
        onCancel={() => setOutcomeOpen(false)}
        onOk={() => outcomeForm.submit()}
        confirmLoading={createOutcomeMutation.isLoading}
      >
        <Form
          form={outcomeForm}
          layout="vertical"
          onFinish={(values: {
            outcomeCode: string;
            promisedValue: string;
            actualValue?: string;
            status?: DeliveryOutcomeStatus;
            note?: string;
          }) => createOutcomeMutation.mutate(values)}
        >
          <Form.Item name="outcomeCode" label="结果编码" rules={[{ required: true, message: '请输入编码' }]}>
            <Input placeholder="如：go_live_30d" />
          </Form.Item>
          <Form.Item name="promisedValue" label="承诺值" rules={[{ required: true, message: '请输入承诺值' }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="actualValue" label="实际值">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="pending">
            <Select>
              <Select.Option value="pending">pending</Select.Option>
              <Select.Option value="achieved">achieved</Select.Option>
              <Select.Option value="partial">partial</Select.Option>
              <Select.Option value="not_achieved">not_achieved</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
