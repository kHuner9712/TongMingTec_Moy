import { useEffect } from 'react';
import { Row, Col, Card, Typography, Statistic, List, Tag, Space, Empty, Spin, Alert, Button } from 'antd';
import {
  RobotOutlined,
  WarningOutlined,
  TeamOutlined,
  AuditOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  RightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCockpitStore } from '../stores/cockpitStore';
import { useApprovalStore } from '../stores/approvalStore';

const { Title, Text } = Typography;

export default function Cockpit() {
  const navigate = useNavigate();
  const { aiInsights, riskSignals, keyMetrics, recentAgentRuns, fetchCockpitData, loading } = useCockpitStore();
  const { fetchPending, pendingApprovals } = useApprovalStore();

  useEffect(() => {
    fetchCockpitData();
    fetchPending();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  }

  const riskSummary = {
    high: riskSignals.filter((s) => s.severity === 'error').length,
    medium: riskSignals.filter((s) => s.severity === 'warning').length,
    low: riskSignals.filter((s) => s.severity === 'info').length,
  };

  const runSummary = {
    running: recentAgentRuns.filter((r) => r.status === 'running').length,
    awaiting: recentAgentRuns.filter((r) => r.status === 'awaiting_approval').length,
    succeeded: recentAgentRuns.filter((r) => r.status === 'succeeded').length,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <ThunderboltOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          经营驾驶舱
        </Title>
        <Button
          type="primary"
          icon={<RobotOutlined />}
          onClick={() => navigate('/workbench/ai-runs')}
        >
          AI 执行中心
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card hoverable onClick={() => navigate('/workbench/customer')}>
            <Statistic title="客户总数" value={keyMetrics.totalCustomers} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="活跃客户" value={keyMetrics.activeCustomers} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable onClick={() => navigate('/workbench/approvals')}>
            <Statistic
              title="待审批"
              value={pendingApprovals.length}
              prefix={<AuditOutlined />}
              valueStyle={{ color: pendingApprovals.length > 0 ? '#faad14' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="待跟进" value={keyMetrics.pendingFollowups} />
          </Card>
        </Col>
      </Row>

      {aiInsights.length > 0 && (
        <Alert
          type="info"
          showIcon
          icon={<BulbOutlined />}
          message="AI 经营洞察"
          description={
            <div>
              {aiInsights.slice(0, 3).map((item, idx) => (
                <div key={item.id} style={{ marginBottom: idx < 2 ? 4 : 0 }}>
                  <Text>{item.title}</Text>
                  {item.description && <Text type="secondary"> — {item.description}</Text>}
                </div>
              ))}
            </div>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#faad14' }} />
                <span>风险预警</span>
              </Space>
            }
            extra={<a onClick={() => navigate('/risk-signals')}>查看全部 <RightOutlined /></a>}
            style={{ marginBottom: 16 }}
          >
            {riskSignals.length === 0 ? (
              <Empty description="暂无风险预警" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <Space size={16}>
                    <Tag color="red"><WarningOutlined /> 高风险 {riskSummary.high}</Tag>
                    <Tag color="orange">中风险 {riskSummary.medium}</Tag>
                    <Tag color="blue">低风险 {riskSummary.low}</Tag>
                  </Space>
                </div>
                <List
                  size="small"
                  dataSource={riskSignals.slice(0, 5)}
                  renderItem={(item) => (
                    <List.Item
                      style={{ cursor: 'pointer' }}
                      onClick={() => item.relatedId && navigate(`/customer-360/${item.relatedId}`)}
                    >
                      <List.Item.Meta
                        title={<Text>{item.title}</Text>}
                        description={item.description}
                      />
                      <Tag color={item.severity === 'error' ? 'red' : item.severity === 'warning' ? 'orange' : 'blue'}>
                        {item.type}
                      </Tag>
                    </List.Item>
                  )}
                />
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RobotOutlined style={{ color: '#722ed1' }} />
                <span>Agent 执行动态</span>
              </Space>
            }
            extra={<a onClick={() => navigate('/workbench/ai-runs')}>查看全部 <RightOutlined /></a>}
          >
            {recentAgentRuns.length === 0 ? (
              <Empty description="暂无 Agent 执行记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <Space size={16}>
                    <Tag icon={<SyncOutlined spin />} color="processing">运行中 {runSummary.running}</Tag>
                    <Tag icon={<ClockCircleOutlined />} color="warning">等待审批 {runSummary.awaiting}</Tag>
                    <Tag icon={<CheckCircleOutlined />} color="success">今日完成 {runSummary.succeeded}</Tag>
                  </Space>
                </div>
                <List
                  size="small"
                  dataSource={recentAgentRuns.slice(0, 5)}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text code>{(item as any).agentId?.substring(0, 8)}</Text>
                            <Tag color={
                              item.status === 'succeeded' ? 'green' :
                              item.status === 'failed' ? 'red' :
                              item.status === 'awaiting_approval' ? 'orange' :
                              item.status === 'running' ? 'processing' : 'default'
                            }>
                              {item.status}
                            </Tag>
                          </Space>
                        }
                        description={item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                      />
                      {item.customerId && (
                        <Button type="link" size="small" onClick={() => navigate(`/customer-360/${item.customerId}`)}>
                          查看客户
                        </Button>
                      )}
                    </List.Item>
                  )}
                />
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <BulbOutlined style={{ color: '#1890ff' }} />
            <span>AI 推荐待办</span>
          </Space>
        }
      >
        <Empty description="AI 正在分析您的客户数据，即将生成推荐待办..." image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    </div>
  );
}
