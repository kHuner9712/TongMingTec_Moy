import { useEffect } from "react";
import {
  Card,
  Typography,
  List,
  Tag,
  Button,
  Space,
  Empty,
  Modal,
  Descriptions,
} from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useApprovalStore } from "../stores/approvalStore";
import { AiApprovalRequest } from "../types";

const { Title, Text } = Typography;

export default function ApprovalInbox() {
  const {
    pendingApprovals,
    currentApproval,
    fetchPending,
    approve,
    reject,
    setCurrentApproval,
  } = useApprovalStore();

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (id: string) => {
    await approve(id);
  };

  const handleReject = async (id: string) => {
    Modal.confirm({
      title: "确认拒绝",
      content: "确定要拒绝此审批请求吗？",
      onOk: () => reject(id),
    });
  };

  return (
    <div>
      <Title level={3}>审批收件箱</Title>

      <Card>
        {pendingApprovals.length === 0 ? (
          <Empty description="暂无待审批项" />
        ) : (
          <List
            dataSource={pendingApprovals}
            renderItem={(item: AiApprovalRequest) => (
              <List.Item
                actions={[
                  <Button
                    key="approve"
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleApprove(item.id)}
                  >
                    批准
                  </Button>,
                  <Button
                    key="reject"
                    danger
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => handleReject(item.id)}
                  >
                    拒绝
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{item.requestedAction}</Text>
                      <Tag
                        color={
                          item.riskLevel === "high"
                            ? "red"
                            : item.riskLevel === "medium"
                              ? "orange"
                              : "green"
                        }
                      >
                        {item.riskLevel}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">
                        资源类型: {item.resourceType}
                      </Text>
                      <Text type="secondary">{item.explanation}</Text>
                      <Text type="secondary">
                        创建于: {new Date(item.createdAt).toLocaleString()}
                        {item.expiresAt &&
                          ` · 过期于: ${new Date(item.expiresAt).toLocaleString()}`}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        open={!!currentApproval}
        title="审批详情"
        onCancel={() => setCurrentApproval(null)}
        footer={[
          <Button
            key="reject"
            danger
            onClick={() => currentApproval && handleReject(currentApproval.id)}
          >
            拒绝
          </Button>,
          <Button
            key="approve"
            type="primary"
            onClick={() => currentApproval && handleApprove(currentApproval.id)}
          >
            批准
          </Button>,
        ]}
      >
        {currentApproval && (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="请求动作">
              {currentApproval.requestedAction}
            </Descriptions.Item>
            <Descriptions.Item label="资源类型">
              {currentApproval.resourceType}
            </Descriptions.Item>
            <Descriptions.Item label="风险等级">
              {currentApproval.riskLevel}
            </Descriptions.Item>
            <Descriptions.Item label="说明">
              {currentApproval.explanation}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
