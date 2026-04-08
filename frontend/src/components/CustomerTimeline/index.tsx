import { Timeline, Select, Tag, Empty } from 'antd';
import { CustomerTimelineEvent } from '../../types';
import { RobotOutlined, UserOutlined, CustomerServiceOutlined } from '@ant-design/icons';

const actorTypeColorMap: Record<string, string> = {
  customer: 'green',
  user: 'blue',
  ai: 'purple',
  system: 'gray',
};

const actorTypeIconMap: Record<string, React.ReactNode> = {
  customer: <CustomerServiceOutlined />,
  user: <UserOutlined />,
  ai: <RobotOutlined />,
  system: null,
};

interface TimelineViewProps {
  events: CustomerTimelineEvent[];
}

export function TimelineView({ events }: TimelineViewProps) {
  if (!events || events.length === 0) {
    return <Empty description="暂无时间线事件" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <Timeline
      items={events.map((event) => ({
        color: actorTypeColorMap[event.actorType] || 'gray',
        children: (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag color={actorTypeColorMap[event.actorType]}>
                {actorTypeIconMap[event.actorType]} {event.actorType}
              </Tag>
              <Tag>{event.eventType}</Tag>
              <span style={{ color: '#999', fontSize: 12 }}>
                {new Date(event.occurredAt).toLocaleString()}
              </span>
            </div>
            <div style={{ marginTop: 4 }}>
              <span>{event.eventSource}</span>
            </div>
          </div>
        ),
      }))}
    />
  );
}

export function TimelineEvent({ event }: { event: CustomerTimelineEvent }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Tag color={actorTypeColorMap[event.actorType]}>{event.actorType}</Tag>
        <Tag>{event.eventType}</Tag>
      </div>
      <div style={{ marginTop: 4, color: '#666' }}>{event.eventSource}</div>
      <div style={{ marginTop: 2, color: '#999', fontSize: 12 }}>
        {new Date(event.occurredAt).toLocaleString()}
      </div>
    </div>
  );
}

interface TimelineFilterProps {
  value?: { eventType?: string; actorType?: string };
  onChange?: (value: { eventType?: string; actorType?: string }) => void;
}

export function TimelineFilter({ value, onChange }: TimelineFilterProps) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Select
        placeholder="事件类型"
        allowClear
        style={{ width: 150 }}
        value={value?.eventType}
        onChange={(v) => onChange?.({ ...value, eventType: v })}
        options={[
          { label: '状态变更', value: 'customer.status_changed' },
          { label: '会话消息', value: 'conversation.message_created' },
          { label: 'AI 建议', value: 'ai.agent_run_completed' },
        ]}
      />
      <Select
        placeholder="操作者"
        allowClear
        style={{ width: 120 }}
        value={value?.actorType}
        onChange={(v) => onChange?.({ ...value, actorType: v })}
        options={[
          { label: '客户', value: 'customer' },
          { label: '用户', value: 'user' },
          { label: 'AI', value: 'ai' },
          { label: '系统', value: 'system' },
        ]}
      />
    </div>
  );
}
