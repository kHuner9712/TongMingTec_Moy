import { useState } from "react";
import { Input, Table, Tag, Card, Space, Select, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useQuery } from "react-query";
import { knowledgeApi } from "../services/knowledge";
import { KnowledgeItemStatus, KnowledgeCategory } from "../types";
import dayjs from "dayjs";

const STATUS_CONFIG: Record<KnowledgeItemStatus, { text: string; color: string }> = {
  draft: { text: "草稿", color: "default" },
  review: { text: "审核中", color: "blue" },
  published: { text: "已发布", color: "green" },
  archived: { text: "已归档", color: "default" },
};

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: categoriesData } = useQuery(
    ["kb-categories"],
    () => knowledgeApi.listCategories({ page: 1, page_size: 100 }),
    { staleTime: 60000 },
  );

  const { data, isLoading } = useQuery(
    ["kb-search", activeQuery, categoryId, page, pageSize],
    () =>
      activeQuery
        ? knowledgeApi.search({ q: activeQuery, categoryId, page, page_size: pageSize })
        : knowledgeApi.listItems({
            page,
            page_size: pageSize,
            categoryId,
            status: "published",
          }),
    { keepPreviousData: true },
  );

  const categories = categoriesData?.items || [];
  const items = data?.items || [];
  const total = data?.meta?.total || 0;

  const handleSearch = () => {
    setActiveQuery(searchQuery);
    setPage(1);
  };

  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      render: (text: string) => (
        <span>{text}</span>
      ),
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
        <Tag color={STATUS_CONFIG[status]?.color}>
          {STATUS_CONFIG[status]?.text || status}
        </Tag>
      ),
    },
    {
      title: "关键词",
      dataIndex: "keywords",
      key: "keywords",
      render: (keywords: string[] | null) =>
        keywords?.length ? keywords.slice(0, 3).map((k) => <Tag key={k}>{k}</Tag>) : "-",
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
  ];

  return (
    <Card title="知识库">
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="搜索知识条目"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
          enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
          style={{ width: 400 }}
          allowClear
          onClear={() => {
            setSearchQuery("");
            setActiveQuery("");
            setPage(1);
          }}
        />
        <Select
          placeholder="选择分类"
          value={categoryId}
          onChange={(v) => {
            setCategoryId(v);
            setPage(1);
          }}
          allowClear
          style={{ width: 200 }}
          options={categories.map((c: KnowledgeCategory) => ({
            label: c.name,
            value: c.id,
          }))}
        />
      </Space>

      {activeQuery && (
        <div style={{ marginBottom: 12, color: "#666" }}>
          搜索 "{activeQuery}" 找到 {total} 条结果
        </div>
      )}

      <Table
        rowKey="id"
        dataSource={items}
        loading={isLoading}
        columns={columns}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
    </Card>
  );
}
