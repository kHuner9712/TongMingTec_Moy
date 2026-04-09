import { useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Badge,
  List,
  Tag,
  Space,
  Empty,
} from "antd";
import {
  RobotOutlined,
  BellOutlined,
  MessageOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useWorkbenchStore } from "../stores/workbenchStore";
import { useApprovalStore } from "../stores/approvalStore";

const { Title, Text } = Typography;

export default function Workbench() {
  const navigate = useNavigate();
  const { todoItems, aiInsights, fetchWorkbenchData } = useWorkbenchStore();
  const { pendingApprovals, fetchPending } = useApprovalStore();

  useEffect(() => {
    fetchWorkbenchData();
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        <ThunderboltOutlined style={{ marginRight: 8, color: "#1890ff" }} />
        人机协同工作台
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <RobotOutlined />
                <span>AI 洞察</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            {aiInsights.length === 0 ? (
              <Empty
                description="暂无 AI 洞察"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={aiInsights}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text>{item.title}</Text>}
                      description={item.description}
                    />
                    <Tag
                      color={
                        item.severity === "warning"
                          ? "orange"
                          : item.severity === "error"
                            ? "red"
                            : "blue"
                      }
                    >
                      {item.type}
                    </Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card title="待办事项">
            {todoItems.length === 0 ? (
              <Empty
                description="暂无待办事项"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={todoItems}
                renderItem={(item) => (
                  <List.Item actions={[<a key="handle">处理</a>]}>
                    <List.Item.Meta
                      title={<Text>{item.title}</Text>}
                      description={item.description}
                    />
                    <Tag
                      color={
                        item.priority === "urgent"
                          ? "red"
                          : item.priority === "high"
                            ? "orange"
                            : "blue"
                      }
                    >
                      {item.priority}
                    </Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <BellOutlined />
                <span>待审批</span>
                <Badge count={pendingApprovals.length} />
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            {pendingApprovals.length === 0 ? (
              <Empty
                description="暂无待审批"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                size="small"
                dataSource={pendingApprovals.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text>{item.requestedAction}</Text>}
                      description={`${item.resourceType} · ${item.riskLevel}`}
                    />
                    <Tag color={item.riskLevel === "high" ? "red" : "orange"}>
                      {item.riskLevel}
                    </Tag>
                  </List.Item>
                )}
                footer={
                  <a onClick={() => navigate("/approvals")}>查看全部审批</a>
                }
              />
            )}
          </Card>

          <Card title="快捷操作">
            <Space direction="vertical" style={{ width: "100%" }}>
              <a onClick={() => navigate("/customers")}>
                <Space>
                  <MessageOutlined /> 客户管理
                </Space>
              </a>
              <a onClick={() => navigate("/conversations")}>
                <Space>
                  <MessageOutlined /> 会话中心
                </Space>
              </a>
              <a onClick={() => navigate("/tickets")}>
                <Space>
                  <FileTextOutlined /> 工单管理
                </Space>
              </a>
              <a onClick={() => navigate("/agents")}>
                <Space>
                  <RobotOutlined /> Agent 管理
                </Space>
              </a>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
