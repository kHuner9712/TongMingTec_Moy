import { useState } from "react";
import { Table, Tag, Space, Button, Select, message } from "antd";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { csmApi } from "../services/csm";
import { CustomerHealthScore, HealthLevel } from "../types";
import { usePermission } from "../hooks/usePermission";
import dayjs from "dayjs";

const LEVEL_CONFIG: Record<HealthLevel, { text: string; color: string }> = {
  high: { text: "健康", color: "green" },
  medium: { text: "一般", color: "blue" },
  low: { text: "低", color: "orange" },
  critical: { text: "危险", color: "red" },
};

export default function CustomerHealth() {
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [levelFilter, setLevelFilter] = useState<HealthLevel | undefined>();

  const { data, isLoading } = useQuery(
    ["csm-health", page, pageSize, levelFilter],
    () =>
      csmApi.listHealthScores({
        page,
        page_size: pageSize,
        level: levelFilter,
      }),
  );

  const evaluateMutation = useMutation(
    (customerId: string) => csmApi.evaluateHealth(customerId),
    {
      onSuccess: () => {
        message.success("健康度评估完成");
        queryClient.invalidateQueries(["csm-health"]);
      },
      onError: () => {
        message.error("评估失败");
      },
    },
  );

  const columns = [
    {
      title: "客户ID",
      dataIndex: "customerId",
      key: "customerId",
      render: (id: string) => id.slice(0, 8),
    },
    {
      title: "健康分",
      dataIndex: "score",
      key: "score",
      render: (score: number) => score.toFixed(0),
    },
    {
      title: "等级",
      dataIndex: "level",
      key: "level",
      render: (level: HealthLevel) => (
        <Tag color={LEVEL_CONFIG[level]?.color}>
          {LEVEL_CONFIG[level]?.text || level}
        </Tag>
      ),
    },
    {
      title: "评估时间",
      dataIndex: "evaluatedAt",
      key: "evaluatedAt",
      render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-"),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: CustomerHealthScore) => (
        <Space>
          {can("PERM-CSM-MANAGE") && (
            <Button
              type="link"
              size="small"
              onClick={() => evaluateMutation.mutate(record.customerId)}
              loading={evaluateMutation.isLoading}
            >
              重新评估
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <Select
          placeholder="健康等级筛选"
          allowClear
          style={{ width: 150 }}
          value={levelFilter}
          onChange={(v) => {
            setLevelFilter(v);
            setPage(1);
          }}
        >
          {Object.entries(LEVEL_CONFIG).map(([key, { text }]) => (
            <Select.Option key={key} value={key}>
              {text}
            </Select.Option>
          ))}
        </Select>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items || []}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.meta?.total || 0,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
    </div>
  );
}
