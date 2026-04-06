import { Table, Button, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function Opportunities() {
  const columns = [
    { title: '商机名称', dataIndex: 'name', key: 'name' },
    { title: '客户', dataIndex: 'customerName', key: 'customerName' },
    { title: '金额', dataIndex: 'amount', key: 'amount' },
    { title: '阶段', dataIndex: 'stage', key: 'stage', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '负责人', dataIndex: 'ownerUserName', key: 'ownerUserName' },
    { title: '操作', key: 'action', render: () => <Space><Button type="link">查看</Button><Button type="link">编辑</Button></Space> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>商机管理</h2>
        <Button type="primary" icon={<PlusOutlined />}>新建商机</Button>
      </div>
      <Table columns={columns} dataSource={[]} rowKey="id" />
    </div>
  );
}
