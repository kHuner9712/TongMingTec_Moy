import { useState } from "react";
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
  DatePicker,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { quoteApi } from "../services/quote";
import { Quote, QuoteStatus, QuoteItem, CreateQuoteDto } from "../types";
import CustomerSelect from "../components/CustomerSelect";
import dayjs from "dayjs";
import { useAuthStore } from "../stores/authStore";
import { usePermission } from "../hooks/usePermission";
import { useWebSocket } from "../hooks/useWebSocket";

const STATUS_CONFIG: Record<QuoteStatus, { text: string; color: string }> = {
  draft: { text: "草稿", color: "default" },
  pending_approval: { text: "待审批", color: "processing" },
  approved: { text: "已审批", color: "success" },
  sent: { text: "已发送", color: "blue" },
  accepted: { text: "已接受", color: "green" },
  rejected: { text: "已拒绝", color: "red" },
  expired: { text: "已过期", color: "warning" },
};

export default function Quotes() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const tokens = useAuthStore((state) => state.tokens);
  const { can } = usePermission();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | undefined>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [createForm] = Form.useForm();
  const [submitForm] = Form.useForm();
  const [versionConflict, setVersionConflict] = useState<string | null>(null);

  useWebSocket({ token: tokens?.accessToken || "" });

  const { data, isLoading } = useQuery(
    ["quotes", page, pageSize, statusFilter],
    () =>
      quoteApi.list({
        page,
        page_size: pageSize,
        status: statusFilter,
      }),
    { keepPreviousData: true },
  );

  const createMutation = useMutation(quoteApi.create, {
    onSuccess: () => {
      message.success("报价创建成功");
      setIsCreateModalOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries(["quotes"]);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      message.error(err?.message || "创建失败");
    },
  });

  const submitApprovalMutation = useMutation(
    (data: { id: string; approverIds: string[]; version: number }) =>
      quoteApi.submitApproval(data.id, {
        approverIds: data.approverIds,
        version: data.version,
      }),
    {
      onSuccess: () => {
        message.success("已提交审批");
        setIsSubmitModalOpen(false);
        submitForm.resetFields();
        queryClient.invalidateQueries(["quotes"]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        if (err?.message?.includes("CONFLICT_VERSION")) {
          setVersionConflict("该报价已被他人修改，请刷新页面后重试");
        } else {
          message.error(err?.message || "提交审批失败");
        }
      },
    },
  );

  const handleCreate = () => {
    createForm.validateFields().then((values) => {
      const items: QuoteItem[] = values.items || [];
      const data: CreateQuoteDto = {
        opportunityId: values.opportunityId,
        customerId: values.customerId,
        currency: values.currency || "CNY",
        validUntil: values.validUntil?.toISOString(),
        items: items.map((item: QuoteItem) => ({
          itemType: item.itemType || "plan",
          description: item.description || "",
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          amount: item.amount || (item.quantity || 1) * (item.unitPrice || 0),
        })),
      };
      createMutation.mutate(data);
    });
  };

  const handleSubmitApproval = () => {
    submitForm.validateFields().then((values) => {
      if (selectedQuote) {
        submitApprovalMutation.mutate({
          id: selectedQuote.id,
          approverIds: values.approverIds,
          version: selectedQuote.version,
        });
      }
    });
  };

  const openSubmitModal = (record: Quote) => {
    setSelectedQuote(record);
    setVersionConflict(null);
    submitForm.resetFields();
    setIsSubmitModalOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries(["quotes"]);
    setVersionConflict(null);
  };

  const columns = [
    { title: "报价编号", dataIndex: "quoteNo", key: "quoteNo" },
    { title: "客户", dataIndex: "customerName", key: "customerName", render: () => "-" },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      render: (v: number, record: Quote) =>
        v ? `${record.currency} ${v.toLocaleString()}` : "-",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: QuoteStatus) => (
        <Tag color={STATUS_CONFIG[v]?.color}>{STATUS_CONFIG[v]?.text || v}</Tag>
      ),
    },
    {
      title: "版本",
      dataIndex: "currentVersionNo",
      key: "currentVersionNo",
      render: (v: number) => `V${v}`,
    },
    {
      title: "有效期至",
      dataIndex: "validUntil",
      key: "validUntil",
      render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "操作",
      key: "action",
      width: 220,
      render: (_: unknown, record: Quote) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/quotes/${record.id}`)}
          >
            详情
          </Button>
          {record.status === "draft" && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => openSubmitModal(record)}
              disabled={!can("PERM-QT-APPROVE")}
            >
              提交审批
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {versionConflict && (
        <Alert
          message={versionConflict}
          type="warning"
          showIcon
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
          }
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setVersionConflict(null)}
        />
      )}

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
            style={{ width: 140 }}
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalOpen(true)}
          disabled={!can("PERM-QT-MANAGE")}
        >
          新建报价
        </Button>
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
        title="新建报价"
        open={isCreateModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsCreateModalOpen(false)}
        confirmLoading={createMutation.isLoading}
        width={640}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="customerId"
            label="客户"
            rules={[{ required: true, message: "请选择客户" }]}
          >
            <CustomerSelect placeholder="选择客户" />
          </Form.Item>
          <Form.Item
            name="opportunityId"
            label="商机ID"
            rules={[{ required: true, message: "请输入商机ID" }]}
          >
            <Input placeholder="关联商机" />
          </Form.Item>
          <Form.Item name="currency" label="币种" initialValue="CNY">
            <Select>
              <Select.Option value="CNY">CNY</Select.Option>
              <Select.Option value="USD">USD</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="validUntil" label="有效期至">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提交审批"
        open={isSubmitModalOpen}
        onOk={handleSubmitApproval}
        onCancel={() => setIsSubmitModalOpen(false)}
        confirmLoading={submitApprovalMutation.isLoading}
      >
        <Form form={submitForm} layout="vertical">
          <Form.Item
            name="approverIds"
            label="审批人ID"
            rules={[{ required: true, message: "请输入审批人ID" }]}
          >
            <Select mode="tags" placeholder="输入审批人ID" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
