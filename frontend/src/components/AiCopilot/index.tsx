import { Drawer, Typography, List, Tag, Space } from 'antd';
import { RobotOutlined, BulbOutlined } from '@ant-design/icons';
import { useAiStore } from '../../stores/aiStore';

const { Title, Text } = Typography;

export function CopilotPanel() {
  const { copilotVisible, setCopilotVisible, copilotContext } = useAiStore();

  return (
    <Drawer
      title={
        <Space>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <span>AI Copilot</span>
        </Space>
      }
      placement="right"
      width={400}
      open={copilotVisible}
      onClose={() => setCopilotVisible(false)}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Title level={5}>上下文摘要</Title>
          <Text type="secondary">
            {copilotContext?.customerName
              ? `当前客户: ${copilotContext.customerName}`
              : '请选择客户以获取上下文'}
          </Text>
        </div>

        <div>
          <Title level={5}>
            <BulbOutlined style={{ marginRight: 4 }} />
            AI 建议
          </Title>
          <List
            size="small"
            dataSource={[]}
            renderItem={() => null}
            locale={{ emptyText: '暂无建议' }}
          />
        </div>
      </Space>
    </Drawer>
  );
}

export function SuggestionCard({ suggestion }: { suggestion: { id: string; content: string; confidence: number } }) {
  return (
    <div style={{ padding: '8px 12px', border: '1px solid #f0f0f0', borderRadius: 6, marginBottom: 8 }}>
      <Text>{suggestion.content}</Text>
      <br />
      <Tag color="blue" style={{ marginTop: 4 }}>置信度: {(suggestion.confidence * 100).toFixed(0)}%</Tag>
    </div>
  );
}

export function ContextSummary({ context }: { context: Record<string, unknown> | null }) {
  if (!context) return <Text type="secondary">暂无上下文</Text>;
  return (
    <div>
      {Object.entries(context).map(([key, value]) => (
        <div key={key}>
          <Text type="secondary">{key}: </Text>
          <Text>{String(value)}</Text>
        </div>
      ))}
    </div>
  );
}
