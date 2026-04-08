import { useEffect, useState } from 'react';
import { Table, Tag, Card, Typography, Alert, Space, Select, Button } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { conversationApi } from '../../services/conversation';
import { Conversation } from '../../types';

const { Title, Text } = Typography;

export default function ConversationWorkbench() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  useEffect(() => { fetchConversations(); }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const result = await conversationApi.list();
      setConversations((result as any)?.items || result || []);
    } finally {
      setLoading(false);
    }
  };

  const filtered = statusFilter ? conversations.filter((c) => c.status === statusFilter) : conversations;
  const waitingCount = conversations.filter((c) => c.status === 'waiting' || c.status === 'queued').length;

  const columns = [
    {
      title: '会话主题', dataIndex: 'subject', key: 'subject',
      render: (subject: string, record: Conversation) => (
        <div>
          <div><Text strong>{subject || '(无主题)'}</Text></div>
          {record.customerName && <Text type="secondary" style={{ fontSize: 12 }}>{record.customerName}</Text>}
        </div>
      ),
    },
    {
      title: '渠道', dataIndex: 'channelType', key: 'channelType',
      render: (v: string) => <Tag>{v || '-'}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = { active: 'green', waiting: 'orange', queued: 'gold', paused: 'default', closed: 'default' };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: '负责人', dataIndex: 'assigneeUserName', key: 'assigneeUserName',
      render: (v: string | null) => v || '-',
    },
    {
      title: 'AI 建议', key: 'aiSuggestion',
      render: () => <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
  ];

  return (
    <div>
      <Title level={3}>会话与跟进工作台</Title>

      {waitingCount > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<MessageOutlined />}
          message="AI 助手提醒"
          description={`${waitingCount} 个会话等待回复，建议优先处理`}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: '排队中', value: 'queued' },
                { label: '等待中', value: 'waiting' },
                { label: '活跃', value: 'active' },
                { label: '已暂停', value: 'paused' },
                { label: '已关闭', value: 'closed' },
              ]}
            />
          </Space>
          <Button onClick={fetchConversations}>刷新</Button>
        </Space>

        <Table dataSource={filtered} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
      </Card>
    </div>
  );
}
