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
  ReloadOutlined,
  FileProtectOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation } from "react-query";
import { useParams, useNavigate } from "react-router-dom";
import { contractApi } from "../services/contract";
import { ContractStatus } from "../types";
import dayjs from "dayjs";
import { usePermission } from "../hooks/usePermission";

const STATUS_CONFIG: Record<ContractStatus, { text: string; color: string }> = {
  draft: { text: "草稿", color: "default" },
  pending_approval: { text: "待审批", color: "processing" },
  approved: { text: "已审批", color: "success" },
  rejected: { text: "已驳回", color: "red" },
  signing: { text: "签署中", color: "blue" },
  active: { text: "生效中", color: "green" },
  expired: { text: "已过期", color: "warning" },
  terminated: { text: "已终止", color: "default" },
};

const STATUS_STEPS: ContractStatus[] = [
  "draft",
  "pending_approval",
  "approved",
  "signing",
  "active",
];

function getStepIndex(status: ContractStatus): number {
  if (status === "rejected") return 1;
  if (status === "expired" || status === "terminated") return 4;
  return STATUS_STEPS.indexOf(status);
}

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [approveForm] = Form.useForm();
  const [signForm] = Form.useForm();
  const [terminateForm] = Form.useForm();
  const [versionConflict, setVersionConflict] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery(
    ["contract", id],
    () => contractApi.get(id!),
    { enabled: !!id },
  );

  const contract = data?.contract;

  const approveMutation = useMutation(
    (params: { action: "approved" | "rejected"; comment?: string }) =>
      contractApi.approve(id!, params),
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

  const signMutation = useMutation(
    (params: { signProvider: string; version: number }) =>
      contractApi.sign(id!, params),
    {
      onSuccess: () => {
        message.success("已发起签署流程");
        setIsSignModalOpen(false);
        signForm.resetFields();
        refetch();
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "签署失败");
      },
    },
  );

  const activateMutation = useMutation(
    () => contractApi.activate(id!),
    {
      onSuccess: () => {
        message.success("合同已激活生效");
        refetch();
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "激活失败");
      },
    },
  );

  const terminateMutation = useMutation(
    (reason?: string) => contractApi.terminate(id!, reason),
    {
      onSuccess: () => {
        message.success("合同已终止");
        setIsTerminateModalOpen(false);
        terminateForm.resetFields();
        refetch();
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "终止失败");
      },
    },
  );

  const handleApprove = () => {
    approveForm.validateFields().then((values) => {
      approveMutation.mutate(values);
    });
  };

  const handleSign = () => {
    signForm.validateFields().then((values) => {
      if (contract) {
        signMutation.mutate({
          signProvider: values.signProvider,
          version: contract.version,
        });
      }
    });
  };

  const handleTerminate = () => {
    terminateForm.validateFields().then((values) => {
      terminateMutation.mutate(values.reason);
    });
  };

  if (isLoading || !contract) {
    return <Card loading />;
  }

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

  const documentColumns = [
    { title: "类型", dataIndex: "docType", key: "docType" },
    {
      title: "签署平台",
      dataIndex: "signProvider",
      key: "signProvider",
      render: (v: string | null) => v || "-",
    },
    {
      title: "签署状态",
      dataIndex: "signStatus",
      key: "signStatus",
      render: (v: string | null) => v || "-",
    },
    {
      title: "文件",
      dataIndex: "fileUrl",
      key: "fileUrl",
      render: (v: string) => (
        <a href={v} target="_blank" rel="noopener noreferrer">
          查看
        </a>
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
          current={getStepIndex(contract.status as ContractStatus)}
          status={
            contract.status === "rejected"
              ? "error"
              : contract.status === "expired" || contract.status === "terminated"
                ? "error"
                : "process"
          }
          items={STATUS_STEPS.map((s) => ({
            title: STATUS_CONFIG[s].text,
          }))}
        />
      </Card>

      <Card
        title="合同信息"
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            {contract.status === "draft" && can("PERM-CT-APPROVE") && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  contractApi.submitApproval(id!, {
                    approverIds: [],
                    version: contract.version,
                  }).then(() => {
                    message.success("已提交审批");
                    refetch();
                  });
                }}
              >
                提交审批
              </Button>
            )}
            {contract.status === "pending_approval" && can("PERM-CT-APPROVE") && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => setIsApproveModalOpen(true)}
              >
                审批
              </Button>
            )}
            {contract.status === "approved" && can("PERM-CT-SIGN") && (
              <Button
                type="primary"
                icon={<FileProtectOutlined />}
                onClick={() => setIsSignModalOpen(true)}
              >
                发起签署
              </Button>
            )}
            {contract.status === "signing" && can("PERM-CT-SIGN") && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => activateMutation.mutate()}
                loading={activateMutation.isLoading}
              >
                确认生效
              </Button>
            )}
            {contract.status === "active" && can("PERM-CT-ARCHIVE") && (
              <Button
                danger
                onClick={() => setIsTerminateModalOpen(true)}
              >
                终止合同
              </Button>
            )}
            {contract.quoteId && (
              <Button onClick={() => navigate(`/quotes/${contract.quoteId}`)}>
                查看关联报价
              </Button>
            )}
            <Button onClick={() => navigate("/contracts")}>返回列表</Button>
          </Space>
        }
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="合同编号">{contract.contractNo}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={STATUS_CONFIG[contract.status as ContractStatus]?.color}>
              {STATUS_CONFIG[contract.status as ContractStatus]?.text || contract.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="开始日期">
            {contract.startsOn ? dayjs(contract.startsOn).format("YYYY-MM-DD") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="结束日期">
            {contract.endsOn ? dayjs(contract.endsOn).format("YYYY-MM-DD") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="签署时间">
            {contract.signedAt ? dayjs(contract.signedAt).format("YYYY-MM-DD HH:mm") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="关联报价">
            {contract.quoteId ? (
              <Button type="link" size="small" onClick={() => navigate(`/quotes/${contract.quoteId}`)}>
                查看报价
              </Button>
            ) : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(contract.createdAt).format("YYYY-MM-DD HH:mm:ss")}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(contract.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="审批记录" style={{ marginBottom: 16 }}>
        <Table
          columns={approvalColumns}
          dataSource={data?.approvals || []}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="合同文档">
        <Table
          columns={documentColumns}
          dataSource={data?.documents || []}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      <Modal
        title="审批合同"
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
        title="发起签署"
        open={isSignModalOpen}
        onOk={handleSign}
        onCancel={() => setIsSignModalOpen(false)}
        confirmLoading={signMutation.isLoading}
      >
        <Form form={signForm} layout="vertical">
          <Form.Item
            name="signProvider"
            label="签署平台"
            rules={[{ required: true, message: "请选择签署平台" }]}
          >
            <Select>
              <Select.Option value="fadada">法大大</Select.Option>
              <Select.Option value="esign">e签宝</Select.Option>
              <Select.Option value="offline">线下签署</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="终止合同"
        open={isTerminateModalOpen}
        onOk={handleTerminate}
        onCancel={() => setIsTerminateModalOpen(false)}
        confirmLoading={terminateMutation.isLoading}
      >
        <Form form={terminateForm} layout="vertical">
          <Form.Item name="reason" label="终止原因">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
