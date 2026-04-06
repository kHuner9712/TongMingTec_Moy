import { Table, Button, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function Tickets() {
  const columns = [
    { title: '工单标题', dataIndex: 'title', key: 'title' },
    { title: '优先级', dataIndex: 'priority', key: 'priority', render: (v: string) => <Tag color={v === 'urgent' ? 'red' : v === 'high' ? 'orange' : 'default'}>{v}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag>{v}</Tag> },
    { title: '负责人', dataIndex: 'assigneeUserName', key: 'assigneeUserName' },
    { title: '操作', key: 'action', render: () => <Space><Button type="link">查看</Button><Button type="link">处理</Button></Space> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>工单管理</h2>
        <Button type="primary" icon={<PlusOutlined />}>新建工单</Button>
      </div>
      <Table columns={columns} dataSource={[]} rowKey="id" />
    </div>
  );
}
