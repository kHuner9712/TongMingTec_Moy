import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Cockpit from "../../pages/Cockpit";

vi.mock("../../stores/cockpitStore", () => ({
  useCockpitStore: vi.fn(),
}));

vi.mock("../../stores/approvalStore", () => ({
  useApprovalStore: vi.fn(),
}));

vi.mock("../../stores/authStore", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("../../services/dashboard", () => ({
  dashboardApi: {
    getExecutiveDashboard: vi.fn(),
  },
}));

vi.mock("react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

import { useCockpitStore } from "../../stores/cockpitStore";
import { useApprovalStore } from "../../stores/approvalStore";
import { useAuthStore } from "../../stores/authStore";
import { useQuery } from "react-query";

const mockCockpitStoreHook = vi.mocked(useCockpitStore);
const mockApprovalStoreHook = vi.mocked(useApprovalStore);
const mockAuthStoreHook = vi.mocked(useAuthStore);
const mockUseQuery = vi.mocked(useQuery);

const mockFetchCockpitData = vi.fn();
const mockFetchPending = vi.fn();

describe("Cockpit page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCockpitStoreHook.mockReturnValue({
      aiInsights: [
        {
          id: "insight-1",
          type: "risk_alert",
          title: "高风险客户",
          description: "客户存在流失风险",
          severity: "warning",
        },
      ],
      riskSignals: [
        {
          id: "risk-1",
          type: "risk_alert",
          title: "风险预警",
          description: "风险等级: high",
          severity: "error",
          relatedType: "customer",
          relatedId: "cust-1",
        },
        {
          id: "risk-2",
          type: "followup_reminder",
          title: "跟进提醒",
          description: "风险等级: medium",
          severity: "warning",
          relatedType: "customer",
          relatedId: "cust-2",
        },
        {
          id: "risk-3",
          type: "followup_reminder",
          title: "低风险提醒",
          description: "风险等级: low",
          severity: "info",
          relatedType: "customer",
          relatedId: "cust-3",
        },
      ],
      keyMetrics: {
        totalCustomers: 12,
        activeCustomers: 8,
        pendingFollowups: 3,
      },
      recentAgentRuns: [
        {
          id: "run-1",
          orgId: "org-1",
          agentId: "agent-1",
          customerId: "cust-1",
          requestId: null,
          status: "running",
          inputPayload: {},
          outputPayload: null,
          executionMode: "assist",
          latencyMs: null,
          tokenCost: null,
          errorMessage: null,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      recommendedTodos: [
        {
          id: "todo-1",
          title: "审批请求待处理",
          description: "请尽快审批",
          actionType: "approval",
          relatedId: "approval-1",
          relatedType: "approval",
          priority: 1,
        },
      ],
      fetchCockpitData: mockFetchCockpitData,
      loading: false,
    } as any);

    mockApprovalStoreHook.mockReturnValue({
      fetchPending: mockFetchPending,
      pendingApprovals: [{ id: "approval-1" }],
    } as any);

    mockAuthStoreHook.mockReturnValue({
      hasPermission: (perm: string) => perm === "PERM-DASH-VIEW",
    } as any);

    mockUseQuery.mockReturnValue({
      data: {
        customerMetrics: { total: 12, active: 8, critical: 0, highRisk: 0 },
        opportunityMetrics: { total: 5, won: 2, winRate: 40 },
        dealMetrics: { activeContracts: 3, activeOrders: 2, activeSubscriptions: 1, totalRevenue: 50000 },
        healthMetrics: { total: 10, high: 5, medium: 3, low: 1, critical: 1 },
        subscriptionMetrics: { activeSubscriptions: 1, recurringRevenue: 25000 },
        riskAlerts: { criticalCustomers: 0, highRiskCustomers: 0, lowHealthCount: 2 },
        revenueTrend: [{ month: "2025-01", revenue: 10000 }],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);
  });

  it("renders cockpit core metrics and lists", async () => {
    render(<Cockpit />);

    expect(screen.getByText("经营驾驶舱")).toBeInTheDocument();
    expect(screen.getAllByText(/客户/).length).toBeGreaterThan(0);
    expect(screen.getByText("待审批")).toBeInTheDocument();
    expect(screen.getAllByText("风险预警").length).toBeGreaterThan(0);
    expect(screen.getByText("Agent 执行动态")).toBeInTheDocument();
    expect(screen.getByText("AI 推荐待办")).toBeInTheDocument();
    expect(screen.getByText("审批请求待处理")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockFetchCockpitData).toHaveBeenCalled();
      expect(mockFetchPending).toHaveBeenCalled();
    });
  });

  it("shows loading spinner when cockpit data is loading", () => {
    mockCockpitStoreHook.mockReturnValue({
      aiInsights: [],
      riskSignals: [],
      keyMetrics: {
        totalCustomers: 0,
        activeCustomers: 0,
        pendingFollowups: 0,
      },
      recentAgentRuns: [],
      recommendedTodos: [],
      fetchCockpitData: mockFetchCockpitData,
      loading: true,
    } as any);

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(<Cockpit />);

    expect(document.querySelector(".ant-spin")).toBeTruthy();
    expect(screen.queryByText("经营驾驶舱")).not.toBeInTheDocument();
  });

  it("shows 403 when no PERM-DASH-VIEW permission", () => {
    mockAuthStoreHook.mockReturnValue({
      hasPermission: () => false,
    } as any);

    render(<Cockpit />);

    expect(screen.getByText("无权限")).toBeInTheDocument();
  });

  it("renders executive dashboard data when available", async () => {
    render(<Cockpit />);

    expect(screen.getByText("成交概览")).toBeInTheDocument();
    expect(screen.getByText("客户健康")).toBeInTheDocument();
    expect(screen.getByText("收入趋势")).toBeInTheDocument();
  });

  it("renders risk alert when risk alerts exist", () => {
    mockUseQuery.mockReturnValue({
      data: {
        customerMetrics: { total: 12, active: 8, critical: 2, highRisk: 1 },
        opportunityMetrics: { total: 5, won: 2, winRate: 40 },
        dealMetrics: { activeContracts: 3, activeOrders: 2, activeSubscriptions: 1, totalRevenue: 50000 },
        healthMetrics: { total: 10, high: 5, medium: 3, low: 1, critical: 1 },
        subscriptionMetrics: { activeSubscriptions: 1, recurringRevenue: 25000 },
        riskAlerts: { criticalCustomers: 2, highRiskCustomers: 1, lowHealthCount: 2 },
        revenueTrend: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(<Cockpit />);

    expect(screen.getByText("经营风险预警")).toBeInTheDocument();
    expect(screen.getByText(/危急客户 2/)).toBeInTheDocument();
  });
});
