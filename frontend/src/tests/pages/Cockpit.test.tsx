import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import Cockpit from '../../pages/Cockpit';

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

import { useAuthStore } from '../../stores/authStore';
import { useQuery } from 'react-query';

const mockAuthStoreHook = vi.mocked(useAuthStore);
const mockUseQuery = vi.mocked(useQuery);

const mockDashboardData = {
  board: 'executive',
  orgId: 'org-1',
  range: '30d',
  generatedAt: '2026-01-01T00:00:00.000Z',
  window: {
    current: { startAt: '2025-12-01T00:00:00.000Z', endAt: '2026-01-01T00:00:00.000Z', label: '最近30天' },
    previous: { startAt: '2025-11-01T00:00:00.000Z', endAt: '2025-12-01T00:00:00.000Z', label: '前30天' },
  },
  indicators: [
    {
      key: 'first_response_time',
      name: '首响时间',
      unit: 'minutes',
      direction: 'lower_is_better',
      threshold: { warning: 15, critical: 60 },
      currentValue: 12,
      previousValue: 14,
      deltaValue: -2,
      currentLabel: '12 分钟',
      previousLabel: '14 分钟',
      trend: 'down',
      performance: 'improved',
      status: 'healthy',
      sampleSize: 10,
      source: {
        modules: ['CNV'],
        tables: ['conversations'],
        fields: ['created_at', 'first_response_at'],
        formula: 'AVG(first_response_at - created_at)',
        description: '首响时间口径',
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
  dataGovernance: {
    computable: ['first_response_time'],
    proxy: [],
    missing: [],
  },
  moduleCoverage: [],
};

describe('Cockpit page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStoreHook.mockReturnValue({
      hasPermission: (perm: string) => perm === 'PERM-DASH-VIEW',
    } as never);

    mockUseQuery.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
  });

  it('renders executive overview with indicator cards', () => {
    render(<Cockpit />);

    expect(screen.getByText('经营驾驶舱')).toBeInTheDocument();
    expect(screen.getByText('经营总览（6个结果指标）')).toBeInTheDocument();
    const firstResponseIndicator = screen.getByTestId(
      'cockpit-indicator-first_response_time',
    );
    expect(within(firstResponseIndicator).getByText('首响时间')).toBeInTheDocument();
    expect(
      screen.getByTestId('cockpit-indicator-source-first_response_time'),
    ).toBeInTheDocument();
  });

  it('shows loading spinner', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<Cockpit />);
    expect(document.querySelector('.ant-spin')).toBeTruthy();
  });

  it('shows error state', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as never);

    render(<Cockpit />);
    expect(screen.getByText('加载失败')).toBeInTheDocument();
  });

  it('shows 403 when no permission', () => {
    mockAuthStoreHook.mockReturnValue({
      hasPermission: () => false,
    } as never);

    render(<Cockpit />);
    expect(screen.getByText('无权限')).toBeInTheDocument();
  });
});
