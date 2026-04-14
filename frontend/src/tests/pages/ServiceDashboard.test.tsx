import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ServiceDashboard from "../../pages/dashboard/ServiceDashboard";

vi.mock("../../stores/authStore", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("../../services/dashboard", () => ({
  dashboardApi: {
    getServiceDashboard: vi.fn(),
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

describe("ServiceDashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStoreHook.mockReturnValue({
      hasPermission: (perm: string) => perm === "PERM-DASH-VIEW",
    } as any);

    mockUseQuery.mockReturnValue({
      data: {
        kpi: {
          totalConversations: 100,
          queuedConversations: 5,
          totalTickets: 50,
          openTickets: 10,
          resolvedTickets: 35,
          resolveRate: 70,
        },
        ticketByPriority: [
          { priority: "high", count: 10 },
          { priority: "medium", count: 25 },
        ],
        ticketByStatus: [
          { status: "open", count: 10 },
          { status: "resolved", count: 35 },
        ],
        healthDistribution: {
          total: 20,
          distribution: { high: 10, medium: 6, low: 3, critical: 1 },
          averageScore: 72,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);
  });

  it("renders service dashboard with KPIs", () => {
    render(<ServiceDashboard />);

    expect(screen.getByText("客服看板")).toBeInTheDocument();
    expect(screen.getByText("会话总数")).toBeInTheDocument();
    expect(screen.getByText("排队中")).toBeInTheDocument();
    expect(screen.getByText("工单总数")).toBeInTheDocument();
    expect(screen.getByText("待处理工单")).toBeInTheDocument();
    expect(screen.getByText("已解决工单")).toBeInTheDocument();
    expect(screen.getByText("解决率")).toBeInTheDocument();
  });

  it("renders distribution tables", () => {
    render(<ServiceDashboard />);

    expect(screen.getByText("工单优先级分布")).toBeInTheDocument();
    expect(screen.getByText("工单状态分布")).toBeInTheDocument();
    expect(screen.getByText("客户健康分布")).toBeInTheDocument();
  });

  it("shows 403 when no permission", () => {
    mockAuthStoreHook.mockReturnValue({
      hasPermission: () => false,
    } as any);

    render(<ServiceDashboard />);

    expect(screen.getByText("无权限")).toBeInTheDocument();
  });

  it("shows loading spinner", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(<ServiceDashboard />);

    expect(document.querySelector(".ant-spin")).toBeTruthy();
  });

  it("shows error state", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as any);

    render(<ServiceDashboard />);

    expect(screen.getByText("加载失败")).toBeInTheDocument();
  });
});
