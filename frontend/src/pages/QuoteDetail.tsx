import { useState } from "react";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Steps,
  Table,
  Alert,
} from "antd";
import {
  CheckCircleOutlined,
  SendOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation } from "react-query";
import { useParams, useNavigate } from "react-router-dom";
import { quoteApi } from "../services/quote";
import { contractApi } from "../services/contract";
import { QuoteStatus } from "../types";
import dayjs from "dayjs";
import { usePermission } from "../hooks/usePermission";

const STATUS_CONFIG: Record<QuoteStatus, { text: string; color: string }> = {
  draft: { text: "草稿", color: "default" },
  pending_approval: { text: "待审批", color: "processing" },
  approved: { text: "已审批", color: "success" },
  sent: { text: "已发送", color: "blue" },
  accepted: { text: "已接受", color: "green" },
  rejected: { text: "已拒绝", color: "red" },
  expired: { text: "已过期", color: "warning" },
};

const STATUS_STEPS: QuoteStatus[] = [
  "draft",
  "pending_approval",
  "approved",
  "sent",
  "accepted",
];

function getStepIndex(status: QuoteStatus): number {
  if (status === "rejected") return 1;
  if (status === "expired") return 3;
  return STATUS_STEPS.indexOf(status);
}

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [approveForm] = Form.useForm();
  const [sendForm] = Form.useForm();
  const [versionConflict, setVersionConflict] = useState<string | null>(null);

  const createContractMutation = useMutation(
    () =>
      contractApi.createFromQuote({
        quoteId: id!,
        opportunityId: quote?.opportunityId || "",
        customerId: quote?.customerId || "",
      }),
    {
      onSuccess: (data) => {
        message.success("合同已创建");
        navigate(`/contracts/${data.id}`);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "创建合同失败");
      },
    },
  );

  const { data, isLoading, refetch } = useQuery(
    ["quote", id],
    () => quoteApi.get(id!),
    { enabled: !!id },
  );

  const quote = data?.quote;

  const approveMutation = useMutation(
    (params: { action: "approved" | "rejected"; comment?: string }) =>
      quoteApi.approve(id!, params),
    {
      onSuccess: () => {
        message.success("审批完成");
        setIsApproveModalOpen(false);
        approveForm.resetFields();
        refetch();
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "审批失败");
      },
    },
  );

  const sendMutation = useMutation(
    (params: { channel: string; receiver: string; message?: string }) =>
      quoteApi.send(id!, { ...params, version: quote?.version || 1 }),
    {
      onSuccess: () => {
        message.success("报价已发送");
        setIsSendModalOpen(false);
        sendForm.resetFields();
        refetch();
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        if (err?.message?.includes("CONFLICT_VERSION")) {
          setVersionConflict("该报价已被他人修改，请刷新页面后重试");
        } else {
          message.error(err?.message || "发送失败");
        }
      },
    },
  );

  const handleApprove = () => {
    approveForm.validateFields().then((values) => {
      approveMutation.mutate(values);
    });
  };

  const handleSend = () => {
    sendForm.validateFields().then((values) => {
      sendMutation.mutate(values);
    });
  };

  if (isLoading || !quote) {
    return <Card loading />;
  }

  const versionColumns = [
    { title: "版本", dataIndex: "versionNo", key: "versionNo", render: (v: number) => `V${v}` },
    { title: "金额", dataIndex: "totalAmount", key: "totalAmount" },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
  ];

  const approvalColumns = [
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: string) => {
        const cfg: Record<string, { text: string; color: string }> = {
          pending: { text: "待审批", color: "processing" },
          approved: { text: "已通过", color: "success" },
          rejected: { text: "已拒绝", color: "red" },
        };
        const c = cfg[v] || { text: v, color: "default" };
        return <Tag color={c.color}>{c.text}</Tag>;
      },
    },
    { title: "意见", dataIndex: "comment", key: "comment", render: (v: string) => v || "-" },
    {
      title: "时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
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
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => { refetch(); setVersionConflict(null); }}
            >
              刷新
            </Button>
          }
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setVersionConflict(null)}
        />
      )}

      <Card style={{ marginBottom: 16 }}>
        <Steps
          current={getStepIndex(quote.status as QuoteStatus)}
          status={
            quote.status === "rejected"
              ? "error"
              : quote.status === "expired"
                ? "error"
                : "process"
          }
          items={STATUS_STEPS.map((s) => ({
            title: STATUS_CONFIG[s].text,
          }))}
        />
      </Card>

      <Card
        title="报价信息"
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            {quote.status === "draft" && can("PERM-QT-APPROVE") && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  quoteApi.submitApproval(id!, {
                    approverIds: [],
                    version: quote.version,
                  }).then(() => {
                    message.success("已提交审批");
                    refetch();
                  });
                }}
              >
                提交审批
              </Button>
            )}
            {quote.status === "pending_approval" && can("PERM-QT-APPROVE") && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => setIsApproveModalOpen(true)}
              >
                审批
              </Button>
            )}
            {quote.status === "approved" && can("PERM-QT-SEND") && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => setIsSendModalOpen(true)}
              >
                发送报价
              </Button>
            )}
            {(quote.status === "approved" || quote.status === "sent" || quote.status === "accepted") && can("PERM-CT-MANAGE") && (
              <Button
                icon={<FileTextOutlined />}
                onClick={() => createContractMutation.mutate()}
                loading={createContractMutation.isLoading}
              >
                转合同
              </Button>
            )}
            <Button onClick={() => navigate("/quotes")}>返回列表</Button>
          </Space>
        }
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="报价编号">{quote.quoteNo}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={STATUS_CONFIG[quote.status as QuoteStatus]?.color}>
              {STATUS_CONFIG[quote.status as QuoteStatus]?.text || quote.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="金额">
            {quote.currency} {quote.amount?.toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="当前版本">V{quote.currentVersionNo}</Descriptions.Item>
          <Descriptions.Item label="有效期至">
            {quote.validUntil ? dayjs(quote.validUntil).format("YYYY-MM-DD") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="发送时间">
            {quote.sentAt ? dayjs(quote.sentAt).format("YYYY-MM-DD HH:mm") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(quote.createdAt).format("YYYY-MM-DD HH:mm:ss")}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(quote.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="版本历史" style={{ marginBottom: 16 }}>
        <Table
          columns={versionColumns}
          dataSource={data?.versions || []}
          rowKey="versionNo"
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="审批记录">
        <Table
          columns={approvalColumns}
          dataSource={data?.approvals || []}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      <Modal
        title="审批报价"
        open={isApproveModalOpen}
        onOk={handleApprove}
        onCancel={() => setIsApproveModalOpen(false)}
        confirmLoading={approveMutation.isLoading}
      >
        <Form form={approveForm} layout="vertical">
          <Form.Item
            name="action"
            label="审批结果"
            rules={[{ required: true, message: "请选择审批结果" }]}
          >
            <Select>
              <Select.Option value="approved">通过</Select.Option>
              <Select.Option value="rejected">驳回</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="comment" label="审批意见">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="发送报价"
        open={isSendModalOpen}
        onOk={handleSend}
        onCancel={() => setIsSendModalOpen(false)}
        confirmLoading={sendMutation.isLoading}
      >
        <Form form={sendForm} layout="vertical">
          <Form.Item
            name="channel"
            label="发送渠道"
            rules={[{ required: true, message: "请选择发送渠道" }]}
          >
            <Select>
              <Select.Option value="email">邮件</Select.Option>
              <Select.Option value="wechat">微信</Select.Option>
              <Select.Option value="portal">客户门户</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="receiver"
            label="接收人"
            rules={[{ required: true, message: "请输入接收人" }]}
          >
            <Input placeholder="接收人邮箱/手机号" />
          </Form.Item>
          <Form.Item name="message" label="附言">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
