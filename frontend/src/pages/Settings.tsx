import { Card, Tabs } from 'antd';

export default function Settings() {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>系统设置</h2>
      <Card>
        <Tabs
          items={[
            { key: 'org', label: '组织设置', children: <div>组织设置内容</div> },
            { key: 'roles', label: '角色权限', children: <div>角色权限内容</div> },
            { key: 'channels', label: '渠道配置', children: <div>渠道配置内容</div> },
            { key: 'ai', label: 'AI配置', children: <div>AI配置内容</div> },
          ]}
        />
      </Card>
    </div>
  );
}
