import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ServiceDashboard from '../../pages/dashboard/ServiceDashboard';

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('react-query', () => ({
  useQuery: vi.fn(),
}));

import { useAuthStore } from '../../stores/authStore';
import { useQuery } from 'react-query';

const mockAuthStoreHook = vi.mocked(useAuthStore);
const mockUseQuery = vi.mocked(useQuery);

const mockServiceData = {
  board: 'service',
  orgId: 'org-1',
  range: '30d',
  generatedAt: '2026-01-01T00:00:00.000Z',
  window: {
    current: { startAt: '', endAt: '', label: '最近30天' },
    previous: { startAt: '', endAt: '', label: '前30天' },
  },
  indicators: [
    {
      key: 'first_response_time',
      name: '首响时间',
      unit: 'minutes',
      direction: 'lower_is_better',
      threshold: { warning: 15, critical: 60 },
      currentValue: 10,
      previousValue: 12,
      deltaValue: -2,
      currentLabel: '10 分钟',
      previousLabel: '12 分钟',
      trend: 'down',
      performance: 'improved',
      status: 'healthy',
      sampleSize: 50,
      source: {
        modules: ['CNV'],
        tables: ['conversations'],
        fields: ['created_at', 'first_response_at'],
        formula: 'AVG(first_response_at - created_at)',
        description: '口径说明',
        dataQuality: 'ready',
        governanceNotes: [],
      },
      anomalyActions: [],
    },
  ],
  groups: [
    {
      key: 'first_response',
      name: '首响时间',
      description: '会话首次响应效率',
      metricKeys: ['first_response_time'],
    },
  ],
  anomalies: [],
  dataGovernance: { computable: ['first_response_time'], proxy: [], missing: [] },
  moduleCoverage: [],
};

describe('ServiceDashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStoreHook.mockReturnValue({
      hasPermission: (perm: string) => perm === 'PERM-DASH-VIEW',
    } as never);

    mockUseQuery.mockReturnValue({
      data: mockServiceData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
  });

  it('renders service indicator board', () => {
    render(<ServiceDashboard />);
    expect(screen.getByText('服务看板')).toBeInTheDocument();
    expect(screen.getByText('结果指标（服务）')).toBeInTheDocument();
    expect(screen.getByText('首响时间')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<ServiceDashboard />);
    expect(document.querySelector('.ant-spin')).toBeTruthy();
  });

  it('shows error state', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as never);

    render(<ServiceDashboard />);
    expect(screen.getByText('加载失败')).toBeInTheDocument();
  });

  it('shows 403 when no permission', () => {
    mockAuthStoreHook.mockReturnValue({
      hasPermission: () => false,
    } as never);

    render(<ServiceDashboard />);
    expect(screen.getByText('无权限')).toBeInTheDocument();
  });
});
