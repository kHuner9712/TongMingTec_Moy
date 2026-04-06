import { Table, Button, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function Customers() {
  const columns = [
    { title: '客户名称', dataIndex: 'name', key: 'name' },
    { title: '行业', dataIndex: 'industry', key: 'industry' },
    { title: '等级', dataIndex: 'level', key: 'level' },
    { title: '负责人', dataIndex: 'ownerUserName', key: 'ownerUserName' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag>{v}</Tag> },
    { title: '操作', key: 'action', render: () => <Space><Button type="link">查看</Button><Button type="link">编辑</Button></Space> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>客户管理</h2>
        <Button type="primary" icon={<PlusOutlined />}>新建客户</Button>
      </div>
      <Table columns={columns} dataSource={[]} rowKey="id" />
    </div>
  );
}
