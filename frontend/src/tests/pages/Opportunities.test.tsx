import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import Opportunities from '../../pages/Opportunities';
import * as opportunityService from '../../services/opportunity';

vi.mock('../../services/opportunity', () => ({
  opportunityApi: {
    list: vi.fn(),
    get: vi.fn(),
    getSummary: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    changeStage: vi.fn(),
    markResult: vi.fn(),
  },
}));

vi.mock('../../components/CustomerSelect', () => ({
  default: ({ value, onChange, placeholder }: any) => (
    <select data-testid="customer-select" value={value || ''} onChange={(e) => onChange?.(e.target.value)}>
      <option value="">{placeholder || '选择客户'}</option>
      <option value="1">测试公司A</option>
    </select>
  ),
}));
vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({ socket: null, isConnected: true })),
}));
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      user: { id: '1', username: 'admin', permissions: [] },
      tokens: { accessToken: 'test-token', refreshToken: 'test-refresh', expiresIn: 3600, tokenType: 'Bearer' },
      isAuthenticated: true,
      token: 'test-token',
    };
    return selector ? selector(state) : state;
  }),
}));

const mockSummary = {
  total: 10,
  totalAmount: 1000000,
  byStage: {
    discovery: 3,
    qualification: 2,
    proposal: 3,
    negotiation: 2,
  },
  byResult: { won: 5, lost: 2 },
};

const mockOpportunities = [
  {
    id: '1',
    name: '测试商机1',
    customerName: '测试客户A',
    ownerUserName: '张三',
    amount: 100000,
    currency: 'CNY',
    stage: 'discovery',
    result: null,
    expectedCloseDate: '2024-12-31',
    version: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: '测试商机2',
    customerName: '测试客户B',
    ownerUserName: '李四',
    amount: 200000,
    currency: 'CNY',
    stage: 'negotiation',
    result: null,
    expectedCloseDate: '2024-11-30',
    version: 1,
    createdAt: '2024-01-02T00:00:00Z',
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Opportunities 页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (opportunityService.opportunityApi.list as any).mockResolvedValue({ 
      items: mockOpportunities, 
      meta: { total: 2, page: 1, page_size: 20 } 
    });
    (opportunityService.opportunityApi.getSummary as any).mockResolvedValue(mockSummary);
  });

  it('渲染页面标题和新建按钮', () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /新建商机/i })).toBeInTheDocument();
  });

  it('显示商机列表表格', () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('显示汇总卡统计数据', async () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('商机总数')).toBeInTheDocument();
      expect(screen.getByText('总金额')).toBeInTheDocument();
      expect(screen.getByText('赢单数')).toBeInTheDocument();
    });
  });

  it('显示阶段分布统计', async () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('阶段分布')).toBeInTheDocument();
    });
  });

  it('打开新建商机对话框', async () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /新建商机/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/商机名称/i)).toBeInTheDocument();
    });
  });

  it('阶段筛选功能', async () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    const stageFilter = screen.getAllByRole('combobox')[0];
    fireEvent.mouseDown(stageFilter);
    await waitFor(() => {
      expect(screen.getByText('发现')).toBeInTheDocument();
    });
  });

  it('结果筛选功能', async () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    const resultFilter = screen.getAllByRole('combobox')[1];
    fireEvent.mouseDown(resultFilter);
    await waitFor(() => {
      expect(screen.getByText('赢单')).toBeInTheDocument();
    });
  });
});

describe('版本冲突处理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (opportunityService.opportunityApi.list as any).mockResolvedValue({ 
      items: mockOpportunities, 
      meta: { total: 2 } 
    });
    (opportunityService.opportunityApi.getSummary as any).mockResolvedValue(mockSummary);
    (opportunityService.opportunityApi.get as any).mockResolvedValue({
      ...mockOpportunities[0],
      stageHistory: [],
    });
  });

  it('阶段推进时版本冲突显示友好提示', async () => {
    const conflictError = { 
      code: 'CONFLICT_VERSION', 
      message: 'CONFLICT_VERSION' 
    };
    (opportunityService.opportunityApi.changeStage as any).mockRejectedValue(conflictError);

    render(<Opportunities />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('测试商机1')).toBeInTheDocument();
    });

    const pushButtons = screen.getAllByRole('button', { name: /推进/i });
    fireEvent.click(pushButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /^确定$/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/已被他人修改/)).toBeInTheDocument();
    });
  });

  it('版本冲突时显示刷新按钮', async () => {
    const conflictError = { 
      code: 'CONFLICT_VERSION', 
      message: 'CONFLICT_VERSION' 
    };
    (opportunityService.opportunityApi.changeStage as any).mockRejectedValue(conflictError);

    render(<Opportunities />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('测试商机1')).toBeInTheDocument();
    });

    const pushButtons = screen.getAllByRole('button', { name: /推进/i });
    fireEvent.click(pushButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /^确定$/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /刷新/i })).toBeInTheDocument();
    });
  });
});

describe('状态机约束验证', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (opportunityService.opportunityApi.list as any).mockResolvedValue({ 
      items: mockOpportunities, 
      meta: { total: 2 } 
    });
    (opportunityService.opportunityApi.getSummary as any).mockResolvedValue(mockSummary);
  });

  it('只有 negotiation 阶段显示结果按钮', async () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('测试商机2')).toBeInTheDocument();
    });

    const allButtons = screen.getAllByRole('button');
    const resultButtons = allButtons.filter(btn => btn.textContent?.includes('结果'));
    expect(resultButtons.length).toBe(1);
  });

  it('已标记结果的商机不显示推进和结果按钮', async () => {
    const opportunitiesWithResult = [
      { ...mockOpportunities[0], result: 'won' },
      { ...mockOpportunities[1], result: 'lost' },
    ];
    (opportunityService.opportunityApi.list as any).mockResolvedValue({ 
      items: opportunitiesWithResult, 
      meta: { total: 2 } 
    });

    render(<Opportunities />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('测试商机1')).toBeInTheDocument();
    });

    const allButtons = screen.getAllByRole('button');
    const pushButtons = allButtons.filter(btn => btn.textContent?.includes('推进'));
    expect(pushButtons.length).toBe(0);
  });
});

describe('汇总 API 调用', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (opportunityService.opportunityApi.list as any).mockResolvedValue({ 
      items: [], 
      meta: { total: 0 } 
    });
    (opportunityService.opportunityApi.getSummary as any).mockResolvedValue(mockSummary);
  });

  it('页面加载时调用汇总 API', async () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(opportunityService.opportunityApi.getSummary).toHaveBeenCalled();
    });
  });
});
