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
  Card,
  Descriptions,
  Drawer,
} from "antd";
import { PlusOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { customerApi } from "../services/customer";
import {
  Customer,
  CustomerStatus,
  CustomerLevel,
  CreateCustomerDto,
  UpdateCustomerDto,
} from "../types";

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

export default function Customers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<
    CustomerStatus | undefined
  >();
  const [keyword, setKeyword] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
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
        keyword,
      }),
    { keepPreviousData: true },
  );

  const createMutation = useMutation(customerApi.create, {
    onSuccess: () => {
      message.success("创建成功");
      setIsCreateModalOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries(["customers"]);
    },
    onError: (error: any) => {
      message.error(error?.message || "创建失败");
    },
  });

  const updateMutation = useMutation(
    (data: { id: string; data: UpdateCustomerDto }) =>
      customerApi.update(data.id, data.data),
    {
      onSuccess: () => {
        message.success("更新成功");
        setIsEditModalOpen(false);
        editForm.resetFields();
        queryClient.invalidateQueries(["customers"]);
      },
      onError: (error: any) => {
        message.error(error?.message || "更新失败");
      },
    },
  );

  const statusMutation = useMutation(
    (data: {
      id: string;
      status: CustomerStatus;
      reason?: string;
      version: number;
    }) =>
      customerApi.changeStatus(data.id, data.status, data.reason, data.version),
    {
      onSuccess: () => {
        message.success("状态变更成功");
        setIsStatusModalOpen(false);
        statusForm.resetFields();
        queryClient.invalidateQueries(["customers"]);
      },
      onError: (error: any) => {
        message.error(error?.message || "状态变更失败");
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

  const openDetailDrawer = (record: Customer) => {
    setSelectedCustomer(record);
    setIsDetailDrawerOpen(true);
  };

  const openStatusModal = (record: Customer) => {
    setSelectedCustomer(record);
    statusForm.setFieldsValue({ status: record.status, reason: "" });
    setIsStatusModalOpen(true);
  };

  const columns = [
    { title: "客户名称", dataIndex: "name", key: "name" },
    { title: "行业", dataIndex: "industry", key: "industry" },
    {
      title: "等级",
      dataIndex: "level",
      key: "level",
      render: (v: CustomerLevel) => (v ? LEVEL_CONFIG[v] : "-"),
    },
    { title: "负责人", dataIndex: "ownerUserName", key: "ownerUserName" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: CustomerStatus) => (
        <Tag color={STATUS_CONFIG[v]?.color}>{STATUS_CONFIG[v]?.text || v}</Tag>
      ),
    },
    { title: "电话", dataIndex: "phone", key: "phone" },
    { title: "邮箱", dataIndex: "email", key: "email" },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_: any, record: Customer) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetailDrawer(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => openStatusModal(record)}
          >
            状态
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
          <Input.Search
            placeholder="搜索客户名称/电话"
            allowClear
            style={{ width: 200 }}
            onSearch={setKeyword}
          />
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          新建客户
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
        title="变更状态"
        open={isStatusModalOpen}
        onOk={handleStatusChange}
        onCancel={() => setIsStatusModalOpen(false)}
        confirmLoading={statusMutation.isLoading}
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: "请选择状态" }]}
          >
            <Select>
              {Object.entries(STATUS_CONFIG).map(([key, { text }]) => (
                <Select.Option key={key} value={key}>
                  {text}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="原因">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="客户详情"
        placement="right"
        width={600}
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
      >
        {selectedCustomer && (
          <Card>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="客户名称">
                {selectedCustomer.name}
              </Descriptions.Item>
              <Descriptions.Item label="行业">
                {selectedCustomer.industry || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="等级">
                {selectedCustomer.level
                  ? LEVEL_CONFIG[selectedCustomer.level]
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_CONFIG[selectedCustomer.status]?.color}>
                  {STATUS_CONFIG[selectedCustomer.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="电话">
                {selectedCustomer.phone || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {selectedCustomer.email || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>
                {selectedCustomer.address || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {selectedCustomer.remark || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedCustomer.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(selectedCustomer.updatedAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </Drawer>
    </div>
  );
}
