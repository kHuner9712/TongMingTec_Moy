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
  InputNumber,
  DatePicker,
  Timeline,
  Steps,
  Row,
  Col,
  Statistic,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  RightOutlined,
  TrophyOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { opportunityApi, OpportunitySummary } from "../services/opportunity";
import {
  Opportunity,
  OpportunityStage,
  OpportunityResult,
  CreateOpportunityDto,
  OpportunityStageHistory,
} from "../types";
import CustomerSelect from "../components/CustomerSelect";
import dayjs from "dayjs";
import { useWebSocket } from "../hooks/useWebSocket";
import { useAuthStore } from "../stores/authStore";

const STAGE_CONFIG: Record<OpportunityStage, { text: string; color: string }> =
  {
    discovery: { text: "发现", color: "#1890ff" },
    qualification: { text: "验证", color: "#13c2c2" },
    proposal: { text: "报价", color: "#faad14" },
    negotiation: { text: "谈判", color: "#722ed1" },
  };

const STAGE_ORDER: OpportunityStage[] = [
  "discovery",
  "qualification",
  "proposal",
  "negotiation",
];

const RESULT_CONFIG: Record<
  OpportunityResult,
  { text: string; color: string }
> = {
  won: { text: "赢单", color: "green" },
  lost: { text: "输单", color: "red" },
};

function SummaryCards({ summary }: { summary?: OpportunitySummary }) {
  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={4}>
        <Card>
          <Statistic
            title="商机总数"
            value={summary?.total || 0}
            suffix="个"
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card>
          <Statistic
            title="总金额"
            value={summary?.totalAmount || 0}
            prefix="¥"
            precision={2}
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card>
          <Statistic
            title="赢单数"
            value={summary?.byResult?.won || 0}
            valueStyle={{ color: "#52c41a" }}
            suffix="个"
          />
        </Card>
      </Col>
    </Row>
  );
}

function StageStats({ summary }: { summary?: OpportunitySummary }) {
  return (
    <Card title="阶段分布" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        {STAGE_ORDER.map((stage) => (
          <Col span={6} key={stage}>
            <div style={{ textAlign: "center" }}>
              <Tag color={STAGE_CONFIG[stage].color} style={{ marginBottom: 8 }}>
                {STAGE_CONFIG[stage].text}
              </Tag>
              <div style={{ fontSize: 24, fontWeight: 600 }}>
                {summary?.byStage?.[stage] || 0}
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
}

export default function Opportunities() {
  const queryClient = useQueryClient();
  const tokens = useAuthStore((state) => state.tokens);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [stageFilter, setStageFilter] = useState<
    OpportunityStage | undefined
  >();
  const [resultFilter, setResultFilter] = useState<
    OpportunityResult | undefined
  >();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [createForm] = Form.useForm();
  const [stageForm] = Form.useForm();
  const [resultForm] = Form.useForm();
  const [versionConflict, setVersionConflict] = useState<string | null>(null);

  useWebSocket({ token: tokens?.accessToken || "" });

  const { data, isLoading } = useQuery(
    ["opportunities", page, pageSize, stageFilter, resultFilter],
    () =>
      opportunityApi.list({
        page,
        page_size: pageSize,
        stage: stageFilter,
        result: resultFilter,
      }),
    { keepPreviousData: true },
  );

  const { data: summary } = useQuery(
    ["opportunity-summary"],
    () => opportunityApi.getSummary(),
    { refetchInterval: 30000 },
  );

  const { data: opportunityDetail, refetch: refetchOpportunityDetail } =
    useQuery(
      ["opportunity", selectedOpportunity?.id],
      () => opportunityApi.get(selectedOpportunity!.id),
      { enabled: !!selectedOpportunity && isDetailDrawerOpen },
    );

  const handleVersionConflict = (error: unknown) => {
    const err = error as { code?: string; message?: string };
    if (err?.code === "CONFLICT_VERSION" || err?.message?.includes("CONFLICT_VERSION")) {
      setVersionConflict("该商机已被他人修改，请刷新页面后重试");
      return true;
    }
    return false;
  };

  const createMutation = useMutation(opportunityApi.create, {
    onSuccess: () => {
      message.success("创建成功");
      setIsCreateModalOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries(["opportunities"]);
      queryClient.invalidateQueries(["opportunity-summary"]);
    },
    onError: (error: unknown) => {
      if (!handleVersionConflict(error)) {
        const err = error as { message?: string };
        message.error(err?.message || "创建失败");
      }
    },
  });

  const stageMutation = useMutation(
    (data: {
      id: string;
      toStage: OpportunityStage;
      reason?: string;
      version: number;
    }) =>
      opportunityApi.changeStage(
        data.id,
        data.toStage,
        data.reason,
        data.version,
      ),
    {
      onSuccess: () => {
        message.success("阶段推进成功");
        setIsStageModalOpen(false);
        stageForm.resetFields();
        queryClient.invalidateQueries(["opportunities"]);
        queryClient.invalidateQueries(["opportunity-summary"]);
        if (selectedOpportunity) {
          refetchOpportunityDetail();
        }
      },
      onError: (error: unknown) => {
        if (!handleVersionConflict(error)) {
          const err = error as { message?: string };
          message.error(err?.message || "阶段推进失败");
        }
      },
    },
  );

  const resultMutation = useMutation(
    (data: {
      id: string;
      result: OpportunityResult;
      reason?: string;
      version: number;
    }) =>
      opportunityApi.markResult(
        data.id,
        data.result,
        data.reason,
        data.version,
      ),
    {
      onSuccess: () => {
        message.success("结果标记成功");
        setIsResultModalOpen(false);
        resultForm.resetFields();
        queryClient.invalidateQueries(["opportunities"]);
        queryClient.invalidateQueries(["opportunity-summary"]);
      },
      onError: (error: unknown) => {
        if (!handleVersionConflict(error)) {
          const err = error as { message?: string };
          message.error(err?.message || "结果标记失败");
        }
      },
    },
  );

  const handleCreate = () => {
    createForm.validateFields().then((values) => {
      const data: CreateOpportunityDto = {
        ...values,
        expectedCloseDate: values.expectedCloseDate?.toISOString(),
      };
      createMutation.mutate(data);
    });
  };

  const handleStageChange = () => {
    stageForm.validateFields().then((values) => {
      if (selectedOpportunity) {
        stageMutation.mutate({
          id: selectedOpportunity.id,
          toStage: values.toStage,
          reason: values.reason,
          version: selectedOpportunity.version,
        });
      }
    });
  };

  const handleResultMark = () => {
    resultForm.validateFields().then((values) => {
      if (selectedOpportunity) {
        resultMutation.mutate({
          id: selectedOpportunity.id,
          result: values.result,
          reason: values.reason,
          version: selectedOpportunity.version,
        });
      }
    });
  };

  const openDetailDrawer = (record: Opportunity) => {
    setSelectedOpportunity(record);
    setVersionConflict(null);
    setIsDetailDrawerOpen(true);
  };

  const openStageModal = (record: Opportunity) => {
    setSelectedOpportunity(record);
    setVersionConflict(null);
    const currentIndex = STAGE_ORDER.indexOf(record.stage);
    const nextStage = STAGE_ORDER[currentIndex + 1];
    stageForm.setFieldsValue({ toStage: nextStage, reason: "" });
    setIsStageModalOpen(true);
  };

  const openResultModal = (record: Opportunity) => {
    setSelectedOpportunity(record);
    setVersionConflict(null);
    resultForm.resetFields();
    setIsResultModalOpen(true);
  };

  const getCurrentStep = (stage: OpportunityStage) =>
    STAGE_ORDER.indexOf(stage);

  const handleRefresh = () => {
    queryClient.invalidateQueries(["opportunities"]);
    queryClient.invalidateQueries(["opportunity-summary"]);
    setVersionConflict(null);
  };

  const columns = [
    { title: "商机名称", dataIndex: "name", key: "name" },
    { title: "客户", dataIndex: "customerName", key: "customerName" },
    { title: "负责人", dataIndex: "ownerUserName", key: "ownerUserName" },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      render: (v: number, record: Opportunity) =>
        v ? `${record.currency} ${v.toLocaleString()}` : "-",
    },
    {
      title: "阶段",
      dataIndex: "stage",
      key: "stage",
      render: (v: OpportunityStage) => (
        <Tag color={STAGE_CONFIG[v]?.color}>{STAGE_CONFIG[v]?.text || v}</Tag>
      ),
    },
    {
      title: "结果",
      dataIndex: "result",
      key: "result",
      render: (v: OpportunityResult) =>
        v ? (
          <Tag color={RESULT_CONFIG[v]?.color}>{RESULT_CONFIG[v]?.text}</Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "预计成交日期",
      dataIndex: "expectedCloseDate",
      key: "expectedCloseDate",
      render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "操作",
      key: "action",
      width: 250,
      render: (_: unknown, record: Opportunity) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetailDrawer(record)}
          >
            详情
          </Button>
          {!record.result && record.stage !== "negotiation" && (
            <Button
              type="link"
              size="small"
              icon={<RightOutlined />}
              onClick={() => openStageModal(record)}
            >
              推进
            </Button>
          )}
          {!record.result && record.stage === "negotiation" && (
            <Button
              type="link"
              size="small"
              icon={<TrophyOutlined />}
              onClick={() => openResultModal(record)}
            >
              结果
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

      <SummaryCards summary={summary} />
      <StageStats summary={summary} />

      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Space>
          <Select
            placeholder="阶段筛选"
            allowClear
            style={{ width: 120 }}
            value={stageFilter}
            onChange={setStageFilter}
          >
            {Object.entries(STAGE_CONFIG).map(([key, { text }]) => (
              <Select.Option key={key} value={key}>
                {text}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="结果筛选"
            allowClear
            style={{ width: 120 }}
            value={resultFilter}
            onChange={setResultFilter}
          >
            {Object.entries(RESULT_CONFIG).map(([key, { text }]) => (
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
        >
          新建商机
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
        title="新建商机"
        open={isCreateModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsCreateModalOpen(false)}
        confirmLoading={createMutation.isLoading}
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
            name="name"
            label="商机名称"
            rules={[{ required: true, message: "请输入商机名称" }]}
          >
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item name="amount" label="金额">
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="expectedCloseDate" label="预计成交日期">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="推进阶段"
        open={isStageModalOpen}
        onOk={handleStageChange}
        onCancel={() => setIsStageModalOpen(false)}
        confirmLoading={stageMutation.isLoading}
      >
        <Form form={stageForm} layout="vertical">
          <Form.Item
            name="toStage"
            label="目标阶段"
            rules={[{ required: true }]}
          >
            <Select>
              {Object.entries(STAGE_CONFIG).map(([key, { text }]) => (
                <Select.Option key={key} value={key}>
                  {text}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="标记结果"
        open={isResultModalOpen}
        onOk={handleResultMark}
        onCancel={() => setIsResultModalOpen(false)}
        confirmLoading={resultMutation.isLoading}
      >
        <Form form={resultForm} layout="vertical">
          <Form.Item
            name="result"
            label="结果"
            rules={[{ required: true, message: "请选择结果" }]}
          >
            <Select>
              {Object.entries(RESULT_CONFIG).map(([key, { text }]) => (
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
        title="商机详情"
        placement="right"
        width={700}
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
      >
        {opportunityDetail && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Steps
                current={getCurrentStep(opportunityDetail.stage)}
                items={STAGE_ORDER.map((stage) => ({
                  title: STAGE_CONFIG[stage].text,
                  status: opportunityDetail.result
                    ? "finish"
                    : stage === opportunityDetail.stage
                      ? "process"
                      : getCurrentStep(stage) <
                          getCurrentStep(opportunityDetail.stage)
                        ? "finish"
                        : "wait",
                }))}
              />
            </Card>

            <Card title="基本信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="商机名称">
                  {opportunityDetail.name}
                </Descriptions.Item>
                <Descriptions.Item label="客户">
                  {opportunityDetail.customerName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="负责人">
                  {opportunityDetail.ownerUserName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="金额">
                  {opportunityDetail.amount
                    ? `${opportunityDetail.currency} ${opportunityDetail.amount.toLocaleString()}`
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="阶段">
                  <Tag
                    color={
                      STAGE_CONFIG[opportunityDetail.stage as OpportunityStage]
                        ?.color
                    }
                  >
                    {
                      STAGE_CONFIG[opportunityDetail.stage as OpportunityStage]
                        ?.text
                    }
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="结果">
                  {opportunityDetail.result ? (
                    <Tag
                      color={
                        RESULT_CONFIG[
                          opportunityDetail.result as OpportunityResult
                        ]?.color
                      }
                    >
                      {
                        RESULT_CONFIG[
                          opportunityDetail.result as OpportunityResult
                        ]?.text
                      }
                    </Tag>
                  ) : (
                    "-"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="预计成交日期">
                  {opportunityDetail.expectedCloseDate
                    ? dayjs(opportunityDetail.expectedCloseDate).format(
                        "YYYY-MM-DD",
                      )
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(opportunityDetail.createdAt).format(
                    "YYYY-MM-DD HH:mm:ss",
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="阶段历史">
              {opportunityDetail.stageHistory &&
              opportunityDetail.stageHistory.length > 0 ? (
                <Timeline
                  items={opportunityDetail.stageHistory.map((item: OpportunityStageHistory) => ({
                    color: "blue",
                    children: (
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {item.fromStage
                            ? STAGE_CONFIG[item.fromStage as OpportunityStage]
                                ?.text
                            : "开始"}{" "}
                          →{" "}
                          {STAGE_CONFIG[item.toStage as OpportunityStage]?.text}
                        </div>
                        <div style={{ color: "#999", fontSize: 12 }}>
                          {dayjs(item.createdAt).format("YYYY-MM-DD HH:mm")}
                        </div>
                        {item.reason && <div>{item.reason}</div>}
                      </div>
                    ),
                  }))}
                />
              ) : (
                <div
                  style={{ color: "#999", textAlign: "center", padding: 20 }}
                >
                  暂无阶段历史
                </div>
              )}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
