import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import SalesDashboard from "../../pages/dashboard/SalesDashboard";

vi.mock("../../stores/authStore", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("../../services/dashboard", () => ({
  dashboardApi: {
    getSalesDashboard: vi.fn(),
  },
}));

vi.mock("react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

import { useAuthStore } from "../../stores/authStore";
import { useQuery } from "react-query";

const mockAuthStoreHook = vi.mocked(useAuthStore);
const mockUseQuery = vi.mocked(useQuery);

describe("SalesDashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStoreHook.mockReturnValue({
      hasPermission: (perm: string) => perm === "PERM-DASH-VIEW",
    } as any);

    mockUseQuery.mockReturnValue({
      data: {
        kpi: {
          totalOpportunities: 20,
          wonOpportunities: 8,
          winRate: 40,
          totalLeads: 50,
          convertedLeads: 15,
          leadConvertRate: 30,
          totalRevenue: 150000,
        },
        pipeline: {
          total: 20,
          byStage: { qualification: 5, negotiation: 8, proposal: 4 },
          byResult: { won: 8, lost: 3 },
          recent: [],
        },
        revenueTrend: [
          { month: "2025-01", revenue: 25000 },
          { month: "2025-02", revenue: 30000 },
        ],
        topOpportunities: [
          { id: "opp-1", name: "大客户A", amount: 50000, stage: "negotiation", result: null },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);
  });

  it("renders sales dashboard with KPIs", () => {
    render(<SalesDashboard />);

    expect(screen.getByText("销售看板")).toBeInTheDocument();
    expect(screen.getByText("商机总数")).toBeInTheDocument();
    expect(screen.getByText("赢单数 / 赢单率")).toBeInTheDocument();
    expect(screen.getByText("线索转化率")).toBeInTheDocument();
    expect(screen.getByText("总收入")).toBeInTheDocument();
  });

  it("renders pipeline and revenue trend", () => {
    render(<SalesDashboard />);

    expect(screen.getByText("销售漏斗")).toBeInTheDocument();
    expect(screen.getByText("收入趋势")).toBeInTheDocument();
  });

  it("renders top opportunities", () => {
    render(<SalesDashboard />);

    expect(screen.getByText("Top 商机")).toBeInTheDocument();
  });

  it("shows 403 when no permission", () => {
    mockAuthStoreHook.mockReturnValue({
      hasPermission: () => false,
    } as any);

    render(<SalesDashboard />);

    expect(screen.getByText("无权限")).toBeInTheDocument();
  });

  it("shows loading spinner", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(<SalesDashboard />);

    expect(document.querySelector(".ant-spin")).toBeTruthy();
  });

  it("shows error state", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as any);

    render(<SalesDashboard />);

    expect(screen.getByText("加载失败")).toBeInTheDocument();
  });
});
