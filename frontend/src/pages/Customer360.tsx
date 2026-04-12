import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Timeline,
  Descriptions,
  List,
  Space,
  Button,
  Empty,
  Spin,
  Alert,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  RobotOutlined,
  WarningOutlined,
  BulbOutlined,
  CameraOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  Customer360View,
  CustomerTimelineEvent,
  CustomerStateSnapshot,
  AiAgentRun,
  CustomerNextAction,
} from "../types";
import { aiRuntimeApi } from "../services/ai-runtime";
import { useCustomerContextStore } from "../stores/customerContextStore";
import { usePermission } from "../hooks/usePermission";

const { Title, Text } = Typography;

const riskColorMap: Record<string, string> = {
  low: "green",
  medium: "orange",
  high: "red",
  critical: "#cf1322",
};
const intentLabelMap: Record<string, string> = {
  inquiry: "咨询",
  complaint: "投诉",
  purchase: "购买",
  renewal: "续费",
  churn_risk: "流失风险",
};
const actionStatusLabelMap: Record<string, { color: string; text: string }> = {
  pending: { color: "blue", text: "待处理" },
  accepted: { color: "green", text: "已接受" },
  dismissed: { color: "default", text: "已忽略" },
  expired: { color: "default", text: "已过期" },
};

export default function Customer360() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Customer360View | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const {
    loadCustomerContext,
    nextActions,
    timeline,
    aiRuns,
    snapshots,
    acceptAction,
    dismissAction,
  } = useCustomerContextStore();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      aiRuntimeApi.getCustomer360<Customer360View>(id).catch(() => null),
      loadCustomerContext(id),
    ])
      .then(([view]) => {
        setData(view);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAcceptAction = async (actionId: string) => {
    if (!id) return;
    setActionLoading(actionId);
    try {
      await acceptAction(id, actionId);
      message.success("已接受 AI 建议");
    } catch {
      message.error("操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismissAction = async (actionId: string) => {
    if (!id) return;
    setActionLoading(actionId);
    try {
      await dismissAction(id, actionId);
      message.success("已忽略 AI 建议");
    } catch {
      message.error("操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  if (!data) return <Empty description="客户不存在" />;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/workbench/customer")}
        >
          返回
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {data.customer.name}
        </Title>
        <Tag color={data.customer.status === "active" ? "green" : "default"}>
          {data.customer.status}
        </Tag>
        {data.riskLevel && (
          <Tag color={riskColorMap[data.riskLevel] || "default"}>
            <WarningOutlined /> {data.riskLevel} 风险
          </Tag>
        )}
        {data.currentIntent && (
          <Tag color="blue">
            <BulbOutlined />{" "}
            {intentLabelMap[data.currentIntent.intentType] ||
              data.currentIntent.intentType}
          </Tag>
        )}
      </Space>

      {data.currentIntent && (
        <Alert
          type="info"
          showIcon
          icon={<BulbOutlined />}
          message="AI 经营建议"
          description={`客户当前意图为"${intentLabelMap[data.currentIntent.intentType] || data.currentIntent.intentType}"（置信度 ${(data.currentIntent.confidence * 100).toFixed(0)}%），建议及时跟进`}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="行业">
                {data.customer.industry || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="等级">
                {data.customer.level || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="电话">
                {data.customer.phone || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {data.customer.email || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="最后互动">
                {data.customer.lastContactAt
                  ? new Date(data.customer.lastContactAt).toLocaleString()
                  : "-"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="经营时间线" style={{ marginBottom: 16 }}>
            {timeline.length === 0 ? (
              <Empty
                description="暂无时间线事件"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Timeline
                items={timeline
                  .slice(0, 20)
                  .map((event: CustomerTimelineEvent) => ({
                    color:
                      event.actorType === "ai"
                        ? "blue"
                        : event.actorType === "customer"
                          ? "green"
                          : "gray",
                    children: (
                      <div>
                        <Space>
                          {event.actorType === "ai" && (
                            <RobotOutlined style={{ color: "#1890ff" }} />
                          )}
                          <Text strong>{event.eventType}</Text>
                          <Tag>{event.actorType}</Tag>
                        </Space>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(event.occurredAt).toLocaleString()}
                        </Text>
                      </div>
                    ),
                  }))}
              />
            )}
          </Card>

          <Card title="关联资源" size="small">
            <Space size={24}>
              <Text>线索: {data.leads.length}</Text>
              <Text>商机: {data.opportunities.length}</Text>
              <Text>会话: {data.conversations.length}</Text>
              <Text>工单: {data.tickets.length}</Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <BulbOutlined style={{ color: "#1890ff" }} /> AI 建议下一步
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            {nextActions.length === 0 ? (
              <Empty
                description="暂无 AI 建议"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                size="small"
                dataSource={nextActions}
                renderItem={(action: CustomerNextAction) => (
                  <List.Item
                    actions={
                      action.status === "pending" && can("PERM-CM-UPDATE")
                        ? [
                            <Button
                              key="accept"
                              type="link"
                              size="small"
                              icon={<CheckOutlined />}
                              loading={actionLoading === action.id}
                              onClick={() => handleAcceptAction(action.id)}
                            >
                              接受
                            </Button>,
                            <Button
                              key="dismiss"
                              type="link"
                              size="small"
                              danger
                              icon={<CloseOutlined />}
                              loading={actionLoading === action.id}
                              onClick={() => handleDismissAction(action.id)}
                            >
                              忽略
                            </Button>,
                          ]
                        : action.status !== "pending"
                          ? [
                              <Tag
                                key="status"
                                color={
                                  actionStatusLabelMap[action.status]?.color ||
                                  "default"
                                }
                              >
                                {actionStatusLabelMap[action.status]?.text ||
                                  action.status}
                              </Tag>,
                            ]
                          : []
                    }
                  >
                    <List.Item.Meta
                      title={<Text>{action.actionType}</Text>}
                      description={action.reasoning}
                    />
                    <Tag
                      color={
                        action.priority <= 1
                          ? "red"
                          : action.priority <= 2
                            ? "orange"
                            : "blue"
                      }
                    >
                      P{action.priority}
                    </Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card
            title={
              <Space>
                <RobotOutlined style={{ color: "#722ed1" }} /> AI 执行历史
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            {aiRuns.length === 0 ? (
              <Empty
                description="暂无 AI 执行记录"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                size="small"
                dataSource={aiRuns.slice(0, 5)}
                renderItem={(run: AiAgentRun) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag
                            color={
                              run.status === "succeeded"
                                ? "green"
                                : run.status === "failed"
                                  ? "red"
                                  : "blue"
                            }
                          >
                            {run.status}
                          </Tag>
                          <Text
                            style={{ fontFamily: "monospace", fontSize: 12 }}
                          >
                            {run.executionMode}
                          </Text>
                        </Space>
                      }
                      description={
                        run.createdAt
                          ? new Date(run.createdAt).toLocaleString()
                          : ""
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card
            title={
              <Space>
                <CameraOutlined /> 状态快照
              </Space>
            }
          >
            {snapshots.length === 0 ? (
              <Empty
                description="暂无快照"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                size="small"
                dataSource={snapshots.slice(0, 5)}
                renderItem={(snap: CustomerStateSnapshot) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag>{snap.snapshotType}</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {snap.triggerEvent || "-"}
                          </Text>
                        </Space>
                      }
                      description={new Date(snap.createdAt).toLocaleString()}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
