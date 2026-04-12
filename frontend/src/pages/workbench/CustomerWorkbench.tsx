import { useState } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Input,
  Card,
  Typography,
  Alert,
  Row,
  Col,
  Select,
  Modal,
  Form,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  EyeOutlined,
  BulbOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { customerApi } from "../../services/customer";
import { usePermission } from "../../hooks/usePermission";
import {
  Customer,
  CustomerStatus,
  CustomerLevel,
  CreateCustomerDto,
  UpdateCustomerDto,
} from "../../types";

const { Title, Text } = Typography;
const { Search } = Input;

const STATUS_CONFIG: Record<CustomerStatus, { color: string; text: string }> = {
  potential: { color: "default", text: "潜在" },
  active: { color: "green", text: "活跃" },
  silent: { color: "orange", text: "沉睡" },
  lost: { color: "red", text: "流失" },
};

const LEVEL_CONFIG: Record<CustomerLevel, string> = {
  L1: "L1-普通",
  L2: "L2-重要",
  L3: "L3-核心",
  VIP: "VIP-战略",
};

const VALID_TRANSITIONS: Record<CustomerStatus, CustomerStatus[]> = {
  potential: ["active"],
  active: ["silent", "lost"],
  silent: ["active", "lost"],
  lost: [],
};

const riskColorMap: Record<string, string> = {
  low: "green",
  medium: "orange",
  high: "red",
  critical: "#cf1322",
};

export default function CustomerWorkbench() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermission();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [riskFilter, setRiskFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<
    CustomerStatus | undefined
  >();
  const [keyword, setKeyword] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [statusForm] = Form.useForm();

  const { data, isLoading } = useQuery(
    ["customers", page, pageSize, statusFilter, keyword],
    () =>
      customerApi.list({
        page,
        page_size: pageSize,
        status: statusFilter,
        keyword: keyword || undefined,
      }),
    { keepPreviousData: true },
  );

  const customers = data?.items || [];

  const filteredCustomers = riskFilter
    ? customers.filter((c) => c.riskLevel === riskFilter)
    : customers;

  const createMutation = useMutation(customerApi.create, {
    onSuccess: () => {
      message.success("创建成功");
      setIsCreateModalOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries(["customers"]);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { status?: number }; message?: string };
      if (err?.response?.status === 409) {
        message.error("数据已被修改，请刷新后重试");
      } else {
        message.error(err?.message || "创建失败");
      }
    },
  });

  const updateMutation = useMutation(
    (params: { id: string; data: UpdateCustomerDto }) =>
      customerApi.update(params.id, params.data),
    {
      onSuccess: () => {
        message.success("更新成功");
        setIsEditModalOpen(false);
        editForm.resetFields();
        queryClient.invalidateQueries(["customers"]);
      },
      onError: (error: unknown) => {
        const err = error as {
          response?: { status?: number };
          message?: string;
        };
        if (err?.response?.status === 409) {
          message.error("数据已被其他人修改，请刷新后重试");
        } else {
          message.error(err?.message || "更新失败");
        }
      },
    },
  );

  const statusMutation = useMutation(
    (params: {
      id: string;
      status: CustomerStatus;
      reason?: string;
      version: number;
    }) =>
      customerApi.changeStatus(
        params.id,
        params.status,
        params.reason,
        params.version,
      ),
    {
      onSuccess: () => {
        message.success("状态变更成功");
        setIsStatusModalOpen(false);
        statusForm.resetFields();
        queryClient.invalidateQueries(["customers"]);
      },
      onError: (error: unknown) => {
        const err = error as {
          response?: { status?: number };
          message?: string;
        };
        if (err?.response?.status === 409) {
          message.error("数据已被其他人修改，请刷新后重试");
        } else if (
          err?.message?.includes("STATE_MACHINE") ||
          err?.response?.status === 400
        ) {
          message.error("状态流转不合法，请检查当前状态");
        } else {
          message.error(err?.message || "状态变更失败");
        }
      },
    },
  );

  const handleCreate = () => {
    createForm.validateFields().then((values) => {
      createMutation.mutate(values as CreateCustomerDto);
    });
  };

  const handleEdit = () => {
    editForm.validateFields().then((values) => {
      if (selectedCustomer) {
        updateMutation.mutate({
          id: selectedCustomer.id,
          data: { ...values, version: selectedCustomer.version },
        });
      }
    });
  };

  const handleStatusChange = () => {
    statusForm.validateFields().then((values) => {
      if (selectedCustomer) {
        statusMutation.mutate({
          id: selectedCustomer.id,
          status: values.status,
          reason: values.reason,
          version: selectedCustomer.version,
        });
      }
    });
  };

  const openEditModal = (record: Customer) => {
    setSelectedCustomer(record);
    editForm.setFieldsValue(record);
    setIsEditModalOpen(true);
  };

  const openStatusModal = (record: Customer) => {
    setSelectedCustomer(record);
    statusForm.setFieldsValue({ status: undefined, reason: "" });
    setIsStatusModalOpen(true);
  };

  const columns = [
    {
      title: "客户名称",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Customer) => (
        <a onClick={() => navigate(`/customer-360/${record.id}`)}>{name}</a>
      ),
    },
    { title: "行业", dataIndex: "industry", key: "industry" },
    {
      title: "等级",
      dataIndex: "level",
      key: "level",
      render: (v: CustomerLevel) => (v ? LEVEL_CONFIG[v] : "-"),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: CustomerStatus) => (
        <Tag color={STATUS_CONFIG[status]?.color}>
          {STATUS_CONFIG[status]?.text || status}
        </Tag>
      ),
    },
    {
      title: "风险",
      dataIndex: "riskLevel",
      key: "riskLevel",
      render: (risk: string | null) =>
        risk ? <Tag color={riskColorMap[risk] || "default"}>{risk}</Tag> : "-",
    },
    { title: "电话", dataIndex: "phone", key: "phone" },
    {
      title: "最后互动",
      dataIndex: "lastContactAt",
      key: "lastContactAt",
      render: (v: string | null) =>
        v ? new Date(v).toLocaleDateString() : "-",
    },
    {
      title: "操作",
      key: "action",
      width: 220,
      render: (_: unknown, record: Customer) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/customer-360/${record.id}`)}
          >
            360
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            disabled={!can("PERM-CM-UPDATE")}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => openStatusModal(record)}
            disabled={!can("PERM-CM-STATUS")}
          >
            状态
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>客户经营工作台</Title>

      <Alert
        type="info"
        showIcon
        icon={<BulbOutlined />}
        message="AI 经营建议"
        description="AI 正在分析客户数据，将为您推荐优先跟进的客户和下一步动作"
        style={{ marginBottom: 16 }}
      />

      <Card>
        <Space
          style={{
            marginBottom: 16,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Space>
            <Search
              placeholder="搜索客户"
              onSearch={setKeyword}
              style={{ width: 280 }}
              allowClear
            />
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
            <Select
              placeholder="风险等级"
              allowClear
              style={{ width: 120 }}
              value={riskFilter}
              onChange={setRiskFilter}
              options={[
                { label: "低风险", value: "low" },
                { label: "中风险", value: "medium" },
                { label: "高风险", value: "high" },
                { label: "严重", value: "critical" },
              ]}
            />
          </Space>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!can("PERM-CM-CREATE")}
            >
              新建客户
            </Button>
            <Button
              type={viewMode === "card" ? "primary" : "default"}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode("card")}
            />
            <Button
              type={viewMode === "table" ? "primary" : "default"}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode("table")}
            />
          </Space>
        </Space>

        {viewMode === "table" ? (
          <Table
            dataSource={filteredCustomers}
            columns={columns}
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
        ) : (
          <Row gutter={[16, 16]}>
            {filteredCustomers.map((customer) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={customer.id}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => navigate(`/customer-360/${customer.id}`)}
                  style={{ height: "100%" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text strong>{customer.name}</Text>
                    <Tag color={STATUS_CONFIG[customer.status]?.color}>
                      {STATUS_CONFIG[customer.status]?.text}
                    </Tag>
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary">
                      行业: {customer.industry || "-"}
                    </Text>
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary">
                      等级:{" "}
                      {customer.level ? LEVEL_CONFIG[customer.level] : "-"}
                    </Text>
                  </div>
                  {customer.riskLevel && (
                    <div style={{ marginBottom: 4 }}>
                      <Tag
                        color={riskColorMap[customer.riskLevel] || "default"}
                      >
                        风险: {customer.riskLevel}
                      </Tag>
                    </div>
                  )}
                  <Space size="small" style={{ marginTop: 8 }}>
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/customer-360/${customer.id}`);
                      }}
                    >
                      360 视图
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(customer);
                      }}
                      disabled={!can("PERM-CM-UPDATE")}
                    >
                      编辑
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openStatusModal(customer);
                      }}
                      disabled={!can("PERM-CM-STATUS")}
                    >
                      状态
                    </Button>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title="新建客户"
        open={isCreateModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsCreateModalOpen(false)}
        confirmLoading={createMutation.isLoading}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="name"
            label="客户名称"
            rules={[{ required: true, message: "请输入客户名称" }]}
          >
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item name="industry" label="行业">
            <Input maxLength={64} />
          </Form.Item>
          <Form.Item name="level" label="客户等级">
            <Select allowClear>
              {Object.entries(LEVEL_CONFIG).map(([key, text]) => (
                <Select.Option key={key} value={key}>
                  {text}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input maxLength={32} />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑客户"
        open={isEditModalOpen}
        onOk={handleEdit}
        onCancel={() => setIsEditModalOpen(false)}
        confirmLoading={updateMutation.isLoading}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="industry" label="行业">
            <Input maxLength={64} />
          </Form.Item>
          <Form.Item name="level" label="客户等级">
            <Select allowClear>
              {Object.entries(LEVEL_CONFIG).map(([key, text]) => (
                <Select.Option key={key} value={key}>
                  {text}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input maxLength={32} />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更客户状态"
        open={isStatusModalOpen}
        onOk={handleStatusChange}
        onCancel={() => setIsStatusModalOpen(false)}
        confirmLoading={statusMutation.isLoading}
      >
        {selectedCustomer && (
          <div style={{ marginBottom: 16 }}>
            <Text>
              当前状态：
              <Tag color={STATUS_CONFIG[selectedCustomer.status]?.color}>
                {STATUS_CONFIG[selectedCustomer.status]?.text}
              </Tag>
            </Text>
          </div>
        )}
        <Form form={statusForm} layout="vertical">
          <Form.Item
            name="status"
            label="目标状态"
            rules={[{ required: true, message: "请选择目标状态" }]}
          >
            <Select>
              {selectedCustomer &&
                VALID_TRANSITIONS[selectedCustomer.status]?.map((s) => (
                  <Select.Option key={s} value={s}>
                    {STATUS_CONFIG[s]?.text}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="变更原因">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
