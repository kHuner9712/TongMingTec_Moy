import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { EyeOutlined, PauseCircleOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  OpportunityForecast as OpportunityForecastData,
  opportunityApi,
} from "../services/opportunity";
import { Opportunity, OpportunityStage } from "../types";
import { usePermission } from "../hooks/usePermission";

const { Text, Title } = Typography;

const STAGE_LABELS: Record<OpportunityStage, string> = {
  discovery: "发现",
  qualification: "验证",
  proposal: "报价",
  negotiation: "谈判",
};

const COMMIT_BAND_META: Record<
  "low" | "medium" | "high",
  { text: string; color: string }
> = {
  low: { text: "低承诺", color: "red" },
  medium: { text: "中承诺", color: "gold" },
  high: { text: "高承诺", color: "green" },
};

export default function OpportunityForecast() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { can } = usePermission();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [stageFilter, setStageFilter] = useState<OpportunityStage | undefined>();
  const [commitBandFilter, setCommitBandFilter] = useState<
    "low" | "medium" | "high" | undefined
  >();
  const [pauseFilter, setPauseFilter] = useState<"all" | "paused">("all");

  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isForecastDrawerOpen, setIsForecastDrawerOpen] = useState(false);
  const [isPauseDrawerOpen, setIsPauseDrawerOpen] = useState(false);
  const [pauseForm] = Form.useForm();

  const { data: listData, isLoading: listLoading } = useQuery(
    ["opportunity-forecast-list", page, pageSize, stageFilter],
    () =>
      opportunityApi.list({
        page,
        page_size: pageSize,
        stage: stageFilter,
      }),
    { keepPreviousData: true },
  );

  const opportunities = listData?.items || [];

  const batchKey = useMemo(
    () => opportunities.map((item) => `${item.id}:${item.version}`).join("|"),
    [opportunities],
  );

  const {
    data: forecastMap = {},
    isLoading: forecastMapLoading,
  } = useQuery(
    ["opportunity-forecast-batch", batchKey],
    async () => {
      const entries = await Promise.all(
        opportunities.map(async (item) => {
          try {
            const forecast = await opportunityApi.getForecast(item.id, {
              forecastModel: "default",
              includeDrivers: false,
            });
            return [item.id, forecast] as const;
          } catch {
            return [item.id, null] as const;
          }
        }),
      );

      return Object.fromEntries(entries) as Record<
        string,
        OpportunityForecastData | null
      >;
    },
    {
      enabled: opportunities.length > 0,
      keepPreviousData: true,
    },
  );

  const filteredRows = useMemo(() => {
    return opportunities.filter((item) => {
      const forecast = forecastMap[item.id];
      if (commitBandFilter && forecast?.commitBand !== commitBandFilter) {
        return false;
      }
      if (pauseFilter === "paused" && !item.pauseReason) {
        return false;
      }
      return true;
    });
  }, [opportunities, forecastMap, commitBandFilter, pauseFilter]);

  const hasUnavailableForecast = filteredRows.some(
    (item) => forecastMap[item.id] === null,
  );

  const {
    data: selectedForecast,
    isLoading: selectedForecastLoading,
    isError: selectedForecastError,
  } = useQuery(
    ["opportunity-forecast-detail", selectedOpportunity?.id],
    () =>
      opportunityApi.getForecast(selectedOpportunity!.id, {
        forecastModel: "default",
        includeDrivers: true,
      }),
    {
      enabled: Boolean(selectedOpportunity && isForecastDrawerOpen),
    },
  );

  const pauseMutation = useMutation(
    (payload: { id: string; pauseReason: string; version: number }) =>
      opportunityApi.pause(payload.id, {
        pauseReason: payload.pauseReason,
        version: payload.version,
      }),
    {
      onSuccess: () => {
        message.success("商机已暂停");
        setIsPauseDrawerOpen(false);
        pauseForm.resetFields();
        queryClient.invalidateQueries(["opportunity-forecast-list"]);
        queryClient.invalidateQueries(["opportunity-forecast-batch"]);
        queryClient.invalidateQueries(["opportunity-forecast-detail"]);
        queryClient.invalidateQueries(["opportunities"]);
        queryClient.invalidateQueries(["opportunity"]);
      },
      onError: (error: unknown) => {
        const err = error as { code?: string; message?: string };
        if (err?.code === "CONFLICT_VERSION") {
          message.warning("商机版本已更新，请刷新后重试");
          return;
        }
        message.error(err?.message || "暂停失败");
      },
    },
  );

  const openForecastDrawer = (record: Opportunity) => {
    setSelectedOpportunity(record);
    setIsForecastDrawerOpen(true);
  };

  const openPauseDrawer = (record: Opportunity) => {
    setSelectedOpportunity(record);
    pauseForm.setFieldsValue({ pauseReason: record.pauseReason || "" });
    setIsPauseDrawerOpen(true);
  };

  const handlePauseSubmit = async () => {
    if (!selectedOpportunity) {
      return;
    }
    const values = await pauseForm.validateFields();
    pauseMutation.mutate({
      id: selectedOpportunity.id,
      pauseReason: values.pauseReason,
      version: selectedOpportunity.version,
    });
  };

  const columns = [
    {
      title: "商机",
      dataIndex: "name",
      key: "name",
      width: 220,
    },
    {
      title: "客户",
      dataIndex: "customerName",
      key: "customerName",
      width: 160,
      render: (value: string | null) => value || "-",
    },
    {
      title: "赢单概率",
      key: "winRate",
      width: 120,
      render: (_: unknown, record: Opportunity) => {
        const forecast = forecastMap[record.id];
        if (forecast === null) {
          return <Tag>暂不可用</Tag>;
        }
        if (!forecast) {
          return "-";
        }
        return `${forecast.winRate}%`;
      },
    },
    {
      title: "承诺带",
      key: "commitBand",
      width: 120,
      render: (_: unknown, record: Opportunity) => {
        const forecast = forecastMap[record.id];
        if (!forecast || forecast === null) {
          return "-";
        }
        const meta = COMMIT_BAND_META[forecast.commitBand];
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: "阶段",
      key: "stage",
      width: 100,
      render: (_: unknown, record: Opportunity) => STAGE_LABELS[record.stage],
    },
    {
      title: "最近跟进",
      key: "lastFollowUp",
      width: 170,
      render: (_: unknown, record: Opportunity) =>
        dayjs(record.updatedAt).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "暂停原因",
      dataIndex: "pauseReason",
      key: "pauseReason",
      render: (value: string | null) => value || "-",
    },
    {
      title: "操作",
      key: "action",
      width: 260,
      render: (_: unknown, record: Opportunity) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openForecastDrawer(record)}
          >
            预测详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PauseCircleOutlined />}
            onClick={() => openPauseDrawer(record)}
            disabled={!can("PERM-OM-UPDATE") || !!record.result}
          >
            暂停
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => navigate("/opportunities")}
          >
            商机详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        商机预测与暂停管理
      </Title>

      {hasUnavailableForecast && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="部分商机预测暂不可用，可先继续查看列表与暂停管理"
        />
      )}

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            allowClear
            placeholder="阶段"
            style={{ width: 140 }}
            value={stageFilter}
            onChange={setStageFilter}
          >
            {Object.entries(STAGE_LABELS).map(([value, label]) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>

          <Select
            allowClear
            placeholder="承诺带"
            style={{ width: 140 }}
            value={commitBandFilter}
            onChange={setCommitBandFilter}
          >
            {Object.entries(COMMIT_BAND_META).map(([value, meta]) => (
              <Select.Option key={value} value={value}>
                {meta.text}
              </Select.Option>
            ))}
          </Select>

          <Select
            style={{ width: 140 }}
            value={pauseFilter}
            onChange={setPauseFilter}
            options={[
              { value: "all", label: "全部" },
              { value: "paused", label: "仅已暂停" },
            ]}
          />
        </Space>
      </Card>

      <Table
        rowKey="id"
        loading={listLoading || forecastMapLoading}
        columns={columns}
        dataSource={filteredRows}
        pagination={{
          current: page,
          pageSize,
          total: listData?.meta?.total || 0,
          showSizeChanger: true,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage);
            setPageSize(nextSize);
          },
        }}
      />

      <Drawer
        title={`预测详情${selectedOpportunity ? ` - ${selectedOpportunity.name}` : ""}`}
        width={520}
        open={isForecastDrawerOpen}
        onClose={() => setIsForecastDrawerOpen(false)}
      >
        {selectedForecastError ? (
          <Alert type="warning" showIcon message="预测暂不可用，请稍后重试" />
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            <Card loading={selectedForecastLoading}>
              <Space size={24}>
                <div>
                  <Text type="secondary">赢单概率</Text>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>
                    {selectedForecast?.winRate ?? "-"}%
                  </div>
                </div>
                <div>
                  <Text type="secondary">承诺带</Text>
                  <div style={{ marginTop: 8 }}>
                    {selectedForecast ? (
                      <Tag color={COMMIT_BAND_META[selectedForecast.commitBand].color}>
                        {COMMIT_BAND_META[selectedForecast.commitBand].text}
                      </Tag>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
              </Space>
            </Card>

            <Card title="驱动因子" loading={selectedForecastLoading}>
              {(selectedForecast?.drivers || []).length > 0 ? (
                <Space direction="vertical" style={{ width: "100%" }}>
                  {selectedForecast?.drivers.map((driver) => (
                    <Card key={`${driver.label}-${driver.reason}`} size="small">
                      <Space direction="vertical" size={2}>
                        <Text strong>
                          {driver.label}
                          <Tag style={{ marginLeft: 8 }}>
                            {driver.score > 0 ? `+${driver.score}` : driver.score}
                          </Tag>
                        </Text>
                        <Text type="secondary">{driver.reason}</Text>
                      </Space>
                    </Card>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">暂无驱动因子</Text>
              )}
            </Card>
          </Space>
        )}
      </Drawer>

      <Drawer
        title={`暂停商机${selectedOpportunity ? ` - ${selectedOpportunity.name}` : ""}`}
        width={420}
        open={isPauseDrawerOpen}
        onClose={() => setIsPauseDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setIsPauseDrawerOpen(false)}>取消</Button>
            <Button
              type="primary"
              loading={pauseMutation.isLoading}
              onClick={handlePauseSubmit}
            >
              确认暂停
            </Button>
          </Space>
        }
      >
        <Form form={pauseForm} layout="vertical">
          <Form.Item
            label="暂停原因"
            name="pauseReason"
            rules={[
              { required: true, message: "请输入暂停原因" },
              { max: 255, message: "最多 255 字符" },
            ]}
          >
            <Input.TextArea rows={4} placeholder="例如：等待预算审批" />
          </Form.Item>
        </Form>
        <Alert
          type="info"
          showIcon
          message="恢复推进时可在商机详情中清空暂停原因并继续阶段推进。"
        />
      </Drawer>
    </div>
  );
}
