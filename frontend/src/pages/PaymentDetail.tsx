import { Descriptions, Card, Tag, Steps, Button, Space, message, Spin, Popconfirm } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { paymentApi } from "../services/payment";
import { PaymentStatus } from "../types";
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

const STATUS_STEPS: PaymentStatus[] = ["pending", "processing", "succeeded"];

export default function PaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermission();

  const { data, isLoading } = useQuery(
    ["payment", id],
    () => paymentApi.get(id!),
    { enabled: !!id },
  );

  const processMutation = useMutation(paymentApi.process, {
    onSuccess: () => {
      message.success("付款已开始处理");
      queryClient.invalidateQueries(["payment", id]);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      message.error(err?.message || "操作失败");
    },
  });

  const succeedMutation = useMutation(
    (paymentId: string) => paymentApi.succeed(paymentId),
    {
      onSuccess: () => {
        message.success("付款确认成功");
        queryClient.invalidateQueries(["payment", id]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "操作失败");
      },
    },
  );

  const failMutation = useMutation(paymentApi.fail, {
    onSuccess: () => {
      message.success("已标记为失败");
      queryClient.invalidateQueries(["payment", id]);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      message.error(err?.message || "操作失败");
    },
  });

  const refundMutation = useMutation(paymentApi.refund, {
    onSuccess: () => {
      message.success("退款成功");
      queryClient.invalidateQueries(["payment", id]);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      message.error(err?.message || "操作失败");
    },
  });

  const voidMutation = useMutation(paymentApi.void, {
    onSuccess: () => {
      message.success("已作废");
      queryClient.invalidateQueries(["payment", id]);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      message.error(err?.message || "操作失败");
    },
  });

  if (isLoading) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  const payment = data;

  if (!payment) {
    return <Card>付款记录不存在</Card>;
  }

  const currentStep = STATUS_STEPS.indexOf(payment.status);

  return (
    <Card
      title={`付款 ${payment.paymentNo}`}
      extra={<Button onClick={() => navigate("/payments")}>返回列表</Button>}
    >
      <Steps current={currentStep >= 0 ? currentStep : 0} style={{ marginBottom: 24 }}>
        {STATUS_STEPS.map((s) => (
          <Steps.Step key={s} title={STATUS_CONFIG[s]?.text || s} />
        ))}
      </Steps>

      <Descriptions bordered column={2}>
        <Descriptions.Item label="付款编号">{payment.paymentNo}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={STATUS_CONFIG[payment.status]?.color}>
            {STATUS_CONFIG[payment.status]?.text || payment.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="关联订单">{payment.orderId}</Descriptions.Item>
        <Descriptions.Item label="客户ID">{payment.customerId}</Descriptions.Item>
        <Descriptions.Item label="付款方式">{payment.paymentMethod || "-"}</Descriptions.Item>
        <Descriptions.Item label="金额">¥{(payment.amount || 0).toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="币种">{payment.currency}</Descriptions.Item>
        <Descriptions.Item label="外部交易号">{payment.externalTxnId || "-"}</Descriptions.Item>
        <Descriptions.Item label="支付时间">
          {payment.paidAt ? dayjs(payment.paidAt).format("YYYY-MM-DD HH:mm") : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {dayjs(payment.createdAt).format("YYYY-MM-DD HH:mm")}
        </Descriptions.Item>
        {payment.remark && (
          <Descriptions.Item label="备注" span={2}>{payment.remark}</Descriptions.Item>
        )}
      </Descriptions>

      <Space style={{ marginTop: 16 }}>
        {payment.status === "pending" && can("PERM-PAY-CONFIRM") && (
          <Button type="primary" onClick={() => processMutation.mutate(payment.id)} loading={processMutation.isLoading}>
            开始处理
          </Button>
        )}
        {payment.status === "processing" && can("PERM-PAY-CONFIRM") && (
          <>
            <Button type="primary" onClick={() => succeedMutation.mutate(payment.id)} loading={succeedMutation.isLoading}>
              确认成功
            </Button>
            <Button danger onClick={() => failMutation.mutate(payment.id)} loading={failMutation.isLoading}>
              标记失败
            </Button>
          </>
        )}
        {payment.status === "succeeded" && can("PERM-PAY-REFUND") && (
          <Popconfirm title="确认退款？此操作不可撤销" onConfirm={() => refundMutation.mutate(payment.id)}>
            <Button danger loading={refundMutation.isLoading}>退款</Button>
          </Popconfirm>
        )}
        {payment.status === "pending" && can("PERM-PAY-MANAGE") && (
          <Popconfirm title="确认作废？此操作不可撤销" onConfirm={() => voidMutation.mutate(payment.id)}>
            <Button danger loading={voidMutation.isLoading}>作废</Button>
          </Popconfirm>
        )}
      </Space>
    </Card>
  );
}
