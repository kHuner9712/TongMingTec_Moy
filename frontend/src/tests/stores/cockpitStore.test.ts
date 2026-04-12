import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/ai-runtime", () => ({
  aiRuntimeApi: {
    getCockpitData: vi.fn(),
  },
}));

import { aiRuntimeApi } from "../../services/ai-runtime";
import { useCockpitStore } from "../../stores/cockpitStore";

const mockAiRuntimeApi = vi.mocked(aiRuntimeApi);

describe("cockpitStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCockpitStore.setState({
      aiInsights: [],
      riskSignals: [],
      keyMetrics: { totalCustomers: 0, activeCustomers: 0, pendingFollowups: 0 },
      recentAgentRuns: [],
      recommendedTodos: [],
      loading: false,
    });
  });

  it("loads cockpit data from array payload", async () => {
    mockAiRuntimeApi.getCockpitData.mockResolvedValue({
      aiInsights: [
        {
          id: "insight-1",
          type: "risk_alert",
          title: "高风险客户",
          description: "客户有流失迹象",
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
        },
      ],
      keyMetrics: { totalCustomers: 12, activeCustomers: 8, pendingFollowups: 3 },
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
          description: "请尽快处理",
          actionType: "approval",
          relatedId: "approval-1",
          relatedType: "approval",
          priority: 1,
        },
      ],
    } as any);

    await useCockpitStore.getState().fetchCockpitData();

    const state = useCockpitStore.getState();
    expect(state.aiInsights).toHaveLength(1);
    expect(state.riskSignals).toHaveLength(1);
    expect(state.recentAgentRuns).toHaveLength(1);
    expect(state.recommendedTodos).toHaveLength(1);
    expect(state.keyMetrics).toEqual({
      totalCustomers: 12,
      activeCustomers: 8,
      pendingFollowups: 3,
    });
    expect(state.loading).toBe(false);
  });

  it("unwraps list payloads with items and normalizes key metrics defaults", async () => {
    mockAiRuntimeApi.getCockpitData.mockResolvedValue({
      aiInsights: {
        items: [
          {
            id: "insight-1",
            type: "opportunity_hint",
            title: "有新增机会",
            description: "建议推进跟进",
            severity: "info",
          },
        ],
      },
      riskSignals: {
        items: [
          {
            id: "risk-1",
            type: "risk_alert",
            title: "高风险信号",
            description: "风险等级: critical",
            severity: "error",
          },
        ],
      },
      keyMetrics: {
        totalCustomers: 5,
      },
      recentAgentRuns: {
        items: [
          {
            id: "run-1",
            orgId: "org-1",
            agentId: "agent-1",
            customerId: null,
            requestId: null,
            status: "succeeded",
            inputPayload: {},
            outputPayload: {},
            executionMode: "suggest",
            latencyMs: 100,
            tokenCost: 10,
            errorMessage: null,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
      recommendedTodos: {
        items: [
          {
            id: "todo-1",
            title: "去跟进客户",
            description: "AI 推荐跟进",
            actionType: "follow_up",
            relatedId: "cust-1",
            relatedType: "customer",
            priority: 2,
          },
        ],
      },
    } as any);

    await useCockpitStore.getState().fetchCockpitData();

    const state = useCockpitStore.getState();
    expect(state.aiInsights).toHaveLength(1);
    expect(state.riskSignals).toHaveLength(1);
    expect(state.recentAgentRuns).toHaveLength(1);
    expect(state.recommendedTodos).toHaveLength(1);
    expect(state.keyMetrics).toEqual({
      totalCustomers: 5,
      activeCustomers: 0,
      pendingFollowups: 0,
    });
  });
});
