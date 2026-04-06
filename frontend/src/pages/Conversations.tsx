import { useState, useRef, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Card,
  Descriptions,
  Drawer,
  List,
  Avatar,
  Rate,
  Badge,
} from "antd";
import {
  EyeOutlined,
  UserSwitchOutlined,
  SwapOutlined,
  CloseCircleOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { conversationApi, SendMessageDto } from "../services/conversation";
import {
  Conversation,
  ConversationStatus,
  ConversationMessage,
} from "../types";
import UserSelect from "../components/UserSelect";
import { useConversationWebSocket } from "../hooks/useWebSocket";
import { useAuthStore } from "../stores/authStore";
import dayjs from "dayjs";

const STATUS_CONFIG: Record<
  ConversationStatus,
  { color: string; text: string }
> = {
  queued: { color: "default", text: "排队中" },
  waiting: { color: "orange", text: "等待中" },
  active: { color: "green", text: "进行中" },
  paused: { color: "blue", text: "暂停" },
  closed: { color: "red", text: "已关闭" },
};

const SENDER_TYPE_CONFIG: Record<string, { color: string; text: string }> = {
  customer: { color: "blue", text: "客户" },
  agent: { color: "green", text: "客服" },
  ai: { color: "purple", text: "AI" },
  system: { color: "default", text: "系统" },
};

export default function Conversations() {
  const queryClient = useQueryClient();
  const tokens = useAuthStore((state) => state.tokens);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<
    ConversationStatus | undefined
  >();
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messagePage, setMessagePage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [acceptForm] = Form.useForm();
  const [transferForm] = Form.useForm();
  const [closeForm] = Form.useForm();

  const { isConnected } = useConversationWebSocket(
    selectedConversation?.id,
    tokens?.accessToken || "",
  );

  const { data, isLoading } = useQuery(
    ["conversations", page, pageSize, statusFilter],
    () =>
      conversationApi.list({ page, page_size: pageSize, status: statusFilter }),
    { keepPreviousData: true },
  );

  const { data: conversationDetail } = useQuery(
    ["conversation", selectedConversation?.id],
    () => conversationApi.get(selectedConversation!.id),
    { enabled: !!selectedConversation && isDetailDrawerOpen },
  );

  const { data: messagesData, refetch: refetchMessages } = useQuery(
    ["messages", selectedConversation?.id, messagePage],
    () =>
      conversationApi.getMessages(selectedConversation!.id, {
        page: messagePage,
        page_size: 50,
      }),
    { enabled: !!selectedConversation && isDetailDrawerOpen },
  );

  useEffect(() => {
    if (messagesData?.items) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesData]);

  const sendMessageMutation = useMutation(
    (data: { id: string; data: SendMessageDto }) =>
      conversationApi.sendMessage(data.id, data.data),
    {
      onSuccess: () => {
        setMessageInput("");
        refetchMessages();
        queryClient.invalidateQueries(["conversations"]);
      },
      onError: (error: any) => {
        message.error(error?.message || "发送失败");
      },
    },
  );

  const acceptMutation = useMutation(
    (data: { id: string; assigneeUserId: string; version: number }) =>
      conversationApi.accept(data.id, data.assigneeUserId, data.version),
    {
      onSuccess: () => {
        message.success("接入成功");
        setIsAcceptModalOpen(false);
        acceptForm.resetFields();
        queryClient.invalidateQueries(["conversations"]);
      },
      onError: (error: any) => {
        message.error(error?.message || "接入失败");
      },
    },
  );

  const transferMutation = useMutation(
    (data: {
      id: string;
      targetUserId: string;
      reason?: string;
      version: number;
    }) =>
      conversationApi.transfer(
        data.id,
        data.targetUserId,
        data.reason,
        data.version,
      ),
    {
      onSuccess: () => {
        message.success("转接成功");
        setIsTransferModalOpen(false);
        transferForm.resetFields();
        queryClient.invalidateQueries(["conversations"]);
      },
      onError: (error: any) => {
        message.error(error?.message || "转接失败");
      },
    },
  );

  const closeMutation = useMutation(
    (data: { id: string; closeReason?: string; version: number }) =>
      conversationApi.close(data.id, data.closeReason, data.version),
    {
      onSuccess: () => {
        message.success("关闭成功");
        setIsCloseModalOpen(false);
        closeForm.resetFields();
        queryClient.invalidateQueries(["conversations"]);
        setIsDetailDrawerOpen(false);
      },
      onError: (error: any) => {
        message.error(error?.message || "关闭失败");
      },
    },
  );

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({
      id: selectedConversation.id,
      data: {
        messageType: "text",
        content: messageInput.trim(),
        version: selectedConversation.version,
      },
    });
  };

  const handleAccept = () => {
    acceptForm.validateFields().then((values) => {
      if (selectedConversation) {
        acceptMutation.mutate({
          id: selectedConversation.id,
          assigneeUserId: values.assigneeUserId,
          version: selectedConversation.version,
        });
      }
    });
  };

  const handleTransfer = () => {
    transferForm.validateFields().then((values) => {
      if (selectedConversation) {
        transferMutation.mutate({
          id: selectedConversation.id,
          targetUserId: values.targetUserId,
          reason: values.reason,
          version: selectedConversation.version,
        });
      }
    });
  };

  const handleClose = () => {
    closeForm.validateFields().then((values) => {
      if (selectedConversation) {
        closeMutation.mutate({
          id: selectedConversation.id,
          closeReason: values.closeReason,
          version: selectedConversation.version,
        });
      }
    });
  };

  const openDetailDrawer = (record: Conversation) => {
    setSelectedConversation(record);
    setMessagePage(1);
    setIsDetailDrawerOpen(true);
  };

  const openAcceptModal = (record: Conversation) => {
    setSelectedConversation(record);
    acceptForm.resetFields();
    setIsAcceptModalOpen(true);
  };

  const openTransferModal = (record: Conversation) => {
    setSelectedConversation(record);
    transferForm.resetFields();
    setIsTransferModalOpen(true);
  };

  const openCloseModal = (record: Conversation) => {
    setSelectedConversation(record);
    closeForm.resetFields();
    setIsCloseModalOpen(true);
  };

  const columns = [
    { title: "渠道", dataIndex: "channelName", key: "channelName" },
    { title: "客户", dataIndex: "customerName", key: "customerName" },
    { title: "负责人", dataIndex: "assigneeUserName", key: "assigneeUserName" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: ConversationStatus) => (
        <Tag color={STATUS_CONFIG[v]?.color}>{STATUS_CONFIG[v]?.text || v}</Tag>
      ),
    },
    {
      title: "评分",
      dataIndex: "ratingScore",
      key: "ratingScore",
      render: (v: number) => (v ? <Rate disabled defaultValue={v} /> : "-"),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "操作",
      key: "action",
      width: 280,
      render: (_: any, record: Conversation) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetailDrawer(record)}
          >
            详情
          </Button>
          {record.status === "queued" && (
            <Button
              type="link"
              size="small"
              icon={<UserSwitchOutlined />}
              onClick={() => openAcceptModal(record)}
            >
              接入
            </Button>
          )}
          {record.status === "active" && (
            <>
              <Button
                type="link"
                size="small"
                icon={<SwapOutlined />}
                onClick={() => openTransferModal(record)}
              >
                转接
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => openCloseModal(record)}
              >
                关闭
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
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
          >
            {Object.entries(STATUS_CONFIG).map(([key, { text }]) => (
              <Select.Option key={key} value={key}>
                {text}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data?.items || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.meta?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title="接入会话"
        open={isAcceptModalOpen}
        onOk={handleAccept}
        onCancel={() => setIsAcceptModalOpen(false)}
        confirmLoading={acceptMutation.isLoading}
      >
        <Form form={acceptForm} layout="vertical">
          <Form.Item
            name="assigneeUserId"
            label="负责人"
            rules={[{ required: true, message: "请选择负责人" }]}
          >
            <UserSelect placeholder="选择负责人" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="转接会话"
        open={isTransferModalOpen}
        onOk={handleTransfer}
        onCancel={() => setIsTransferModalOpen(false)}
        confirmLoading={transferMutation.isLoading}
      >
        <Form form={transferForm} layout="vertical">
          <Form.Item
            name="targetUserId"
            label="目标负责人"
            rules={[{ required: true, message: "请选择目标负责人" }]}
          >
            <UserSelect placeholder="选择目标负责人" />
          </Form.Item>
          <Form.Item name="reason" label="转接原因">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="关闭会话"
        open={isCloseModalOpen}
        onOk={handleClose}
        onCancel={() => setIsCloseModalOpen(false)}
        confirmLoading={closeMutation.isLoading}
      >
        <Form form={closeForm} layout="vertical">
          <Form.Item name="closeReason" label="关闭原因">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <Space>
            会话详情
            <Badge
              status={isConnected ? "success" : "default"}
              text={isConnected ? "实时连接" : "未连接"}
            />
          </Space>
        }
        placement="right"
        width={700}
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
      >
        {conversationDetail && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="渠道">
                  {conversationDetail.channelName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="客户">
                  {conversationDetail.customerName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="负责人">
                  {conversationDetail.assigneeUserName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={STATUS_CONFIG[conversationDetail.status]?.color}>
                    {STATUS_CONFIG[conversationDetail.status]?.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(conversationDetail.createdAt).format(
                    "YYYY-MM-DD HH:mm:ss",
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="评分">
                  {conversationDetail.ratingScore ? (
                    <Rate
                      disabled
                      defaultValue={conversationDetail.ratingScore}
                    />
                  ) : (
                    "-"
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="消息记录" style={{ marginBottom: 16 }}>
              <div style={{ height: 400, overflow: "auto", marginBottom: 16 }}>
                <List
                  dataSource={messagesData?.items || []}
                  renderItem={(item: ConversationMessage) => (
                    <List.Item style={{ border: "none", padding: "8px 0" }}>
                      <div
                        style={{
                          display: "flex",
                          width: "100%",
                          justifyContent:
                            item.direction === "outbound"
                              ? "flex-end"
                              : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "70%",
                            display: "flex",
                            flexDirection:
                              item.direction === "outbound"
                                ? "row-reverse"
                                : "row",
                            alignItems: "flex-start",
                            gap: 8,
                          }}
                        >
                          <Avatar
                            size="small"
                            style={{
                              backgroundColor:
                                SENDER_TYPE_CONFIG[item.senderType]?.color ===
                                "green"
                                  ? "#52c41a"
                                  : SENDER_TYPE_CONFIG[item.senderType]
                                        ?.color === "purple"
                                    ? "#722ed1"
                                    : "#1890ff",
                            }}
                          >
                            {item.senderName?.[0] || "?"}
                          </Avatar>
                          <div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#999",
                                marginBottom: 4,
                              }}
                            >
                              {item.senderName ||
                                SENDER_TYPE_CONFIG[item.senderType]?.text}{" "}
                              · {dayjs(item.sentAt).format("HH:mm")}
                            </div>
                            <div
                              style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                backgroundColor:
                                  item.direction === "outbound"
                                    ? "#e6f7ff"
                                    : "#f5f5f5",
                              }}
                            >
                              {item.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
                <div ref={messagesEndRef} />
              </div>

              {conversationDetail.status === "active" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <Input.TextArea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="输入消息..."
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    loading={sendMessageMutation.isLoading}
                  >
                    发送
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
