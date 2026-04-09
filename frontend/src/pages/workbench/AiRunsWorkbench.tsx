import { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Space,
  Card,
  Typography,
  Button,
  Modal,
  Descriptions,
  Select,
} from "antd";
import {
  RobotOutlined,
  UndoOutlined,
  AuditOutlined,
  ThunderboltOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { aiRuntimeApi } from "../../services/ai-runtime";
import { AiAgentRun } from "../../types";

const { Title, Text } = Typography;

const statusColorMap: Record<string, string> = {
  pending: "default",
  running: "processing",
  succeeded: "green",
  failed: "red",
  cancelled: "default",
  awaiting_approval: "orange",
  rolled_back: "purple",
  taken_over: "volcano",
};

export default function AiRunsWorkbench() {
  const [runs, setRuns] = useState<AiAgentRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [detailRun, setDetailRun] = useState<AiAgentRun | null>(null);

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const result = await aiRuntimeApi.listAgentRuns<AiAgentRun[]>({
        status: statusFilter,
      });
      setRuns(Array.isArray(result) ? result : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [statusFilter]);

  const summary = {
    running: runs.filter((r) => r.status === "running").length,
    awaiting: runs.filter((r) => r.status === "awaiting_approval").length,
    succeeded: runs.filter((r) => r.status === "succeeded").length,
  };

  const columns = [
    {
      title: "Agent",
      dataIndex: "agentId",
      key: "agentId",
      render: (id: string) => (
        <span style={{ fontFamily: "monospace" }}>{id.substring(0, 8)}...</span>
      ),
    },
    {
      title: "执行模式",
      dataIndex: "executionMode",
      key: "executionMode",
      render: (mode: string) => <Tag>{mode}</Tag>,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColorMap[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "关联客户",
      dataIndex: "customerId",
      key: "customerId",
      render: (id: string | null) =>
        id ? (
          <span style={{ fontFamily: "monospace" }}>
            {id.substring(0, 8)}...
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "延迟",
      dataIndex: "latencyMs",
      key: "latencyMs",
      render: (ms: number | null) => (ms ? `${ms}ms` : "-"),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => (v ? new Date(v).toLocaleString() : "-"),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: AiAgentRun) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailRun(record)}
          >
            详情
          </Button>
          {record.status === "awaiting_approval" && (
            <Button
              type="link"
              size="small"
              icon={<AuditOutlined />}
              onClick={() => {
                /* TODO: navigate to approval */
              }}
            >
              审批
            </Button>
          )}
          {record.status === "succeeded" && (
            <Button
              type="link"
              size="small"
              icon={<UndoOutlined />}
              onClick={async () => {
                try {
                  await aiRuntimeApi.executeRollback({ agentRunId: record.id });
                  fetchRuns();
                } catch (_e) {
                  // 回滚失败不阻塞 UI
                }
              }}
            >
              回滚
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <RobotOutlined style={{ marginRight: 8, color: "#722ed1" }} />
        AI 执行流工作台
      </Title>

      <Space size={16} style={{ marginBottom: 16 }}>
        <Tag icon={<ThunderboltOutlined />} color="processing">
          运行中 {summary.running}
        </Tag>
        <Tag icon={<AuditOutlined />} color="warning">
          等待审批 {summary.awaiting}
        </Tag>
        <Tag color="success">今日完成 {summary.succeeded}</Tag>
      </Space>

      <Card>
        <Space
          style={{
            marginBottom: 16,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.keys(statusColorMap).map((k) => ({
              label: k,
              value: k,
            }))}
          />
          <Button onClick={fetchRuns}>刷新</Button>
        </Space>

        <Table
          dataSource={runs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        open={!!detailRun}
        title="AI 执行详情"
        onCancel={() => setDetailRun(null)}
        footer={null}
        width={640}
      >
        {detailRun && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="ID">{detailRun.id}</Descriptions.Item>
            <Descriptions.Item label="Agent ID">
              {detailRun.agentId}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColorMap[detailRun.status]}>
                {detailRun.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="执行模式">
              {detailRun.executionMode}
            </Descriptions.Item>
            <Descriptions.Item label="关联客户">
              {detailRun.customerId || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="延迟">
              {detailRun.latencyMs ? `${detailRun.latencyMs}ms` : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Token 消耗">
              {detailRun.tokenCost || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="输入">
              <pre
                style={{
                  maxHeight: 200,
                  overflow: "auto",
                  fontSize: 12,
                  margin: 0,
                }}
              >
                {JSON.stringify(detailRun.inputPayload, null, 2)}
              </pre>
            </Descriptions.Item>
            <Descriptions.Item label="输出">
              <pre
                style={{
                  maxHeight: 200,
                  overflow: "auto",
                  fontSize: 12,
                  margin: 0,
                }}
              >
                {detailRun.outputPayload
                  ? JSON.stringify(detailRun.outputPayload, null, 2)
                  : "-"}
              </pre>
            </Descriptions.Item>
            {detailRun.errorMessage && (
              <Descriptions.Item label="错误信息">
                <Text type="danger">{detailRun.errorMessage}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
