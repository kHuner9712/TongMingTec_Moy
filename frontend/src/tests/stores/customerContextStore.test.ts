import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/ai-runtime", () => ({
  aiRuntimeApi: {
    getNextActions: vi.fn(),
    getCustomerTimeline: vi.fn(),
    listAgentRuns: vi.fn(),
    getCustomerSnapshots: vi.fn(),
  },
}));

vi.mock("../../services/customer-memory", () => ({
  customerMemoryApi: {
    getContext: vi.fn(),
    getIntent: vi.fn(),
    getRisk: vi.fn(),
    acceptAction: vi.fn(),
    dismissAction: vi.fn(),
  },
}));

import { aiRuntimeApi } from "../../services/ai-runtime";
import { customerMemoryApi } from "../../services/customer-memory";
import { useCustomerContextStore } from "../../stores/customerContextStore";

const mockAiRuntimeApi = vi.mocked(aiRuntimeApi);
const mockCustomerMemoryApi = vi.mocked(customerMemoryApi);

describe("customerContextStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCustomerContextStore.setState({
      context: null,
      intent: null,
      risk: null,
      nextActions: [],
      timeline: [],
      aiRuns: [],
      snapshots: [],
      loading: false,
    });
  });

  it("unwraps paged ai-runtime responses", async () => {
    mockCustomerMemoryApi.getContext.mockResolvedValue(null as any);
    mockCustomerMemoryApi.getIntent.mockResolvedValue(null as any);
    mockCustomerMemoryApi.getRisk.mockResolvedValue(null as any);
    mockAiRuntimeApi.getNextActions.mockResolvedValue({
      items: [{ id: "action-1", status: "pending" }],
      total: 1,
    } as any);
    mockAiRuntimeApi.getCustomerTimeline.mockResolvedValue({
      items: [{ id: "event-1" }],
      total: 1,
    } as any);
    mockAiRuntimeApi.listAgentRuns.mockResolvedValue({
      items: [{ id: "run-1" }],
      total: 1,
    } as any);
    mockAiRuntimeApi.getCustomerSnapshots.mockResolvedValue({
      items: [{ id: "snapshot-1" }],
      total: 1,
    } as any);

    await useCustomerContextStore.getState().loadCustomerContext("cust-1");

    const state = useCustomerContextStore.getState();
    expect(state.nextActions).toHaveLength(1);
    expect(state.timeline).toHaveLength(1);
    expect(state.aiRuns).toHaveLength(1);
    expect(state.snapshots).toHaveLength(1);
  });

  it("acceptAction updates local action status", async () => {
    mockCustomerMemoryApi.acceptAction.mockResolvedValue({} as any);
    useCustomerContextStore.setState({
      nextActions: [
        {
          id: "action-1",
          customerId: "cust-1",
          actionType: "follow_up",
          priority: 1,
          reasoning: "test",
          suggestedBy: "ai",
          suggestedAt: "2026-01-01T00:00:00.000Z",
          status: "pending",
          orgId: "org-1",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          version: 1,
        },
      ],
    });

    await useCustomerContextStore
      .getState()
      .acceptAction("cust-1", "action-1");

    const updated = useCustomerContextStore.getState().nextActions[0];
    expect(updated.status).toBe("accepted");
    expect(mockCustomerMemoryApi.acceptAction).toHaveBeenCalledWith(
      "cust-1",
      "action-1",
    );
  });

  it("dismissAction updates local action status", async () => {
    mockCustomerMemoryApi.dismissAction.mockResolvedValue({} as any);
    useCustomerContextStore.setState({
      nextActions: [
        {
          id: "action-1",
          customerId: "cust-1",
          actionType: "follow_up",
          priority: 1,
          reasoning: "test",
          suggestedBy: "ai",
          suggestedAt: "2026-01-01T00:00:00.000Z",
          status: "pending",
          orgId: "org-1",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          version: 1,
        },
      ],
    });

    await useCustomerContextStore
      .getState()
      .dismissAction("cust-1", "action-1");

    const updated = useCustomerContextStore.getState().nextActions[0];
    expect(updated.status).toBe("dismissed");
    expect(mockCustomerMemoryApi.dismissAction).toHaveBeenCalledWith(
      "cust-1",
      "action-1",
    );
  });
});
