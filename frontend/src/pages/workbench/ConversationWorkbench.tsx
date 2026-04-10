import { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Card,
  Typography,
  Alert,
  Space,
  Select,
  Button,
  Modal,
  Input,
  message,
  Popconfirm,
} from "antd";
import {
  MessageOutlined,
  CheckOutlined,
  SwapOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { conversationApi } from "../../services/conversation";
import { aiRuntimeApi } from "../../services/ai-runtime";
import { Conversation } from "../../types";
import UserSelect from "../../components/UserSelect";

const { Title, Text } = Typography;

export default function ConversationWorkbench() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferTarget, setTransferTarget] = useState<string | undefined>();
  const [transferConversation, setTransferConversation] =
    useState<Conversation | null>(null);

  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [closeConversation, setCloseConversation] =
    useState<Conversation | null>(null);

  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const result = await conversationApi.list();
      setConversations(result?.items || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiSuggestion = async (conv: Conversation) => {
    if (aiSuggestions[conv.id] || conv.status === "closed") return;
    try {
      const result = await aiRuntimeApi.executeAgent<{
        outputPayload?: { suggestion?: string };
      }>({
        agentCode: "smart-reply",
        input: { conversationId: conv.id, customerId: conv.customerId },
        customerId: conv.customerId || undefined,
      });
      if (result?.outputPayload?.suggestion) {
        setAiSuggestions((prev) => ({
          ...prev,
          [conv.id]: result.outputPayload!.suggestion as string,
        }));
      }
    } catch {
      setAiSuggestions((prev) => ({ ...prev, [conv.id]: "" }));
    }
  };

  const filtered = statusFilter
    ? conversations.filter((c) => c.status === statusFilter)
    : conversations;
  const waitingCount = conversations.filter(
    (c) => c.status === "queued",
  ).length;

  const handleAccept = async (record: Conversation) => {
    setActionLoading(record.id);
    try {
      const currentUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
      await conversationApi.accept(record.id, currentUser.id, record.version);
      message.success("已接入会话");
      fetchConversations();
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err?.response?.status === 409) {
        message.error("版本冲突，请刷新后重试");
        fetchConversations();
      } else {
        message.error("接入失败");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransferClick = (record: Conversation) => {
    setTransferConversation(record);
    setTransferTarget(undefined);
    setTransferModalVisible(true);
  };

  const handleTransferConfirm = async () => {
    if (!transferConversation || !transferTarget) {
      message.warning("请选择转接目标");
      return;
    }
    setActionLoading(transferConversation.id);
    try {
      await conversationApi.transfer(
        transferConversation.id,
        transferTarget,
        undefined,
        transferConversation.version,
      );
      message.success("已转接会话");
      setTransferModalVisible(false);
      fetchConversations();
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err?.response?.status === 409) {
        message.error("版本冲突，请刷新后重试");
        fetchConversations();
      } else {
        message.error("转接失败");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseClick = (record: Conversation) => {
    setCloseConversation(record);
    setCloseReason("");
    setCloseModalVisible(true);
  };

  const handleCloseConfirm = async () => {
    if (!closeConversation) return;
    setActionLoading(closeConversation.id);
    try {
      await conversationApi.close(
        closeConversation.id,
        closeReason || undefined,
        closeConversation.version,
      );
      message.success("已关闭会话");
      setCloseModalVisible(false);
      fetchConversations();
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err?.response?.status === 409) {
        message.error("版本冲突，请刷新后重试");
        fetchConversations();
      } else {
        message.error("关闭失败");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const columns = [
    {
      title: "会话主题",
      dataIndex: "subject",
      key: "subject",
      render: (subject: string, record: Conversation) => (
        <div>
          <div>
            <Text strong>{subject || "(无主题)"}</Text>
          </div>
          {record.customerName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.customerName}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "渠道",
      dataIndex: "channelType",
      key: "channelType",
      render: (v: string) => <Tag>{v || "-"}</Tag>,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          active: "green",
          queued: "gold",
          closed: "default",
        };
        const labelMap: Record<string, string> = {
          active: "活跃",
          queued: "排队中",
          closed: "已关闭",
        };
        return (
          <Tag color={colorMap[status] || "default"}>
            {labelMap[status] || status}
          </Tag>
        );
      },
    },
    {
      title: "负责人",
      dataIndex: "assigneeUserName",
      key: "assigneeUserName",
      render: (v: string | null) => v || "-",
    },
    {
      title: "AI 建议",
      key: "aiSuggestion",
      render: (_: unknown, record: Conversation) => {
        const suggestion = aiSuggestions[record.id];
        if (record.status === "closed") {
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              -
            </Text>
          );
        }
        if (suggestion === undefined) {
          return (
            <Button
              type="link"
              size="small"
              onClick={() => fetchAiSuggestion(record)}
              style={{ fontSize: 12, padding: 0 }}
            >
              获取建议
            </Button>
          );
        }
        if (suggestion === "") {
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              暂无建议
            </Text>
          );
        }
        return (
          <Text
            style={{ fontSize: 12, maxWidth: 200 }}
            ellipsis={{ tooltip: suggestion }}
          >
            {suggestion}
          </Text>
        );
      },
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
      render: (_: unknown, record: Conversation) => {
        const isLoading = actionLoading === record.id;
        return (
          <Space>
            {record.status === "queued" && (
              <Popconfirm
                title="确认接入此会话？"
                onConfirm={() => handleAccept(record)}
                okText="确认"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  loading={isLoading}
                >
                  接入
                </Button>
              </Popconfirm>
            )}
            {record.status === "active" && (
              <>
                <Button
                  type="link"
                  size="small"
                  icon={<SwapOutlined />}
                  onClick={() => handleTransferClick(record)}
                  loading={isLoading}
                >
                  转接
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  onClick={() => handleCloseClick(record)}
                  loading={isLoading}
                >
                  关闭
                </Button>
              </>
            )}
            {record.status === "closed" && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                已结束
              </Text>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Title level={3}>会话与跟进工作台</Title>

      {waitingCount > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<MessageOutlined />}
          message="AI 助手提醒"
          description={`${waitingCount} 个会话等待回复，建议优先处理`}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        <Space
          style={{
            marginBottom: 16,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Space>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "排队中", value: "queued" },
                { label: "活跃", value: "active" },
                { label: "已关闭", value: "closed" },
              ]}
            />
          </Space>
          <Button onClick={fetchConversations}>刷新</Button>
        </Space>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        open={transferModalVisible}
        title="转接会话"
        onOk={handleTransferConfirm}
        onCancel={() => setTransferModalVisible(false)}
        okText="确认转接"
        okButtonProps={{ disabled: !transferTarget }}
      >
        <div style={{ marginTop: 16 }}>
          <Text>选择转接目标：</Text>
          <UserSelect
            value={transferTarget}
            onChange={setTransferTarget}
            placeholder="选择转接给谁"
            style={{ width: "100%", marginTop: 8 }}
          />
        </div>
      </Modal>

      <Modal
        open={closeModalVisible}
        title="关闭会话"
        onOk={handleCloseConfirm}
        onCancel={() => setCloseModalVisible(false)}
        okText="确认关闭"
      >
        <div style={{ marginTop: 16 }}>
          <Text>关闭原因（可选）：</Text>
          <Input.TextArea
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value)}
            placeholder="请输入关闭原因"
            rows={3}
            style={{ marginTop: 8 }}
            maxLength={200}
            showCount
          />
        </div>
      </Modal>
    </div>
  );
}
