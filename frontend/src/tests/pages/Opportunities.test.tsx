import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import Opportunities from '../../pages/Opportunities';
import * as opportunityApi from '../../services/opportunity';

vi.mock('../../services/opportunity');
vi.mock('../../components/CustomerSelect', () => ({
  default: ({ value, onChange, placeholder }: any) => (
    <select data-testid="customer-select" value={value || ''} onChange={(e) => onChange?.(e.target.value)}>
      <option value="">{placeholder || '选择客户'}</option>
      <option value="1">测试公司A</option>
    </select>
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Opportunities 页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (opportunityApi.opportunityApi.list as any).mockResolvedValue({ items: [], meta: { total: 0 } });
  });

  it('渲染页面标题', () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /新建商机/i })).toBeInTheDocument();
  });

  it('显示表格', () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
