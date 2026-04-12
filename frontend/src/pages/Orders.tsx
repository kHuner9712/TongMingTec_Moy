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
} from "antd";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../services/order";
import { Order, OrderStatus, OrderType, CreateOrderDto } from "../types";
import CustomerSelect from "../components/CustomerSelect";
import dayjs from "dayjs";
import { usePermission } from "../hooks/usePermission";

const STATUS_CONFIG: Record<OrderStatus, { text: string; color: string }> = {
  draft: { text: "草稿", color: "default" },
  confirmed: { text: "已确认", color: "blue" },
  active: { text: "生效中", color: "green" },
  completed: { text: "已完成", color: "success" },
  cancelled: { text: "已取消", color: "red" },
  refunded: { text: "已退款", color: "orange" },
};

const ORDER_TYPE_CONFIG: Record<OrderType, { text: string; color: string }> = {
  new: { text: "新购", color: "blue" },
  renewal: { text: "续费", color: "green" },
  addon: { text: "增购", color: "purple" },
  refund: { text: "退款", color: "orange" },
};

export default function Orders() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { can } = usePermission();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  const { data, isLoading } = useQuery(
    ["orders", page, pageSize, statusFilter],
    () =>
      orderApi.list({
        page,
        page_size: pageSize,
        status: statusFilter,
      }),
    { keepPreviousData: true },
  );

  const createMutation = useMutation(orderApi.create, {
    onSuccess: () => {
      message.success("订单创建成功");
      setIsCreateModalOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries(["orders"]);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      message.error(err?.message || "创建失败");
    },
  });

  const handleCreate = () => {
    createForm.validateFields().then((values) => {
      const dto: CreateOrderDto = {
        customerId: values.customerId,
        contractId: values.contractId || undefined,
        quoteId: values.quoteId || undefined,
        orderType: values.orderType || "new",
        currency: values.currency || "CNY",
        items: (values.items || [{ itemType: "plan", quantity: 1, unitPrice: 0 }]),
      };
      createMutation.mutate(dto);
    });
  };

  const columns = [
    {
      title: "订单编号",
      dataIndex: "orderNo",
      key: "orderNo",
      render: (v: string, record: Order) => (
        <a onClick={() => navigate(`/orders/${record.id}`)}>{v}</a>
      ),
    },
    {
      title: "类型",
      dataIndex: "orderType",
      key: "orderType",
      render: (v: OrderType) => (
        <Tag color={ORDER_TYPE_CONFIG[v]?.color}>
          {ORDER_TYPE_CONFIG[v]?.text || v}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: OrderStatus) => (
        <Tag color={STATUS_CONFIG[v]?.color}>
          {STATUS_CONFIG[v]?.text || v}
        </Tag>
      ),
    },
    {
      title: "金额",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (v: number, record: Order) =>
        v ? `${record.currency} ¥${v.toLocaleString()}` : "-",
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-"),
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_: unknown, record: Order) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/orders/${record.id}`)}
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
          disabled={!can("PERM-ORD-MANAGE")}
        >
          新建订单
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
        title="新建订单"
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
          <Form.Item name="contractId" label="关联合同ID">
            <Input placeholder="合同ID（可选）" />
          </Form.Item>
          <Form.Item name="quoteId" label="关联报价ID">
            <Input placeholder="报价ID（可选）" />
          </Form.Item>
          <Form.Item name="orderType" label="订单类型" initialValue="new">
            <Select>
              <Select.Option value="new">新购</Select.Option>
              <Select.Option value="renewal">续费</Select.Option>
              <Select.Option value="addon">增购</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="currency" label="币种" initialValue="CNY">
            <Select>
              <Select.Option value="CNY">CNY</Select.Option>
              <Select.Option value="USD">USD</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
