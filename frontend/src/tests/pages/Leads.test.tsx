import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import Leads from '../../pages/Leads';
import * as leadApi from '../../services/lead';

vi.mock('../../services/lead');
vi.mock('../../components/UserSelect', () => ({
  default: ({ value, onChange, placeholder }: any) => (
    <select data-testid="user-select" value={value || ''} onChange={(e) => onChange?.(e.target.value)}>
      <option value="">{placeholder || '选择用户'}</option>
      <option value="1">张三</option>
    </select>
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Leads 页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (leadApi.leadApi.list as any).mockResolvedValue({ items: [], meta: { total: 0 } });
  });

  it('渲染页面标题', () => {
    render(<Leads />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /新建线索/i })).toBeInTheDocument();
  });

  it('显示表格', () => {
    render(<Leads />, { wrapper: createWrapper() });
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
