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
  CustomerServiceOutlined,
  MinusOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import {
  DashboardBoardData,
  DashboardIndicator,
  DashboardMetricStatus,
  DashboardRange,
  dashboardApi,
} from '../../services/dashboard';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text } = Typography;

const RANGE_OPTIONS: Array<{ label: string; value: DashboardRange }> = [
  { label: '最近7天', value: '7d' },
  { label: '最近30天', value: '30d' },
  { label: '最近90天', value: '90d' },
];

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

export default function ServiceDashboard() {
  const { hasPermission } = useAuthStore();
  const [range, setRange] = useState<DashboardRange>('30d');
  const [activeIndicator, setActiveIndicator] = useState<DashboardIndicator | null>(
    null,
  );

  const { data, isLoading, isError, refetch } = useQuery<DashboardBoardData>(
    ['service-dashboard-v2', range],
    () => dashboardApi.getServiceDashboard(range),
    { enabled: hasPermission('PERM-DASH-VIEW') },
  );

  const indicatorMap = useMemo(() => {
    if (!data) return new Map<string, DashboardIndicator>();
    return new Map(data.indicators.map((indicator) => [indicator.key, indicator]));
  }, [data]);

  if (!hasPermission('PERM-DASH-VIEW')) {
    return <Result status="403" title="无权限" subTitle="需要 PERM-DASH-VIEW 权限" />;
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
        subTitle="服务看板数据加载失败，请重试"
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
          <CustomerServiceOutlined style={{ marginRight: 8, color: '#722ed1' }} />
          服务看板
        </Title>
        <Select<DashboardRange>
          value={range}
          options={RANGE_OPTIONS}
          onChange={setRange}
          style={{ width: 140 }}
        />
      </div>

      <Alert
        type="info"
        showIcon
        message="结果指标（服务）"
        description={`窗口：${data.window.current.label}`}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {data.groups.map((group) => (
          <Col xs={24} md={12} key={group.key}>
            <Card title={group.name}>
              <Text type="secondary">{group.description}</Text>
              <Divider style={{ margin: '12px 0' }} />
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {group.metricKeys.map((metricKey) => {
                  const metric = indicatorMap.get(metricKey);
                  if (!metric) return null;

                  return (
                    <div key={metric.key}>
                      <Space
                        style={{ width: '100%', justifyContent: 'space-between' }}
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
                          {trendNode(metric)}
                        </Space>
                      </Space>
                      <Button
                        type="link"
                        size="small"
                        style={{ padding: 0 }}
                        onClick={() => setActiveIndicator(metric)}
                      >
                        查看来源说明
                      </Button>
                    </div>
                  );
                })}
              </Space>
            </Card>
          </Col>
        ))}
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
          <Alert type="success" showIcon message="当前服务指标无异常。" />
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
            <Descriptions.Item label="关键字段">
              {activeIndicator.source.fields.join(', ')}
            </Descriptions.Item>
            <Descriptions.Item label="数据质量">
              <Tag color={activeIndicator.source.dataQuality === 'ready' ? 'green' : 'orange'}>
                {activeIndicator.source.dataQuality}
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
