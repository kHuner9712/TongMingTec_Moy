import { useState } from "react";
import {
  Card,
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { knowledgeApi } from "../services/knowledge";
import {
  KnowledgeCategory,
  KnowledgeItem,
  KnowledgeItemStatus,
  CreateKnowledgeCategoryDto,
  CreateKnowledgeItemDto,
  ReviewKnowledgeItemDto,
} from "../types";
import dayjs from "dayjs";
import { usePermission } from "../hooks/usePermission";

const ITEM_STATUS_CONFIG: Record<KnowledgeItemStatus, { text: string; color: string }> = {
  draft: { text: "草稿", color: "default" },
  review: { text: "审核中", color: "blue" },
  published: { text: "已发布", color: "green" },
  archived: { text: "已归档", color: "default" },
};

function CategoryManager() {
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KnowledgeCategory | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data, isLoading } = useQuery(
    ["kb-categories", page, pageSize],
    () => knowledgeApi.listCategories({ page, page_size: pageSize }),
    { keepPreviousData: true },
  );

  const createMutation = useMutation(
    (dto: CreateKnowledgeCategoryDto) => knowledgeApi.createCategory(dto),
    {
      onSuccess: () => {
        message.success("分类创建成功");
        setIsCreateModalOpen(false);
        createForm.resetFields();
        queryClient.invalidateQueries(["kb-categories"]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "创建失败");
      },
    },
  );

  const updateMutation = useMutation(
    (params: { id: string; data: { name?: string; parentId?: string | null; sortOrder?: number } }) =>
      knowledgeApi.updateCategory(params.id, params.data),
    {
      onSuccess: () => {
        message.success("分类更新成功");
        setIsEditModalOpen(false);
        setEditingCategory(null);
        queryClient.invalidateQueries(["kb-categories"]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "更新失败");
      },
    },
  );

  const deleteMutation = useMutation(
    (id: string) => knowledgeApi.deleteCategory(id),
    {
      onSuccess: () => {
        message.success("分类删除成功");
        queryClient.invalidateQueries(["kb-categories"]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "删除失败");
      },
    },
  );

  const categories = data?.items || [];

  const columns = [
    { title: "编码", dataIndex: "code", key: "code" },
    { title: "名称", dataIndex: "name", key: "name" },
    {
      title: "排序",
      dataIndex: "sortOrder",
      key: "sortOrder",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <Tag color={status === "active" ? "green" : "default"}>{status === "active" ? "启用" : status}</Tag>,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "操作",
      key: "actions",
      render: (_: unknown, record: KnowledgeCategory) => (
        <Space>
          {can("PERM-KB-MANAGE") && (
            <>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setEditingCategory(record);
                  editForm.setFieldsValue({
                    name: record.name,
                    sortOrder: record.sortOrder,
                  });
                  setIsEditModalOpen(true);
                }}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定删除该分类？分类下不能有知识条目。"
                onConfirm={() => deleteMutation.mutate(record.id)}
              >
                <Button type="link" size="small" danger>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {can("PERM-KB-MANAGE") && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ marginBottom: 16 }}
          onClick={() => setIsCreateModalOpen(true)}
        >
          新建分类
        </Button>
      )}

      <Table
        rowKey="id"
        dataSource={categories}
        loading={isLoading}
        columns={columns}
        pagination={{
          current: page,
          pageSize,
          total: data?.meta?.total || 0,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title="新建分类"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createMutation.isLoading}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={(values: CreateKnowledgeCategoryDto) => {
            createMutation.mutate(values);
          }}
        >
          <Form.Item name="code" label="分类编码" rules={[{ required: true, message: "请输入分类编码" }]}>
            <Input placeholder="如 faq, policy" />
          </Form.Item>
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: "请输入分类名称" }]}>
            <Input placeholder="如 常见问题" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑分类"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingCategory(null);
        }}
        onOk={() => editForm.submit()}
        confirmLoading={updateMutation.isLoading}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values: { name?: string; sortOrder?: number }) => {
            if (editingCategory) {
              updateMutation.mutate({ id: editingCategory.id, data: values });
            }
          }}
        >
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: "请输入分类名称" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function ItemManager() {
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<KnowledgeItemStatus | undefined>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<KnowledgeItem | null>(null);
  const [createForm] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const { data: categoriesData } = useQuery(
    ["kb-categories"],
    () => knowledgeApi.listCategories({ page: 1, page_size: 100 }),
    { staleTime: 60000 },
  );

  const { data, isLoading } = useQuery(
    ["kb-items", page, pageSize, statusFilter],
    () =>
      knowledgeApi.listItems({
        page,
        page_size: pageSize,
        status: statusFilter,
      }),
    { keepPreviousData: true },
  );

  const categories = categoriesData?.items || [];
  const items = data?.items || [];

  const createMutation = useMutation(
    (dto: CreateKnowledgeItemDto) => knowledgeApi.createItem(dto),
    {
      onSuccess: () => {
        message.success("知识条目创建成功");
        setIsCreateModalOpen(false);
        createForm.resetFields();
        queryClient.invalidateQueries(["kb-items"]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "创建失败");
      },
    },
  );

  const submitForReviewMutation = useMutation(
    (id: string) => knowledgeApi.submitForReview(id),
    {
      onSuccess: () => {
        message.success("已提交审核");
        queryClient.invalidateQueries(["kb-items"]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "提交失败");
      },
    },
  );

  const reviewMutation = useMutation(
    (params: { id: string; data: ReviewKnowledgeItemDto }) =>
      knowledgeApi.reviewItem(params.id, params.data),
    {
      onSuccess: () => {
        message.success("审核完成");
        setIsReviewModalOpen(false);
        setReviewingItem(null);
        reviewForm.resetFields();
        queryClient.invalidateQueries(["kb-items"]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "审核失败");
      },
    },
  );

  const deleteMutation = useMutation(
    (id: string) => knowledgeApi.deleteItem(id),
    {
      onSuccess: () => {
        message.success("删除成功");
        queryClient.invalidateQueries(["kb-items"]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "删除失败");
      },
    },
  );

  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "分类",
      dataIndex: "categoryId",
      key: "categoryId",
      render: (categoryId: string) => {
        const cat = categories.find((c: KnowledgeCategory) => c.id === categoryId);
        return cat ? cat.name : "-";
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: KnowledgeItemStatus) => (
        <Tag color={ITEM_STATUS_CONFIG[status]?.color}>
          {ITEM_STATUS_CONFIG[status]?.text || status}
        </Tag>
      ),
    },
    {
      title: "来源",
      dataIndex: "sourceType",
      key: "sourceType",
      render: (v: string) => {
        const map: Record<string, string> = { manual: "手动", import: "导入", ai: "AI" };
        return map[v] || v;
      },
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "操作",
      key: "actions",
      render: (_: unknown, record: KnowledgeItem) => (
        <Space>
          {record.status === "draft" && can("PERM-KB-MANAGE") && (
            <Button
              type="link"
              size="small"
              onClick={() => submitForReviewMutation.mutate(record.id)}
            >
              提交审核
            </Button>
          )}
          {record.status === "review" && can("PERM-KB-AUDIT") && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setReviewingItem(record);
                reviewForm.setFieldsValue({ version: record.version });
                setIsReviewModalOpen(true);
              }}
            >
              审核
            </Button>
          )}
          {record.status !== "published" && can("PERM-KB-MANAGE") && (
            <Popconfirm title="确定删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }} wrap>
        {can("PERM-KB-MANAGE") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            新建条目
          </Button>
        )}
        <Select
          placeholder="状态筛选"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          allowClear
          style={{ width: 150 }}
          options={Object.entries(ITEM_STATUS_CONFIG).map(([key, val]) => ({
            label: val.text,
            value: key,
          }))}
        />
      </Space>

      <Table
        rowKey="id"
        dataSource={items}
        loading={isLoading}
        columns={columns}
        pagination={{
          current: page,
          pageSize,
          total: data?.meta?.total || 0,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title="新建知识条目"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createMutation.isLoading}
        width={640}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={(values: CreateKnowledgeItemDto) => {
            createMutation.mutate(values);
          }}
        >
          <Form.Item name="categoryId" label="分类">
            <Select
              placeholder="选择分类"
              allowClear
              options={categories.map((c: KnowledgeCategory) => ({
                label: c.name,
                value: c.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
            <Input placeholder="知识条目标题" />
          </Form.Item>
          <Form.Item name="contentMd" label="内容（Markdown）" rules={[{ required: true, message: "请输入内容" }]}>
            <Input.TextArea rows={8} placeholder="支持 Markdown 格式" />
          </Form.Item>
          <Form.Item name="keywords" label="关键词">
            <Select mode="tags" placeholder="输入关键词后回车" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="审核知识条目"
        open={isReviewModalOpen}
        onCancel={() => {
          setIsReviewModalOpen(false);
          setReviewingItem(null);
        }}
        onOk={() => reviewForm.submit()}
        confirmLoading={reviewMutation.isLoading}
      >
        {reviewingItem && (
          <div style={{ marginBottom: 16 }}>
            <strong>标题：</strong>{reviewingItem.title}
            <br />
            <strong>当前状态：</strong>
            <Tag color={ITEM_STATUS_CONFIG[reviewingItem.status]?.color}>
              {ITEM_STATUS_CONFIG[reviewingItem.status]?.text}
            </Tag>
          </div>
        )}
        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={(values: { decision: "approved" | "rejected"; comment?: string; version: number }) => {
            if (reviewingItem) {
              reviewMutation.mutate({ id: reviewingItem.id, data: values });
            }
          }}
        >
          <Form.Item name="decision" label="审核决定" rules={[{ required: true, message: "请选择" }]}>
            <Select
              options={[
                { label: "通过并发布", value: "approved" },
                { label: "驳回", value: "rejected" },
              ]}
            />
          </Form.Item>
          <Form.Item name="comment" label="审核意见">
            <Input.TextArea rows={3} placeholder="可选" />
          </Form.Item>
          <Form.Item name="version" hidden>
            <InputNumber />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default function KnowledgeManage() {
  return (
    <Card title="知识库管理">
      <Tabs
        items={[
          {
            key: "categories",
            label: "分类管理",
            children: <CategoryManager />,
          },
          {
            key: "items",
            label: "条目管理",
            children: <ItemManager />,
          },
        ]}
      />
    </Card>
  );
}
