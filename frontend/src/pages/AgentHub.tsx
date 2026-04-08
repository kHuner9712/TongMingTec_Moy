import { Card, Typography, Table, Tag, Badge } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { useAiStore } from '../stores/aiStore';

const { Title } = Typography;

export default function AgentHub() {
  const { agentList } = useAiStore();

  const columns = [
    {
      title: 'Agent Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <span style={{ fontFamily: 'monospace' }}>{code}</span>,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'agentType',
      key: 'agentType',
    },
    {
      title: '执行模式',
      dataIndex: 'executionMode',
      key: 'executionMode',
      render: (mode: string) => {
        const colorMap: Record<string, string> = {
          suggest: 'blue',
          assist: 'cyan',
          auto: 'green',
          approval: 'orange',
        };
        return <Tag color={colorMap[mode] || 'default'}>{mode}</Tag>;
      },
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      render: (level: string) => {
        const colorMap: Record<string, string> = { low: 'green', medium: 'orange', high: 'red' };
        return <Tag color={colorMap[level] || 'default'}>{level}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = { draft: 'default', active: 'green', paused: 'orange', archived: 'red' };
        return <Badge status={status === 'active' ? 'processing' : 'default'} text={<Tag color={colorMap[status]}>{status}</Tag>} />;
      },
    },
  ];

  return (
    <div>
      <Title level={3}>
        <RobotOutlined style={{ marginRight: 8 }} />
        Agent 管理中心
      </Title>

      <Card>
        <Table
          dataSource={agentList}
          columns={columns}
          rowKey="id"
          loading={false}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}
