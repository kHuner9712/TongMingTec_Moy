import { useEffect, useState } from 'react';
import { Card, Typography, List, Tag, Tabs, Space, Button, Empty, Row, Col, Statistic } from 'antd';
import { WarningOutlined, RiseOutlined, SyncOutlined, CustomerServiceOutlined, EyeOutlined, BulbOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { customerMemoryApi } from '../services/customer-memory';

const { Title, Text } = Typography;

interface RiskSignalItem {
  id: string;
  customerId: string;
  customerName?: string;
  riskType: string;
  riskLevel: string;
  reason: string;
  aiSuggestion?: string;
  createdAt: string;
}

export default function RiskSignals() {
  const navigate = useNavigate();
  const [signals, setSignals] = useState<RiskSignalItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    customerMemoryApi.listRisks().then((res: any) => {
      setSignals(res?.items || res || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const riskStats = {
    high: signals.filter((s) => s.riskLevel === 'high' || s.riskLevel === 'critical').length,
    medium: signals.filter((s) => s.riskLevel === 'medium').length,
    opportunities: signals.filter((s) => s.riskType === 'opportunity').length,
  };

  const renderSignalCard = (item: RiskSignalItem) => (
    <List.Item
      actions={[
        <Button key="360" type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/customer-360/${item.customerId}`)}>客户 360</Button>,
      ]}
    >
      <List.Item.Meta
        title={
          <Space>
            <Tag color={item.riskLevel === 'critical' ? '#cf1322' : item.riskLevel === 'high' ? 'red' : item.riskLevel === 'medium' ? 'orange' : 'green'}>
              {item.riskLevel}
            </Tag>
            <Text strong>{item.customerName || item.customerId.substring(0, 8)}</Text>
            <Tag>{item.riskType}</Tag>
          </Space>
        }
        description={
          <div>
            <div>{item.reason}</div>
            {item.aiSuggestion && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary"><BulbOutlined /> AI 建议: {item.aiSuggestion}</Text>
              </div>
            )}
          </div>
        }
      />
    </List.Item>
  );

  const tabItems = [
    {
      key: 'risk',
      label: <Space><WarningOutlined /> 风险信号</Space>,
      children: (
        <List
          loading={loading}
          dataSource={signals.filter((s) => s.riskType !== 'opportunity')}
          renderItem={renderSignalCard}
          locale={{ emptyText: <Empty description="暂无风险信号" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      ),
    },
    {
      key: 'opportunity',
      label: <Space><RiseOutlined /> 机会信号</Space>,
      children: (
        <List
          dataSource={signals.filter((s) => s.riskType === 'opportunity')}
          renderItem={renderSignalCard}
          locale={{ emptyText: <Empty description="暂无机会信号" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      ),
    },
    {
      key: 'renewal',
      label: <Space><SyncOutlined /> 续费预警</Space>,
      children: <Empty description="续费预警功能开发中" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
    },
    {
      key: 'service',
      label: <Space><CustomerServiceOutlined /> 服务预警</Space>,
      children: <Empty description="服务预警功能开发中" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
    },
  ];

  return (
    <div>
      <Title level={3}>
        <WarningOutlined style={{ marginRight: 8, color: '#faad14' }} />
        风险 / 机会 / 续费 / 服务预警台
      </Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card><Statistic title="高风险" value={riskStats.high} valueStyle={{ color: riskStats.high > 0 ? '#cf1322' : undefined }} prefix={<WarningOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="中风险" value={riskStats.medium} valueStyle={{ color: riskStats.medium > 0 ? '#faad14' : undefined }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="机会" value={riskStats.opportunities} valueStyle={{ color: '#52c41a' }} prefix={<RiseOutlined />} /></Card>
        </Col>
      </Row>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
