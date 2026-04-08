import { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Input, Card, Typography, Alert, Row, Col, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EyeOutlined, BulbOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { customerApi } from '../../services/customer';
import { Customer } from '../../types';

const { Title, Text } = Typography;
const { Search } = Input;

const riskColorMap: Record<string, string> = { low: 'green', medium: 'orange', high: 'red', critical: '#cf1322' };

export default function CustomerWorkbench() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [riskFilter, setRiskFilter] = useState<string | undefined>();

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async (search?: string) => {
    setLoading(true);
    try {
      const result = await customerApi.list(search ? { keyword: search } : undefined);
      setCustomers((result as any)?.items || result || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = riskFilter
    ? customers.filter((c) => (c as any).riskLevel === riskFilter)
    : customers;

  const columns = [
    { title: '客户名称', dataIndex: 'name', key: 'name', render: (name: string, record: Customer) => (
      <a onClick={() => navigate(`/customer-360/${record.id}`)}>{name}</a>
    )},
    { title: '行业', dataIndex: 'industry', key: 'industry' },
    { title: '等级', dataIndex: 'level', key: 'level' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string) => <Tag color={status === 'active' ? 'green' : status === 'silent' ? 'orange' : 'default'}>{status}</Tag>,
    },
    {
      title: '风险', dataIndex: 'riskLevel', key: 'riskLevel',
      render: (risk: string | null) => risk ? <Tag color={riskColorMap[risk] || 'default'}>{risk}</Tag> : '-',
    },
    {
      title: '最后互动', dataIndex: 'lastContactAt', key: 'lastContactAt',
      render: (v: string | null) => v ? new Date(v).toLocaleDateString() : '-',
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: Customer) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/customer-360/${record.id}`)}>360 视图</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>客户经营工作台</Title>

      <Alert
        type="info"
        showIcon
        icon={<BulbOutlined />}
        message="AI 经营建议"
        description="AI 正在分析客户数据，将为您推荐优先跟进的客户和下一步动作"
        style={{ marginBottom: 16 }}
      />

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Search placeholder="搜索客户" onSearch={fetchCustomers} style={{ width: 280 }} allowClear />
            <Select
              placeholder="风险等级"
              allowClear
              style={{ width: 120 }}
              value={riskFilter}
              onChange={setRiskFilter}
              options={[
                { label: '低风险', value: 'low' },
                { label: '中风险', value: 'medium' },
                { label: '高风险', value: 'high' },
                { label: '严重', value: 'critical' },
              ]}
            />
          </Space>
          <Space>
            <Button
              type={viewMode === 'card' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('card')}
            />
            <Button
              type={viewMode === 'table' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('table')}
            />
          </Space>
        </Space>

        {viewMode === 'table' ? (
          <Table dataSource={filteredCustomers} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredCustomers.map((customer) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={customer.id}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => navigate(`/customer-360/${customer.id}`)}
                  style={{ height: '100%' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text strong>{customer.name}</Text>
                    <Tag color={customer.status === 'active' ? 'green' : customer.status === 'silent' ? 'orange' : 'default'}>
                      {customer.status}
                    </Tag>
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary">行业: {customer.industry || '-'}</Text>
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary">等级: {customer.level || '-'}</Text>
                  </div>
                  {(customer as any).riskLevel && (
                    <div style={{ marginBottom: 4 }}>
                      <Tag color={riskColorMap[(customer as any).riskLevel] || 'default'}>
                        风险: {(customer as any).riskLevel}
                      </Tag>
                    </div>
                  )}
                  <Button type="link" size="small" style={{ padding: 0 }} onClick={(e) => { e.stopPropagation(); navigate(`/customer-360/${customer.id}`); }}>
                    查看 360 视图 →
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
}
