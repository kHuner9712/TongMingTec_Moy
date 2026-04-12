import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Cockpit from "../../pages/Cockpit";

vi.mock("../../stores/cockpitStore", () => ({
  useCockpitStore: vi.fn(),
}));

vi.mock("../../stores/approvalStore", () => ({
  useApprovalStore: vi.fn(),
}));

import { useCockpitStore } from "../../stores/cockpitStore";
import { useApprovalStore } from "../../stores/approvalStore";

const mockCockpitStoreHook = vi.mocked(useCockpitStore);
const mockApprovalStoreHook = vi.mocked(useApprovalStore);

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
        {
          id: "run-2",
          orgId: "org-1",
          agentId: "agent-2",
          customerId: "cust-2",
          requestId: null,
          status: "awaiting_approval",
          inputPayload: {},
          outputPayload: null,
          executionMode: "approval",
          latencyMs: null,
          tokenCost: null,
          errorMessage: null,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "run-3",
          orgId: "org-1",
          agentId: "agent-3",
          customerId: null,
          requestId: null,
          status: "succeeded",
          inputPayload: {},
          outputPayload: {},
          executionMode: "suggest",
          latencyMs: 180,
          tokenCost: 20,
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
  });

  it("renders cockpit core metrics and lists", async () => {
    render(<Cockpit />);

    expect(screen.getByText("经营驾驶舱")).toBeInTheDocument();
    expect(screen.getByText("客户总数")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("待审批")).toBeInTheDocument();
    expect(screen.getAllByText("风险预警").length).toBeGreaterThan(0);
    expect(screen.getByText("Agent 执行动态")).toBeInTheDocument();
    expect(screen.getByText("AI 推荐待办")).toBeInTheDocument();
    expect(screen.getByText("审批请求待处理")).toBeInTheDocument();
    expect(screen.getByText(/高风险 1/)).toBeInTheDocument();
    expect(screen.getByText(/中风险 1/)).toBeInTheDocument();
    expect(screen.getByText(/低风险 1/)).toBeInTheDocument();

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

    render(<Cockpit />);

    expect(document.querySelector(".ant-spin")).toBeTruthy();
    expect(screen.queryByText("经营驾驶舱")).not.toBeInTheDocument();
  });
});
