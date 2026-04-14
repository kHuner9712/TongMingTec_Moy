import { useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Statistic,
  List,
  Tag,
  Space,
  Empty,
  Spin,
  Alert,
  Button,
  Table,
  Result,
} from "antd";
import {
  RobotOutlined,
  WarningOutlined,
  TeamOutlined,
  AuditOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  RightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { useCockpitStore } from "../stores/cockpitStore";
import { useApprovalStore } from "../stores/approvalStore";
import { dashboardApi, ExecutiveDashboardData } from "../services/dashboard";
import { useAuthStore } from "../stores/authStore";

const { Title, Text } = Typography;

export default function Cockpit() {
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const {
    aiInsights,
    riskSignals,
    keyMetrics,
    recentAgentRuns,
    recommendedTodos,
    fetchCockpitData,
    loading: cockpitLoading,
  } = useCockpitStore();
  const { fetchPending, pendingApprovals } = useApprovalStore();

  const { data: execData, isLoading: execLoading, isError: execError, refetch: execRefetch } = useQuery(
    "executive-dashboard",
    () => dashboardApi.getExecutiveDashboard(),
    { enabled: hasPermission("PERM-DASH-VIEW") },
  );

  useEffect(() => {
    fetchCockpitData();
    fetchPending();
  }, [fetchCockpitData, fetchPending]);

  const loading = cockpitLoading || execLoading;

  if (!hasPermission("PERM-DASH-VIEW")) {
    return <Result status="403" title="无权限" subTitle="需要 PERM-DASH-VIEW 权限" />;
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const riskSummary = {
    high: riskSignals.filter((s) => s.severity === "error").length,
    medium: riskSignals.filter((s) => s.severity === "warning").length,
    low: riskSignals.filter((s) => s.severity === "info").length,
  };

  const runSummary = {
    running: recentAgentRuns.filter((r) => r.status === "running").length,
    awaiting: recentAgentRuns.filter((r) => r.status === "awaiting_approval").length,
    succeeded: recentAgentRuns.filter((r) => r.status === "succeeded").length,
  };

  const exec = execData || ({} as ExecutiveDashboardData);
  const customerMetrics = exec.customerMetrics || { total: keyMetrics.totalCustomers, active: keyMetrics.activeCustomers, critical: 0, highRisk: 0 };
  const opportunityMetrics = exec.opportunityMetrics || { total: 0, won: 0, winRate: 0 };
  const dealMetrics = exec.dealMetrics || { activeContracts: 0, activeOrders: 0, activeSubscriptions: 0, totalRevenue: 0 };
  const healthMetrics = exec.healthMetrics || { total: 0, high: 0, medium: 0, low: 0, critical: 0 };
  const subscriptionMetrics = exec.subscriptionMetrics || { activeSubscriptions: 0, recurringRevenue: 0 };
  const riskAlerts = exec.riskAlerts || { criticalCustomers: 0, highRiskCustomers: 0, lowHealthCount: 0 };
  const revenueTrend = exec.revenueTrend || [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <ThunderboltOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          经营驾驶舱
        </Title>
        <Space>
          <Button onClick={() => navigate("/dashboards/sales")}>
            <PhoneOutlined /> 销售看板
          </Button>
          <Button onClick={() => navigate("/dashboards/service")}>
            <TeamOutlined /> 客服看板
          </Button>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={() => navigate("/workbench/ai-runs")}
          >
            AI 执行中心
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card hoverable onClick={() => navigate("/workbench/customer")}>
            <Statistic
              title="客户总数 / 活跃"
              value={`${customerMetrics.total} / ${customerMetrics.active}`}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable onClick={() => navigate("/opportunities")}>
            <Statistic
              title="商机赢单率"
              value={`${opportunityMetrics.winRate}%`}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: opportunityMetrics.winRate >= 30 ? "#52c41a" : "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总收入"
              value={dealMetrics.totalRevenue}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable onClick={() => navigate("/workbench/approvals")}>
            <Statistic
              title="待审批"
              value={pendingApprovals.length}
              prefix={<AuditOutlined />}
              valueStyle={{ color: pendingApprovals.length > 0 ? "#faad14" : undefined }}
            />
          </Card>
        </Col>
      </Row>

      {(riskAlerts.criticalCustomers > 0 || riskAlerts.highRiskCustomers > 0) && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message="经营风险预警"
          description={
            <Space size={16}>
              {riskAlerts.criticalCustomers > 0 && (
                <Tag color="red">危急客户 {riskAlerts.criticalCustomers}</Tag>
              )}
              {riskAlerts.highRiskCustomers > 0 && (
                <Tag color="orange">高风险客户 {riskAlerts.highRiskCustomers}</Tag>
              )}
              {riskAlerts.lowHealthCount > 0 && (
                <Tag color="volcano">低健康度 {riskAlerts.lowHealthCount}</Tag>
              )}
            </Space>
          }
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={() => navigate("/risk-signals")}>
              查看详情
            </Button>
          }
        />
      )}

      {aiInsights.length > 0 && (
        <Alert
          type="info"
          showIcon
          icon={<BulbOutlined />}
          message="AI 经营洞察"
          description={
            <div>
              {aiInsights.slice(0, 3).map((item, idx) => (
                <div key={item.id} style={{ marginBottom: idx < 2 ? 4 : 0 }}>
                  <Text>{item.title}</Text>
                  {item.description && (
                    <Text type="secondary"> — {item.description}</Text>
                  )}
                </div>
              ))}
            </div>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card title="成交概览" size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Statistic title="活跃合同" value={dealMetrics.activeContracts} valueStyle={{ fontSize: 20 }} />
              <Statistic title="活跃订单" value={dealMetrics.activeOrders} valueStyle={{ fontSize: 20 }} />
              <Statistic title="活跃订阅" value={dealMetrics.activeSubscriptions} prefix={<SafetyCertificateOutlined />} valueStyle={{ fontSize: 20, color: "#722ed1" }} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card title="客户健康" size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Tag color="#52c41a">高 {healthMetrics.high}</Tag>
                <Tag color="#faad14">中 {healthMetrics.medium}</Tag>
                <Tag color="#fa541c">低 {healthMetrics.low}</Tag>
                <Tag color="#f5222d">危急 {healthMetrics.critical}</Tag>
              </div>
              <Statistic title="订阅经常性收入" value={subscriptionMetrics.recurringRevenue} precision={2} prefix={<DollarOutlined />} valueStyle={{ fontSize: 20 }} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card title="收入趋势" size="small">
            {revenueTrend.length === 0 ? (
              <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                dataSource={revenueTrend.slice(-6).map((r, i) => ({ ...r, key: i }))}
                columns={[
                  { title: "月份", dataIndex: "month", key: "month", width: 80 },
                  { title: "收入", dataIndex: "revenue", key: "revenue", render: (v: number) => `¥${v.toLocaleString()}`, width: 100 },
                ]}
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: "#faad14" }} />
                <span>风险预警</span>
              </Space>
            }
            extra={
              <a onClick={() => navigate("/risk-signals")}>
                查看全部 <RightOutlined />
              </a>
            }
          >
            {riskSignals.length === 0 ? (
              <Empty description="暂无风险预警" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <Space size={16}>
                    <Tag color="red"><WarningOutlined /> 高风险 {riskSummary.high}</Tag>
                    <Tag color="orange">中风险 {riskSummary.medium}</Tag>
                    <Tag color="blue">低风险 {riskSummary.low}</Tag>
                  </Space>
                </div>
                <List
                  size="small"
                  dataSource={riskSignals.slice(0, 5)}
                  renderItem={(item) => (
                    <List.Item
                      style={{ cursor: "pointer" }}
                      onClick={() => item.relatedId && navigate(`/customer-360/${item.relatedId}`)}
                    >
                      <List.Item.Meta title={<Text>{item.title}</Text>} description={item.description} />
                      <Tag color={item.severity === "error" ? "red" : item.severity === "warning" ? "orange" : "blue"}>
                        {item.type}
                      </Tag>
                    </List.Item>
                  )}
                />
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RobotOutlined style={{ color: "#722ed1" }} />
                <span>Agent 执行动态</span>
              </Space>
            }
            extra={
              <a onClick={() => navigate("/workbench/ai-runs")}>
                查看全部 <RightOutlined />
              </a>
            }
          >
            {recentAgentRuns.length === 0 ? (
              <Empty description="暂无 Agent 执行记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <Space size={16}>
                    <Tag icon={<SyncOutlined spin />} color="processing">运行中 {runSummary.running}</Tag>
                    <Tag icon={<ClockCircleOutlined />} color="warning">等待审批 {runSummary.awaiting}</Tag>
                    <Tag icon={<CheckCircleOutlined />} color="success">今日完成 {runSummary.succeeded}</Tag>
                  </Space>
                </div>
                <List
                  size="small"
                  dataSource={recentAgentRuns.slice(0, 5)}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text code>{item.agentId?.substring(0, 8)}</Text>
                            <Tag color={item.status === "succeeded" ? "green" : item.status === "failed" ? "red" : item.status === "awaiting_approval" ? "orange" : item.status === "running" ? "processing" : "default"}>
                              {item.status}
                            </Tag>
                          </Space>
                        }
                        description={item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                      />
                      {item.customerId && (
                        <Button type="link" size="small" onClick={() => navigate(`/customer-360/${item.customerId}`)}>
                          查看客户
                        </Button>
                      )}
                    </List.Item>
                  )}
                />
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <BulbOutlined style={{ color: "#1890ff" }} />
            <span>AI 推荐待办</span>
          </Space>
        }
      >
        {recommendedTodos.length === 0 ? (
          <Empty description="暂无推荐待办" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            dataSource={recommendedTodos}
            renderItem={(todo) => (
              <List.Item
                actions={[
                  todo.relatedType === "approval" ? (
                    <Button key="go" type="link" size="small" onClick={() => navigate("/workbench/approvals")}>前往审批</Button>
                  ) : todo.relatedId ? (
                    <Button key="go" type="link" size="small" onClick={() => navigate(`/customer-360/${todo.relatedId}`)}>查看</Button>
                  ) : null,
                ]}
              >
                <List.Item.Meta title={<Text>{todo.title}</Text>} description={todo.description} />
                <Tag color={todo.priority <= 1 ? "red" : todo.priority <= 2 ? "orange" : "blue"}>P{todo.priority}</Tag>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
