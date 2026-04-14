import { useQuery } from "react-query";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Empty,
  Spin,
  Result,
  Table,
  Tag,
  Space,
} from "antd";
import {
  CustomerServiceOutlined,
  MessageOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { dashboardApi, ServiceDashboardData } from "../services/dashboard";
import { useAuthStore } from "../stores/authStore";

const { Title } = Typography;

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "紧急",
  high: "高",
  medium: "中",
  low: "低",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "red",
  high: "orange",
  medium: "blue",
  low: "default",
};

const STATUS_LABELS: Record<string, string> = {
  open: "待处理",
  in_progress: "处理中",
  resolved: "已解决",
  closed: "已关闭",
};

const STATUS_COLORS: Record<string, string> = {
  open: "red",
  in_progress: "processing",
  resolved: "green",
  closed: "default",
};

const HEALTH_COLORS: Record<string, string> = {
  high: "#52c41a",
  medium: "#faad14",
  low: "#fa541c",
  critical: "#f5222d",
};

export default function ServiceDashboard() {
  const { hasPermission } = useAuthStore();

  const { data, isLoading, isError, refetch } = useQuery(
    "service-dashboard",
    () => dashboardApi.getServiceDashboard(),
    { enabled: hasPermission("PERM-DASH-VIEW") },
  );

  if (!hasPermission("PERM-DASH-VIEW")) {
    return <Result status="403" title="无权限" subTitle="需要 PERM-DASH-VIEW 权限" />;
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="客服看板数据加载失败，请重试"
        extra={<button onClick={() => refetch()}>重试</button>}
      />
    );
  }

  const kpi = data.kpi || {};
  const ticketByPriority = data.ticketByPriority || [];
  const ticketByStatus = data.ticketByStatus || [];
  const healthDist = data.healthDistribution || { total: 0, distribution: {}, averageScore: 0 };

  const priorityColumns = [
    { title: "优先级", dataIndex: "priority", key: "priority", render: (p: string) => (
      <Tag color={PRIORITY_COLORS[p] || "default"}>{PRIORITY_LABELS[p] || p}</Tag>
    )},
    { title: "数量", dataIndex: "count", key: "count" },
  ];

  const statusColumns = [
    { title: "状态", dataIndex: "status", key: "status", render: (s: string) => (
      <Tag color={STATUS_COLORS[s] || "default"}>{STATUS_LABELS[s] || s}</Tag>
    )},
    { title: "数量", dataIndex: "count", key: "count" },
  ];

  const healthEntries = Object.entries(healthDist.distribution || {}).map(
    ([level, count]) => ({ level, count: count as number, key: level }),
  );

  const healthColumns = [
    { title: "健康等级", dataIndex: "level", key: "level", render: (l: string) => (
      <Tag color={HEALTH_COLORS[l] || "default"}>{l}</Tag>
    )},
    { title: "客户数", dataIndex: "count", key: "count" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <CustomerServiceOutlined style={{ marginRight: 8, color: "#722ed1" }} />
          客服看板
        </Title>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="会话总数"
              value={kpi.totalConversations}
              prefix={<MessageOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="排队中"
              value={kpi.queuedConversations}
              valueStyle={{ color: kpi.queuedConversations > 0 ? "#faad14" : undefined }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="工单总数"
              value={kpi.totalTickets}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="待处理工单"
              value={kpi.openTickets}
              valueStyle={{ color: kpi.openTickets > 0 ? "#fa541c" : "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="已解决工单"
              value={kpi.resolvedTickets}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="解决率"
              value={kpi.resolveRate}
              suffix="%"
              valueStyle={{
                color: kpi.resolveRate >= 80 ? "#52c41a" : kpi.resolveRate >= 50 ? "#faad14" : "#f5222d",
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card title="工单优先级分布" bordered={false}>
            {ticketByPriority.length === 0 ? (
              <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                dataSource={ticketByPriority.map((r, i) => ({ ...r, key: i }))}
                columns={priorityColumns}
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="工单状态分布" bordered={false}>
            {ticketByStatus.length === 0 ? (
              <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                dataSource={ticketByStatus.map((r, i) => ({ ...r, key: i }))}
                columns={statusColumns}
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <HeartOutlined />
                <span>客户健康分布</span>
              </Space>
            }
            bordered={false}
          >
            {healthEntries.length === 0 ? (
              <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <Statistic
                    title="平均健康分"
                    value={healthDist.averageScore}
                    suffix="/ 100"
                    valueStyle={{
                      color: healthDist.averageScore >= 70 ? "#52c41a" : healthDist.averageScore >= 40 ? "#faad14" : "#f5222d",
                    }}
                  />
                </div>
                <Table
                  dataSource={healthEntries}
                  columns={healthColumns}
                  pagination={false}
                  size="small"
                />
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
