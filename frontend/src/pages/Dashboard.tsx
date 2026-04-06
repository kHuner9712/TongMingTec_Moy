import { Row, Col, Card, Statistic } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  PhoneOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';

export default function Dashboard() {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>工作台</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="客户总数"
              value={0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待跟进线索"
              value={0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="进行中商机"
              value={0}
              prefix={<PhoneOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理会话"
              value={0}
              prefix={<CustomerServiceOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
