import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SalesDashboard from '../../pages/dashboard/SalesDashboard';

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

const mockSalesData = {
  board: 'sales',
  orgId: 'org-1',
  range: '30d',
  generatedAt: '2026-01-01T00:00:00.000Z',
  window: {
    current: { startAt: '', endAt: '', label: '最近30天' },
    previous: { startAt: '', endAt: '', label: '前30天' },
  },
  indicators: [
    {
      key: 'lead_missed_followup_rate',
      name: '线索漏跟进率',
      unit: 'percent',
      direction: 'lower_is_better',
      threshold: { warning: 20, critical: 35 },
      currentValue: 18,
      previousValue: 25,
      deltaValue: -7,
      currentLabel: '18%',
      previousLabel: '25%',
      trend: 'down',
      performance: 'improved',
      status: 'healthy',
      sampleSize: 20,
      source: {
        modules: ['LM'],
        tables: ['leads'],
        fields: ['status'],
        formula: '漏跟进开放线索 / 开放线索',
        description: '口径说明',
        dataQuality: 'ready',
        governanceNotes: [],
      },
      anomalyActions: [],
    },
  ],
  groups: [
    {
      key: 'lead_leak',
      name: '线索漏跟进率',
      description: '开放线索漏跟进比例',
      metricKeys: ['lead_missed_followup_rate'],
    },
  ],
  anomalies: [],
  dataGovernance: { computable: ['lead_missed_followup_rate'], proxy: [], missing: [] },
  moduleCoverage: [],
};

describe('SalesDashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStoreHook.mockReturnValue({
      hasPermission: (perm: string) => perm === 'PERM-DASH-VIEW',
    } as never);

    mockUseQuery.mockReturnValue({
      data: mockSalesData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
  });

  it('renders sales indicator board', () => {
    render(<SalesDashboard />);

    expect(screen.getByText('销售看板')).toBeInTheDocument();
    expect(screen.getByText('结果指标（销售）')).toBeInTheDocument();
    expect(screen.getByText('线索漏跟进率')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<SalesDashboard />);
    expect(document.querySelector('.ant-spin')).toBeTruthy();
  });

  it('shows error state', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as never);

    render(<SalesDashboard />);
    expect(screen.getByText('加载失败')).toBeInTheDocument();
  });

  it('shows 403 when no permission', () => {
    mockAuthStoreHook.mockReturnValue({
      hasPermission: () => false,
    } as never);

    render(<SalesDashboard />);
    expect(screen.getByText('无权限')).toBeInTheDocument();
  });
});
