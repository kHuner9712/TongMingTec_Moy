import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  List,
  Modal,
  Result,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  LineChartOutlined,
  MinusOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  DashboardBoardData,
  DashboardIndicator,
  DashboardMetricStatus,
  DashboardRange,
  dashboardApi,
} from '../services/dashboard';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;

const RANGE_OPTIONS: Array<{ label: string; value: DashboardRange }> = [
  { label: '最近7天', value: '7d' },
  { label: '最近30天', value: '30d' },
  { label: '最近90天', value: '90d' },
];

const STATUS_PRIORITY: Record<DashboardMetricStatus, number> = {
  critical: 4,
  warning: 3,
  insufficient_data: 2,
  healthy: 1,
};

function statusLabel(status: DashboardMetricStatus): string {
  if (status === 'critical') return '异常';
  if (status === 'warning') return '预警';
  if (status === 'insufficient_data') return '样本不足';
  return '正常';
}

function statusColor(status: DashboardMetricStatus): string {
  if (status === 'critical') return 'red';
  if (status === 'warning') return 'orange';
  if (status === 'insufficient_data') return 'default';
  return 'green';
}

function qualityLabel(indicator: DashboardIndicator): string {
  if (indicator.source.qualityCategory === 'coverage_limited') return '覆盖率不足';
  if (indicator.source.qualityCategory === 'proxy') return '代理口径';
  if (indicator.status === 'insufficient_data') return '覆盖率不足';
  return '真实口径';
}

function qualityColor(indicator: DashboardIndicator): string {
  if (indicator.source.qualityCategory === 'coverage_limited') return 'volcano';
  if (indicator.source.qualityCategory === 'proxy') return 'orange';
  if (indicator.status === 'insufficient_data') return 'default';
  return 'green';
}

function trendNode(indicator: DashboardIndicator) {
  if (indicator.trend === 'up') {
    return (
      <Text type={indicator.performance === 'improved' ? 'success' : 'danger'}>
        <ArrowUpOutlined /> {Math.abs(indicator.deltaValue)}
      </Text>
    );
  }

  if (indicator.trend === 'down') {
    return (
      <Text type={indicator.performance === 'improved' ? 'success' : 'danger'}>
        <ArrowDownOutlined /> {Math.abs(indicator.deltaValue)}
      </Text>
    );
  }

  return (
    <Text type="secondary">
      <MinusOutlined /> 0
    </Text>
  );
}

export default function Cockpit() {
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const [range, setRange] = useState<DashboardRange>('30d');
  const [activeIndicator, setActiveIndicator] = useState<DashboardIndicator | null>(
    null,
  );

  const { data, isLoading, isError, refetch } = useQuery<DashboardBoardData>(
    ['executive-dashboard-v2', range],
    () => dashboardApi.getExecutiveDashboard(range),
    { enabled: hasPermission('PERM-DASH-VIEW') },
  );

  const indicatorMap = useMemo(() => {
    if (!data) return new Map<string, DashboardIndicator>();
    return new Map(data.indicators.map((indicator) => [indicator.key, indicator]));
  }, [data]);

  const qualityLimitedIndicators = useMemo(() => {
    if (!data) return [] as DashboardIndicator[];
    return data.indicators.filter(
      (indicator) =>
        indicator.source.qualityCategory !== 'actual' ||
        indicator.status === 'insufficient_data',
    );
  }, [data]);

  if (!hasPermission('PERM-DASH-VIEW')) {
    return (
      <Result status="403" title="无权限" subTitle="需要 PERM-DASH-VIEW 权限" />
    );
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="经营总览加载失败，请重试"
        extra={<Button onClick={() => refetch()}>重试</Button>}
      />
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          <ThunderboltOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          经营驾驶舱
        </Title>
        <Space>
          <Select<DashboardRange>
            value={range}
            options={RANGE_OPTIONS}
            onChange={setRange}
            style={{ width: 140 }}
          />
          <Button onClick={() => navigate('/dashboards/sales')}>
            <LineChartOutlined /> 销售看板
          </Button>
          <Button onClick={() => navigate('/dashboards/service')}>
            <TeamOutlined /> 服务看板
          </Button>
        </Space>
      </div>

      <Alert
        type="info"
        showIcon
        message="经营总览（6个结果指标）"
        description={`窗口：${data.window.current.label}（${new Date(
          data.generatedAt,
        ).toLocaleString()}）`}
        style={{ marginBottom: 16 }}
      />

      {qualityLimitedIndicators.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="数据质量说明"
          description={`以下指标仍存在代理口径或覆盖率不足：${qualityLimitedIndicators
            .map((item) => `${item.name}（${qualityLabel(item)}）`)
            .join('、')}`}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {data.groups.map((group) => {
          const metrics = group.metricKeys
            .map((key) => indicatorMap.get(key))
            .filter((indicator): indicator is DashboardIndicator => !!indicator);

          const groupStatus = metrics.reduce<DashboardMetricStatus>(
            (worst, current) =>
              STATUS_PRIORITY[current.status] > STATUS_PRIORITY[worst]
                ? current.status
                : worst,
            'healthy',
          );

          return (
            <Col xs={24} md={12} xl={8} key={group.key}>
              <Card
                title={group.name}
                extra={<Tag color={statusColor(groupStatus)}>{statusLabel(groupStatus)}</Tag>}
                data-testid={`cockpit-group-${group.key}`}
              >
                <Text type="secondary">{group.description}</Text>
                <Divider style={{ margin: '12px 0' }} />
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  {metrics.map((metric) => (
                    <div key={metric.key} data-testid={`cockpit-indicator-${metric.key}`}>
                      <Space
                        style={{
                          width: '100%',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div>
                          <Text strong>{metric.name}</Text>
                          <div>
                            <Text>{metric.currentLabel}</Text>
                            <Text type="secondary">（上期 {metric.previousLabel}）</Text>
                          </div>
                        </div>
                        <Space>
                          <Tag color={statusColor(metric.status)}>
                            {statusLabel(metric.status)}
                          </Tag>
                          <Tag color={qualityColor(metric)}>{qualityLabel(metric)}</Tag>
                          {trendNode(metric)}
                        </Space>
                      </Space>
                      <Button
                        type="link"
                        size="small"
                        style={{ padding: 0 }}
                        data-testid={`cockpit-indicator-source-${metric.key}`}
                        onClick={() => setActiveIndicator(metric)}
                      >
                        查看来源说明
                      </Button>
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card
        title={
          <Space>
            <WarningOutlined style={{ color: '#fa8c16' }} />
            <span>异常动作建议</span>
          </Space>
        }
      >
        {data.anomalies.length === 0 ? (
          <Alert type="success" showIcon message="当前窗口未发现异常指标。" />
        ) : (
          <List
            dataSource={data.anomalies}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={`${item.indicatorName} · ${item.currentLabel}`}
                  description={
                    <Space direction="vertical" size={4}>
                      <Text>{item.reason}</Text>
                      {item.suggestedActions.map((action) => (
                        <Text key={action.code} type="secondary">
                          {action.title}：{action.description}
                        </Text>
                      ))}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title={activeIndicator ? `${activeIndicator.name} · 来源说明` : '来源说明'}
        open={!!activeIndicator}
        onCancel={() => setActiveIndicator(null)}
        footer={null}
      >
        {activeIndicator && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="计算口径">
              {activeIndicator.source.formula}
            </Descriptions.Item>
            <Descriptions.Item label="来源模块">
              {activeIndicator.source.modules.join(' / ')}
            </Descriptions.Item>
            <Descriptions.Item label="来源表">
              {activeIndicator.source.tables.join(', ')}
            </Descriptions.Item>
            <Descriptions.Item label="关键字段">
              {activeIndicator.source.fields.join(', ')}
            </Descriptions.Item>
            <Descriptions.Item label="数据质量">
              <Tag color={qualityColor(activeIndicator)}>
                {qualityLabel(activeIndicator)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="说明">
              {activeIndicator.source.description}
            </Descriptions.Item>
            <Descriptions.Item label="治理备注">
              {activeIndicator.source.governanceNotes.length === 0
                ? '无'
                : activeIndicator.source.governanceNotes.join('；')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
