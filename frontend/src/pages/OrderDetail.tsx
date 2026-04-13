import { Descriptions, Card, Tag, Steps, Button, Space, message, Spin, Popconfirm, Table } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { orderApi } from "../services/order";
import { OrderStatus } from "../types";
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

const STATUS_STEPS: OrderStatus[] = ["draft", "confirmed", "active", "completed"];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermission();

  const { data, isLoading } = useQuery(
    ["order", id],
    () => orderApi.get(id!),
    { enabled: !!id },
  );

  const confirmMutation = useMutation(orderApi.confirm, {
    onSuccess: () => {
      message.success("订单已确认");
      queryClient.invalidateQueries(["order", id]);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      message.error(err?.message || "操作失败");
    },
  });

  const activateMutation = useMutation(orderApi.activate, {
    onSuccess: () => {
      message.success("订单已激活");
      queryClient.invalidateQueries(["order", id]);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      message.error(err?.message || "操作失败");
    },
  });

  const completeMutation = useMutation(orderApi.complete, {
    onSuccess: () => {
      message.success("订单已完成");
      queryClient.invalidateQueries(["order", id]);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      message.error(err?.message || "操作失败");
    },
  });

  const cancelMutation = useMutation(
    (orderId: string) => orderApi.cancel(orderId),
    {
      onSuccess: () => {
        message.success("订单已取消");
        queryClient.invalidateQueries(["order", id]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "操作失败");
      },
    },
  );

  if (isLoading) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  const order = data?.order;
  const items = data?.items || [];

  if (!order) {
    return <Card>订单不存在</Card>;
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <Card
      title={`订单 ${order.orderNo}`}
      extra={<Button onClick={() => navigate("/orders")}>返回列表</Button>}
    >
      <Steps current={currentStep >= 0 ? currentStep : 0} style={{ marginBottom: 24 }}>
        {STATUS_STEPS.map((s) => (
          <Steps.Step key={s} title={STATUS_CONFIG[s]?.text || s} />
        ))}
      </Steps>

      <Descriptions bordered column={2}>
        <Descriptions.Item label="订单编号">{order.orderNo}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={STATUS_CONFIG[order.status]?.color}>
            {STATUS_CONFIG[order.status]?.text || order.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="类型">
          {order.orderType === "new" ? "新购" : order.orderType === "renewal" ? "续费" : order.orderType === "addon" ? "增购" : "退款"}
        </Descriptions.Item>
        <Descriptions.Item label="客户">
          {order.customerId ? (
            <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate(`/customer-360/${order.customerId}`)}>
              查看客户
            </Button>
          ) : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="关联合同">
          {order.contractId ? (
            <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate(`/contracts/${order.contractId}`)}>
              查看合同
            </Button>
          ) : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="关联报价">
          {order.quoteId ? (
            <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate(`/quotes/${order.quoteId}`)}>
              查看报价
            </Button>
          ) : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="金额">¥{(order.totalAmount || 0).toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="币种">{order.currency}</Descriptions.Item>
        <Descriptions.Item label="激活时间">
          {order.activatedAt ? dayjs(order.activatedAt).format("YYYY-MM-DD HH:mm") : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {dayjs(order.createdAt).format("YYYY-MM-DD HH:mm")}
        </Descriptions.Item>
      </Descriptions>

      {items.length > 0 && (
        <Card title="订单明细" style={{ marginTop: 16 }} size="small">
          <Table
            rowKey="id"
            dataSource={items}
            pagination={false}
            size="small"
            columns={[
              { title: "类型", dataIndex: "itemType", key: "itemType" },
              { title: "关联ID", dataIndex: "refId", key: "refId", render: (v: string) => v || "-" },
              { title: "数量", dataIndex: "quantity", key: "quantity" },
              { title: "单价", dataIndex: "unitPrice", key: "unitPrice", render: (v: number) => `¥${v.toLocaleString()}` },
            ]}
          />
        </Card>
      )}

      <Space style={{ marginTop: 16 }}>
        {order.status === "draft" && can("PERM-ORD-MANAGE") && (
          <Button type="primary" onClick={() => confirmMutation.mutate(order.id)} loading={confirmMutation.isLoading}>
            确认订单
          </Button>
        )}
        {order.status === "confirmed" && can("PERM-ORD-ACTIVATE") && (
          <Button type="primary" onClick={() => activateMutation.mutate(order.id)} loading={activateMutation.isLoading}>
            激活订单
          </Button>
        )}
        {order.status === "active" && can("PERM-ORD-MANAGE") && (
          <Button type="primary" onClick={() => completeMutation.mutate(order.id)} loading={completeMutation.isLoading}>
            完成订单
          </Button>
        )}
        {["draft", "confirmed"].includes(order.status) && can("PERM-ORD-MANAGE") && (
          <Popconfirm title="确认取消订单？此操作不可撤销" onConfirm={() => cancelMutation.mutate(order.id)}>
            <Button danger loading={cancelMutation.isLoading}>
              取消订单
            </Button>
          </Popconfirm>
        )}
      </Space>
    </Card>
  );
}
