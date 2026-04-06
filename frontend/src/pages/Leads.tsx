import { Table, Button, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function Leads() {
  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '来源', dataIndex: 'source', key: 'source' },
    { title: '手机', dataIndex: 'mobile', key: 'mobile' },
    { title: '负责人', dataIndex: 'ownerUserName', key: 'ownerUserName' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag>{v}</Tag> },
    { title: '操作', key: 'action', render: () => <Space><Button type="link">查看</Button><Button type="link">跟进</Button></Space> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>线索管理</h2>
        <Button type="primary" icon={<PlusOutlined />}>新建线索</Button>
      </div>
      <Table columns={columns} dataSource={[]} rowKey="id" />
    </div>
  );
}
