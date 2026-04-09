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
  Tabs,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  AuditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useApprovalStore } from "../../stores/approvalStore";
import { AiApprovalRequest } from "../../types";

const { Title, Text } = Typography;

export default function ApprovalWorkbench() {
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

  const renderItem = (item: AiApprovalRequest) => (
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
        <Button
          key="detail"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setCurrentApproval(item)}
        >
          详情
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
                    : "blue"
              }
            >
              {item.riskLevel} 风险
            </Tag>
          </Space>
        }
        description={
          <Space direction="vertical" size={0}>
            <Text type="secondary">资源类型: {item.resourceType}</Text>
            {item.customerId && (
              <Text type="secondary">
                关联客户: {item.customerId.substring(0, 8)}...
              </Text>
            )}
            <Text type="secondary">{item.explanation}</Text>
          </Space>
        }
      />
    </List.Item>
  );

  const tabItems = [
    {
      key: "pending",
      label: (
        <Space>
          <AuditOutlined /> 待审批 ({pendingApprovals.length})
        </Space>
      ),
      children:
        pendingApprovals.length === 0 ? (
          <Empty description="暂无待审批项" />
        ) : (
          <List dataSource={pendingApprovals} renderItem={renderItem} />
        ),
    },
    {
      key: "approved",
      label: "已审批",
      children: (
        <Empty
          description="暂无已审批记录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ),
    },
    {
      key: "expired",
      label: "已过期",
      children: (
        <Empty
          description="暂无过期记录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <AuditOutlined style={{ marginRight: 8, color: "#faad14" }} />
        审批流工作台
      </Title>

      <Card>
        <Tabs items={tabItems} />
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
          <Descriptions column={1} size="small" bordered>
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
            {currentApproval.customerId && (
              <Descriptions.Item label="关联客户">
                {currentApproval.customerId}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="变更前">
              <pre
                style={{
                  maxHeight: 150,
                  overflow: "auto",
                  fontSize: 12,
                  margin: 0,
                }}
              >
                {currentApproval.beforeSnapshot
                  ? JSON.stringify(currentApproval.beforeSnapshot, null, 2)
                  : "-"}
              </pre>
            </Descriptions.Item>
            <Descriptions.Item label="变更后">
              <pre
                style={{
                  maxHeight: 150,
                  overflow: "auto",
                  fontSize: 12,
                  margin: 0,
                }}
              >
                {currentApproval.proposedAfterSnapshot
                  ? JSON.stringify(
                      currentApproval.proposedAfterSnapshot,
                      null,
                      2,
                    )
                  : "-"}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
