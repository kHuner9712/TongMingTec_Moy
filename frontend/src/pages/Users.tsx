import { Table, Button, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { usePermission } from '../hooks/usePermission';

export default function Users() {
  const { can } = usePermission();

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'displayName', key: 'displayName' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag> },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link">查看</Button>
          {can('PERM-USR-MANAGE') && <Button type="link">编辑</Button>}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>用户管理</h2>
        {can('PERM-USR-MANAGE') && (
          <Button type="primary" icon={<PlusOutlined />}>新建用户</Button>
        )}
      </div>
      <Table columns={columns} dataSource={[]} rowKey="id" />
    </div>
  );
}
