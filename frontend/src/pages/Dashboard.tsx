import { Row, Col, Card, Statistic, List, Typography, Skeleton } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  PhoneOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import { customerApi } from '../services/customer';
import { leadApi } from '../services/lead';
import { opportunityApi } from '../services/opportunity';
import { conversationApi } from '../services/conversation';
import { ticketApi } from '../services/ticket';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

export default function Dashboard() {
  const { data: customersData, isLoading: customersLoading } = useQuery(
    ['dashboard-customers'],
    () => customerApi.list({ page: 1, page_size: 1 }),
  );

  const { data: leadsData, isLoading: leadsLoading } = useQuery(
    ['dashboard-leads'],
    () => leadApi.list({ page: 1, page_size: 1 }),
  );

  const { data: opportunitiesData, isLoading: opportunitiesLoading } = useQuery(
    ['dashboard-opportunities'],
    () => opportunityApi.list({ page: 1, page_size: 1 }),
  );

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery(
    ['dashboard-conversations'],
    () => conversationApi.list({ page: 1, page_size: 1, status: 'queued' }),
  );

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery(
    ['dashboard-tickets'],
    () => ticketApi.list({ page: 1, page_size: 1, status: 'pending' }),
  );

  const quickLinks = [
    { title: '客户管理', icon: <TeamOutlined />, href: '/customers', color: '#1890ff' },
    { title: '线索管理', icon: <UserOutlined />, href: '/leads', color: '#52c41a' },
    { title: '商机管理', icon: <PhoneOutlined />, href: '/opportunities', color: '#faad14' },
    { title: '会话中心', icon: <MessageOutlined />, href: '/conversations', color: '#722ed1' },
    { title: '工单管理', icon: <FileTextOutlined />, href: '/tickets', color: '#eb2f96' },
    { title: '系统设置', icon: <CustomerServiceOutlined />, href: '/settings', color: '#13c2c2' },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        工作台
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Skeleton loading={customersLoading} active>
              <Statistic
                title="客户总数"
                value={customersData?.meta?.total || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Skeleton loading={leadsLoading} active>
              <Statistic
                title="线索总数"
                value={leadsData?.meta?.total || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Skeleton loading={opportunitiesLoading} active>
              <Statistic
                title="进行中商机"
                value={opportunitiesData?.meta?.total || 0}
                prefix={<PhoneOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Skeleton loading={conversationsLoading} active>
              <Statistic
                title="待处理会话"
                value={conversationsData?.meta?.total || 0}
                prefix={<MessageOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Skeleton>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="快捷入口" bordered={false}>
            <List
              grid={{ gutter: 16, column: 3 }}
              dataSource={quickLinks}
              renderItem={(item) => (
                <List.Item>
                  <Link to={item.href}>
                    <Card
                      hoverable
                      style={{ textAlign: 'center' }}
                      bodyStyle={{ padding: '20px 12px' }}
                    >
                      <div style={{ fontSize: 28, color: item.color, marginBottom: 8 }}>
                        {item.icon}
                      </div>
                      <Text>{item.title}</Text>
                    </Card>
                  </Link>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="待办事项" bordered={false}>
            <Skeleton loading={ticketsLoading} active>
              <List
                dataSource={[
                  {
                    title: `待处理工单`,
                    count: ticketsData?.meta?.total || 0,
                    href: '/tickets',
                  },
                  {
                    title: `待接入会话`,
                    count: conversationsData?.meta?.total || 0,
                    href: '/conversations',
                  },
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Link to={item.href}>
                          <Text>{item.title}</Text>
                        </Link>
                      }
                    />
                    <Text strong style={{ fontSize: 18 }}>
                      {item.count}
                    </Text>
                  </List.Item>
                )}
              />
            </Skeleton>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
