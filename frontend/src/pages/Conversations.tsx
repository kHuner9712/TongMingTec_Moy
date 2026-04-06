import { Table, Button, Space, Tag } from 'antd';

export default function Conversations() {
  const columns = [
    { title: '会话ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: '渠道', dataIndex: 'channelType', key: 'channelType' },
    { title: '客户', dataIndex: 'customerName', key: 'customerName' },
    { title: '负责人', dataIndex: 'assigneeUserName', key: 'assigneeUserName' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag> },
    { title: '操作', key: 'action', render: () => <Space><Button type="link">接入</Button></Space> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>会话中心</h2>
      </div>
      <Table columns={columns} dataSource={[]} rowKey="id" />
    </div>
  );
}
