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
import { contractApi } from "../services/contract";
import { Contract, ContractStatus, CreateContractDto } from "../types";
import CustomerSelect from "../components/CustomerSelect";
import dayjs from "dayjs";
import { useAuthStore } from "../stores/authStore";
import { usePermission } from "../hooks/usePermission";
import { useWebSocket } from "../hooks/useWebSocket";

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

export default function Contracts() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const tokens = useAuthStore((state) => state.tokens);
  const { can } = usePermission();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<ContractStatus | undefined>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [createForm] = Form.useForm();
  const [submitForm] = Form.useForm();
  const [versionConflict, setVersionConflict] = useState<string | null>(null);

  useWebSocket({ token: tokens?.accessToken || "" });

  const { data, isLoading } = useQuery(
    ["contracts", page, pageSize, statusFilter],
    () =>
      contractApi.list({
        page,
        page_size: pageSize,
        status: statusFilter,
      }),
    { keepPreviousData: true },
  );

  const createMutation = useMutation(contractApi.create, {
    onSuccess: () => {
      message.success("合同创建成功");
      setIsCreateModalOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries(["contracts"]);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      message.error(err?.message || "创建失败");
    },
  });

  const submitApprovalMutation = useMutation(
    (params: { id: string; approverIds: string[]; version: number }) =>
      contractApi.submitApproval(params.id, {
        approverIds: params.approverIds,
        version: params.version,
      }),
    {
      onSuccess: () => {
        message.success("已提交审批");
        setIsSubmitModalOpen(false);
        submitForm.resetFields();
        queryClient.invalidateQueries(["contracts"]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        if (err?.message?.includes("CONFLICT_VERSION")) {
          setVersionConflict("该合同已被他人修改，请刷新页面后重试");
        } else {
          message.error(err?.message || "提交审批失败");
        }
      },
    },
  );

  const handleCreate = () => {
    createForm.validateFields().then((values) => {
      const data: CreateContractDto = {
        opportunityId: values.opportunityId,
        customerId: values.customerId,
        startsOn: values.startsOn?.toISOString(),
        endsOn: values.endsOn?.toISOString(),
      };
      createMutation.mutate(data);
    });
  };

  const handleSubmitApproval = () => {
    submitForm.validateFields().then((values) => {
      if (selectedContract) {
        submitApprovalMutation.mutate({
          id: selectedContract.id,
          approverIds: values.approverIds,
          version: selectedContract.version,
        });
      }
    });
  };

  const openSubmitModal = (record: Contract) => {
    setSelectedContract(record);
    setVersionConflict(null);
    submitForm.resetFields();
    setIsSubmitModalOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries(["contracts"]);
    setVersionConflict(null);
  };

  const columns = [
    { title: "合同编号", dataIndex: "contractNo", key: "contractNo" },
    { title: "客户", dataIndex: "customerName", key: "customerName", render: () => "-" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: ContractStatus) => (
        <Tag color={STATUS_CONFIG[v]?.color}>{STATUS_CONFIG[v]?.text || v}</Tag>
      ),
    },
    {
      title: "开始日期",
      dataIndex: "startsOn",
      key: "startsOn",
      render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "结束日期",
      dataIndex: "endsOn",
      key: "endsOn",
      render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "关联报价",
      dataIndex: "quoteId",
      key: "quoteId",
      render: (v: string | null) =>
        v ? (
          <Button type="link" size="small" onClick={() => navigate(`/quotes/${v}`)}>
            查看
          </Button>
        ) : (
          "-"
        ),
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
      render: (_: unknown, record: Contract) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/contracts/${record.id}`)}
          >
            详情
          </Button>
          {record.status === "draft" && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => openSubmitModal(record)}
              disabled={!can("PERM-CT-APPROVE")}
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
          disabled={!can("PERM-CT-MANAGE")}
        >
          新建合同
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
        title="新建合同"
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
          <Form.Item name="startsOn" label="开始日期">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="endsOn" label="结束日期">
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
