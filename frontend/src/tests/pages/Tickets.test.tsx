import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import Tickets from '../../pages/Tickets';
import * as ticketApi from '../../services/ticket';

vi.mock('../../services/ticket');
vi.mock('../../components/UserSelect', () => ({
  default: ({ value, onChange, placeholder }: any) => (
    <select data-testid="user-select" value={value || ''} onChange={(e) => onChange?.(e.target.value)}>
      <option value="">{placeholder || '选择用户'}</option>
      <option value="1">张三</option>
    </select>
  ),
}));
vi.mock('../../components/CustomerSelect', () => ({
  default: ({ value, onChange, placeholder }: any) => (
    <select data-testid="customer-select" value={value || ''} onChange={(e) => onChange?.(e.target.value)}>
      <option value="">{placeholder || '选择客户'}</option>
      <option value="1">测试客户</option>
    </select>
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Tickets 页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (ticketApi.ticketApi.list as any).mockResolvedValue({ items: [], meta: { total: 0 } });
  });

  it('渲染新建工单按钮', () => {
    render(<Tickets />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /新建工单/i })).toBeInTheDocument();
  });

  it('显示表格', () => {
    render(<Tickets />, { wrapper: createWrapper() });
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('渲染状态筛选器', () => {
    render(<Tickets />, { wrapper: createWrapper() });
    expect(screen.getByText('状态筛选')).toBeInTheDocument();
  });

  it('渲染优先级筛选器', () => {
    render(<Tickets />, { wrapper: createWrapper() });
    expect(screen.getByText('优先级筛选')).toBeInTheDocument();
  });

  it('表格列头正确渲染', () => {
    render(<Tickets />, { wrapper: createWrapper() });
    expect(screen.getByText('标题')).toBeInTheDocument();
    expect(screen.getByText('客户')).toBeInTheDocument();
    expect(screen.getByText('负责人')).toBeInTheDocument();
    expect(screen.getByText('优先级')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByText('创建时间')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  it('渲染工单列表数据', async () => {
    const mockData = {
      items: [
        {
          id: '1',
          title: '测试工单',
          customerName: '测试客户',
          assigneeUserName: '张三',
          priority: 'high',
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z',
          version: 1,
        },
      ],
      meta: { total: 1 },
    };
    (ticketApi.ticketApi.list as any).mockResolvedValue(mockData);

    render(<Tickets />, { wrapper: createWrapper() });
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
