import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import Conversations from '../../pages/Conversations';
import * as conversationApi from '../../services/conversation';

vi.mock('../../services/conversation');
vi.mock('../../components/UserSelect', () => ({
  default: ({ value, onChange, placeholder }: any) => (
    <select data-testid="user-select" value={value || ''} onChange={(e) => onChange?.(e.target.value)}>
      <option value="">{placeholder || '选择用户'}</option>
      <option value="1">张三</option>
    </select>
  ),
}));
vi.mock('../../hooks/useWebSocket', () => ({
  useConversationWebSocket: () => ({ isConnected: false }),
}));
vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({ tokens: { accessToken: 'test-token' } }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Conversations 页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (conversationApi.conversationApi.list as any).mockResolvedValue({ items: [], meta: { total: 0 } });
  });

  it('渲染状态筛选器', () => {
    render(<Conversations />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText('状态筛选')).toBeInTheDocument();
  });

  it('显示表格', () => {
    render(<Conversations />, { wrapper: createWrapper() });
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('渲染会话列表数据', async () => {
    const mockData = {
      items: [
        {
          id: '1',
          channelName: '微信',
          customerName: '测试客户',
          assigneeUserName: '张三',
          status: 'active',
          ratingScore: 5,
          createdAt: '2024-01-01T00:00:00Z',
          version: 1,
        },
      ],
      meta: { total: 1 },
    };
    (conversationApi.conversationApi.list as any).mockResolvedValue(mockData);

    render(<Conversations />, { wrapper: createWrapper() });
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('表格列头正确渲染', () => {
    render(<Conversations />, { wrapper: createWrapper() });
    expect(screen.getByText('渠道')).toBeInTheDocument();
    expect(screen.getByText('客户')).toBeInTheDocument();
    expect(screen.getByText('负责人')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByText('评分')).toBeInTheDocument();
    expect(screen.getByText('创建时间')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });
});
