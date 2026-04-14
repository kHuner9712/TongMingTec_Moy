import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Empty,
  Spin,
  Result,
  Table,
  Tag,
  Select,
  Space,
} from "antd";
import {
  PhoneOutlined,
  TrophyOutlined,
  UserOutlined,
  DollarOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { useQuery } from "react-query";
import { dashboardApi, SalesDashboardData } from "../services/dashboard";
import { useAuthStore } from "../stores/authStore";

const { Title } = Typography;

const STAGE_LABELS: Record<string, string> = {
  qualification: "资格审查",
  needs_analysis: "需求分析",
  proposal: "方案报价",
  negotiation: "谈判",
  closed_won: "赢单",
  closed_lost: "输单",
};

const STAGE_COLORS: Record<string, string> = {
  qualification: "blue",
  needs_analysis: "cyan",
  proposal: "geekblue",
  negotiation: "orange",
  closed_won: "green",
  closed_lost: "red",
};

export default function SalesDashboard() {
  const { hasPermission } = useAuthStore();
  const [months, setMonths] = useState(6);

  const { data, isLoading, isError, refetch } = useQuery(
    ["sales-dashboard", months],
    () => dashboardApi.getSalesDashboard(months),
    { enabled: hasPermission("PERM-DASH-VIEW") },
  );

  useEffect(() => {
    refetch();
  }, [months, refetch]);

  if (!hasPermission("PERM-DASH-VIEW")) {
    return <Result status="403" title="无权限" subTitle="需要 PERM-DASH-VIEW 权限" />;
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="销售看板数据加载失败，请重试"
        extra={<button onClick={() => refetch()}>重试</button>}
      />
    );
  }

  const kpi = data.kpi || {};
  const pipeline = data.pipeline || { total: 0, byStage: {}, byResult: {} };
  const revenueTrend = data.revenueTrend || [];
  const topOpps = data.topOpportunities || [];

  const pipelineColumns = [
    { title: "阶段", dataIndex: "stage", key: "stage", render: (s: string) => (
      <Tag color={STAGE_COLORS[s] || "default"}>{STAGE_LABELS[s] || s}</Tag>
    )},
    { title: "数量", dataIndex: "count", key: "count" },
  ];

  const pipelineData = Object.entries(pipeline.byStage || {}).map(
    ([stage, count]) => ({ stage, count: count as number, key: stage }),
  );

  const topOppColumns = [
    { title: "名称", dataIndex: "name", key: "name", ellipsis: true },
    { title: "金额", dataIndex: "amount", key: "amount", render: (v: number) =>
      v ? `¥${v.toLocaleString()}` : "-" },
    { title: "阶段", dataIndex: "stage", key: "stage", render: (s: string) => (
      <Tag color={STAGE_COLORS[s] || "default"}>{STAGE_LABELS[s] || s}</Tag>
    )},
    { title: "结果", dataIndex: "result", key: "result", render: (r: string) => {
      if (!r) return "-";
      return <Tag color={r === "won" ? "green" : "red"}>{r === "won" ? "赢单" : "输单"}</Tag>;
    }},
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <PhoneOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          销售看板
        </Title>
        <Space>
          <span>时间范围：</span>
          <Select value={months} onChange={setMonths} style={{ width: 120 }}>
            <Select.Option value={3}>近3个月</Select.Option>
            <Select.Option value={6}>近6个月</Select.Option>
            <Select.Option value={12}>近12个月</Select.Option>
          </Select>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="商机总数"
              value={kpi.totalOpportunities}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="赢单数 / 赢单率"
              value={`${kpi.wonOpportunities} / ${kpi.winRate}%`}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="线索转化率"
              value={`${kpi.leadConvertRate}%`}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总收入"
              value={kpi.totalRevenue}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="销售漏斗" bordered={false}>
            {pipelineData.length === 0 ? (
              <Empty description="暂无漏斗数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                dataSource={pipelineData}
                columns={pipelineColumns}
                pagination={false}
                size="small"
                rowKey="key"
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="收入趋势" bordered={false}>
            {revenueTrend.length === 0 ? (
              <Empty description="暂无收入数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                dataSource={revenueTrend.map((r, i) => ({ ...r, key: i }))}
                columns={[
                  { title: "月份", dataIndex: "month", key: "month" },
                  { title: "收入", dataIndex: "revenue", key: "revenue", render: (v: number) =>
                    `¥${v.toLocaleString()}` },
                ]}
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card title={<Space><RiseOutlined />Top 商机</Space>} bordered={false}>
        {topOpps.length === 0 ? (
          <Empty description="暂无商机数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            dataSource={topOpps.map((o: any, i: number) => ({ ...o, key: o.id || i }))}
            columns={topOppColumns}
            pagination={false}
            size="small"
          />
        )}
      </Card>
    </div>
  );
}
