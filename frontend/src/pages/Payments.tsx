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
  InputNumber,
  message,
} from "antd";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { paymentApi } from "../services/payment";
import { Payment, PaymentStatus, CreatePaymentDto } from "../types";
import CustomerSelect from "../components/CustomerSelect";
import dayjs from "dayjs";
import { usePermission } from "../hooks/usePermission";

const STATUS_CONFIG: Record<PaymentStatus, { text: string; color: string }> = {
  pending: { text: "待处理", color: "default" },
  processing: { text: "处理中", color: "blue" },
  succeeded: { text: "已成功", color: "green" },
  failed: { text: "已失败", color: "red" },
  refunded: { text: "已退款", color: "orange" },
  voided: { text: "已作废", color: "default" },
};

export default function Payments() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { can } = usePermission();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  const { data, isLoading } = useQuery(
    ["payments", page, pageSize, statusFilter],
    () =>
      paymentApi.list({
        page,
        page_size: pageSize,
        status: statusFilter,
      }),
    { keepPreviousData: true },
  );

  const createMutation = useMutation(paymentApi.create, {
    onSuccess: () => {
      message.success("付款记录创建成功");
      setIsCreateModalOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries(["payments"]);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      message.error(err?.message || "创建失败");
    },
  });

  const handleCreate = () => {
    createForm.validateFields().then((values) => {
      const dto: CreatePaymentDto = {
        orderId: values.orderId,
        customerId: values.customerId,
        paymentMethod: values.paymentMethod,
        currency: values.currency || "CNY",
        amount: values.amount,
        externalTxnId: values.externalTxnId,
        remark: values.remark,
      };
      createMutation.mutate(dto);
    });
  };

  const columns = [
    {
      title: "付款编号",
      dataIndex: "paymentNo",
      key: "paymentNo",
      render: (v: string, record: Payment) => (
        <a onClick={() => navigate(`/payments/${record.id}`)}>{v}</a>
      ),
    },
    {
      title: "关联订单",
      dataIndex: "orderId",
      key: "orderId",
      render: (v: string) => v ? v.substring(0, 8) + "..." : "-",
    },
    {
      title: "付款方式",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (v: string) => v || "-",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: PaymentStatus) => (
        <Tag color={STATUS_CONFIG[v]?.color}>
          {STATUS_CONFIG[v]?.text || v}
        </Tag>
      ),
    },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      render: (v: number, record: Payment) =>
        v ? `${record.currency} ¥${v.toLocaleString()}` : "-",
    },
    {
      title: "支付时间",
      dataIndex: "paidAt",
      key: "paidAt",
      render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-"),
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_: unknown, record: Payment) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/payments/${record.id}`)}
          >
            详情
          </Button>
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
          disabled={!can("PERM-PAY-MANAGE")}
        >
          记录付款
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
        title="记录付款"
        open={isCreateModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsCreateModalOpen(false)}
        confirmLoading={createMutation.isLoading}
        width={640}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="orderId"
            label="关联订单ID"
            rules={[{ required: true, message: "请输入订单ID" }]}
          >
            <Input placeholder="订单ID" />
          </Form.Item>
          <Form.Item
            name="customerId"
            label="客户"
            rules={[{ required: true, message: "请选择客户" }]}
          >
            <CustomerSelect placeholder="选择客户" />
          </Form.Item>
          <Form.Item name="paymentMethod" label="付款方式">
            <Select placeholder="选择付款方式" allowClear>
              <Select.Option value="bank_transfer">银行转账</Select.Option>
              <Select.Option value="alipay">支付宝</Select.Option>
              <Select.Option value="wechat">微信支付</Select.Option>
              <Select.Option value="cash">现金</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="currency" label="币种" initialValue="CNY">
            <Select>
              <Select.Option value="CNY">CNY</Select.Option>
              <Select.Option value="USD">USD</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: "请输入金额" }]}
          >
            <InputNumber min={0} precision={2} style={{ width: "100%" }} placeholder="0.00" />
          </Form.Item>
          <Form.Item name="externalTxnId" label="外部交易号">
            <Input placeholder="外部交易号（可选）" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="备注（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
