import { useEffect, useState } from "react";
import {
  Card,
  Typography,
  List,
  Tag,
  Tabs,
  Space,
  Button,
  Empty,
  Row,
  Col,
  Statistic,
  Select,
} from "antd";
import {
  WarningOutlined,
  RiseOutlined,
  SyncOutlined,
  CustomerServiceOutlined,
  EyeOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { customerMemoryApi } from "../services/customer-memory";
import { usePermission } from "../hooks/usePermission";
import { CustomerRisk, RiskLevel } from "../types";

const { Title, Text } = Typography;

interface RiskSignalItem {
  id: string;
  customerId: string;
  customerName?: string;
  riskLevel: string;
  riskType: string;
  reason: string;
  aiSuggestion?: string;
  assessedAt: string;
}

const riskColorMap: Record<string, string> = {
  low: "green",
  medium: "orange",
  high: "red",
  critical: "#cf1322",
};

const riskLabelMap: Record<string, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  critical: "严重",
};

const riskTypeLabelMap: Record<string, string> = {
  churn_risk: "流失风险",
  overdue: "逾期",
  silent: "沉睡",
  stalled: "停滞",
  opportunity: "机会",
  complaint: "投诉",
};

function deriveRiskType(
  riskLevel: string,
  riskFactors: Record<string, unknown>,
): string {
  if (riskFactors.riskType && typeof riskFactors.riskType === "string") {
    return riskFactors.riskType;
  }
  if (
    riskFactors.overdueBills &&
    Number(riskFactors.overdueBills) > 0
  ) {
    return "overdue";
  }
  if (
    riskFactors.silentDays &&
    Number(riskFactors.silentDays) > 14
  ) {
    return "silent";
  }
  if (
    riskFactors.stalledOpportunities &&
    Number(riskFactors.stalledOpportunities) > 2
  ) {
    return "stalled";
  }
  if (riskLevel === "low") {
    return "opportunity";
  }
  return "churn_risk";
}

export default function RiskSignals() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [signals, setSignals] = useState<RiskSignalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [riskLevelFilter, setRiskLevelFilter] = useState<
    RiskLevel | undefined
  >();

  useEffect(() => {
    setLoading(true);
    customerMemoryApi
      .listRisks({ riskLevel: riskLevelFilter })
      .then((res) => {
        const items: CustomerRisk[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : [];

        const mapped: RiskSignalItem[] = items.map((risk) => {
          const riskFactors = (risk.riskFactors ||
            {}) as Record<string, unknown>;
          const riskLevel = risk.riskLevel || "low";
          const riskWithName = risk as CustomerRisk & {
            customerName?: string;
          };
          return {
            id: risk.id || "",
            customerId: risk.customerId || "",
            customerName: riskWithName.customerName,
            riskLevel,
            riskType: deriveRiskType(riskLevel, riskFactors),
            reason:
              (riskFactors.hint as string) ||
              (riskFactors.computedLevel
                ? `风险等级: ${riskLabelMap[riskLevel] || riskLevel}`
                : ""),
            aiSuggestion: riskFactors.aiSuggestion
              ? String(riskFactors.aiSuggestion)
              : undefined,
            assessedAt: risk.assessedAt || risk.createdAt || "",
          };
        });
        setSignals(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [riskLevelFilter]);

  const riskSignals = signals.filter((s) => s.riskType !== "opportunity");
  const opportunitySignals = signals.filter(
    (s) => s.riskType === "opportunity",
  );

  const riskStats = {
    high: signals.filter(
      (s) => s.riskLevel === "high" || s.riskLevel === "critical",
    ).length,
    medium: signals.filter((s) => s.riskLevel === "medium").length,
    opportunities: opportunitySignals.length,
  };

  const renderSignalCard = (item: RiskSignalItem) => (
    <List.Item
      actions={[
        can("PERM-CM-VIEW") && (
          <Button
            key="360"
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/customer-360/${item.customerId}`)}
          >
            客户 360
          </Button>
        ),
      ].filter(Boolean)}
    >
      <List.Item.Meta
        title={
          <Space>
            <Tag color={riskColorMap[item.riskLevel] || "default"}>
              {riskLabelMap[item.riskLevel] || item.riskLevel}
            </Tag>
            <Text strong>
              {item.customerName || item.customerId.substring(0, 8)}
            </Text>
            <Tag>
              {riskTypeLabelMap[item.riskType] || item.riskType}
            </Tag>
          </Space>
        }
        description={
          <div>
            <div>{item.reason}</div>
            {item.aiSuggestion && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">
                  <BulbOutlined /> AI 建议: {item.aiSuggestion}
                </Text>
              </div>
            )}
          </div>
        }
      />
    </List.Item>
  );

  const tabItems = [
    {
      key: "risk",
      label: (
        <Space>
          <WarningOutlined /> 风险信号
        </Space>
      ),
      children: (
        <List
          loading={loading}
          dataSource={riskSignals}
          renderItem={renderSignalCard}
          locale={{
            emptyText: (
              <Empty
                description="暂无风险信号"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      ),
    },
    {
      key: "opportunity",
      label: (
        <Space>
          <RiseOutlined /> 机会信号
        </Space>
      ),
      children: (
        <List
          dataSource={opportunitySignals}
          renderItem={renderSignalCard}
          locale={{
            emptyText: (
              <Empty
                description="暂无机会信号"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      ),
    },
    {
      key: "renewal",
      label: (
        <Space>
          <SyncOutlined /> 续费预警
          <Tag color="blue" style={{ fontSize: 10, lineHeight: "16px" }}>
            S2
          </Tag>
        </Space>
      ),
      children: (
        <Empty
          description="续费预警属于 S2 阶段（CSM 域），当前阶段暂不开放"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ),
    },
    {
      key: "service",
      label: (
        <Space>
          <CustomerServiceOutlined /> 服务预警
          <Tag color="blue" style={{ fontSize: 10, lineHeight: "16px" }}>
            S2
          </Tag>
        </Space>
      ),
      children: (
        <Empty
          description="服务预警属于 S2 阶段（CSM 域），当前阶段暂不开放"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <WarningOutlined style={{ marginRight: 8, color: "#faad14" }} />
        风险 / 机会 / 续费 / 服务预警台
      </Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="高风险"
              value={riskStats.high}
              valueStyle={{
                color: riskStats.high > 0 ? "#cf1322" : undefined,
              }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="中风险"
              value={riskStats.medium}
              valueStyle={{
                color: riskStats.medium > 0 ? "#faad14" : undefined,
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="机会"
              value={riskStats.opportunities}
              valueStyle={{ color: "#52c41a" }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="风险等级筛选"
            allowClear
            style={{ width: 140 }}
            value={riskLevelFilter}
            onChange={setRiskLevelFilter}
            options={[
              { label: "低风险", value: "low" },
              { label: "中风险", value: "medium" },
              { label: "高风险", value: "high" },
              { label: "严重", value: "critical" },
            ]}
          />
        </Space>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
