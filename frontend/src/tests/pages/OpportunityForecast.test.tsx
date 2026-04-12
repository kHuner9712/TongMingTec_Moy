import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import OpportunityForecast from "../../pages/OpportunityForecast";

const testState = vi.hoisted(() => ({
  mockInvalidateQueries: vi.fn(),
  pauseApiMock: vi.fn(() => Promise.resolve({ id: "opp-1" })),
  queryFixtures: {
    list: {
      items: [
        {
          id: "opp-1",
          orgId: "org-1",
          createdAt: "2026-04-01T08:00:00.000Z",
          updatedAt: "2026-04-08T08:00:00.000Z",
          version: 1,
          customerId: "cust-1",
          leadId: null,
          ownerUserId: "user-1",
          name: "年度采购扩容",
          amount: 120000,
          currency: "CNY",
          stage: "proposal",
          result: null,
          expectedCloseDate: "2026-06-30",
          pauseReason: null,
          customerName: "同明科技",
        },
      ],
      meta: {
        page: 1,
        page_size: 20,
        total: 1,
        total_pages: 1,
        has_next: false,
      },
    },
    forecastMap: {
      "opp-1": {
        opportunityId: "opp-1",
        winRate: 66.5,
        commitBand: "medium",
        drivers: [],
      },
    },
    forecastDetail: {
      opportunityId: "opp-1",
      winRate: 66.5,
      commitBand: "medium",
      drivers: [
        {
          label: "当前阶段",
          score: 68,
          reason: "当前阶段为 proposal，预测基础较高",
        },
      ],
    },
  },
}));

const { mockInvalidateQueries, pauseApiMock } = testState;

vi.mock("react-query", () => ({
  useQuery: vi.fn((queryKey: unknown[]) => {
    const key = queryKey[0];
    if (key === "opportunity-forecast-list") {
      return {
        data: JSON.parse(JSON.stringify(testState.queryFixtures.list)),
        isLoading: false,
      };
    }
    if (key === "opportunity-forecast-batch") {
      return {
        data: JSON.parse(JSON.stringify(testState.queryFixtures.forecastMap)),
        isLoading: false,
      };
    }
    if (key === "opportunity-forecast-detail") {
      return {
        data: JSON.parse(JSON.stringify(testState.queryFixtures.forecastDetail)),
        isLoading: false,
        isError: false,
      };
    }
    return { data: undefined, isLoading: false };
  }),
  useMutation: vi.fn((mutationFn: (payload: unknown) => Promise<unknown>, options?: { onSuccess?: () => void }) => ({
    mutate: async (payload: unknown) => {
      await mutationFn(payload);
      options?.onSuccess?.();
    },
    isLoading: false,
  })),
  useQueryClient: () => ({
    invalidateQueries: testState.mockInvalidateQueries,
  }),
}));

vi.mock("../../services/opportunity", () => ({
  opportunityApi: {
    list: vi.fn(() => Promise.resolve(testState.queryFixtures.list)),
    getForecast: vi.fn(() => Promise.resolve(testState.queryFixtures.forecastDetail)),
    pause: testState.pauseApiMock,
  },
}));

vi.mock("../../hooks/usePermission", () => ({
  usePermission: () => ({
    can: () => true,
    canAny: () => true,
    canAll: () => true,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

beforeEach(() => {
  pauseApiMock.mockClear();
  mockInvalidateQueries.mockClear();
});

describe("OpportunityForecast 页面", () => {
  it("渲染预测页与列表数据", async () => {
    render(<OpportunityForecast />);

    expect(await screen.findByText("商机预测与暂停管理")).toBeInTheDocument();
    expect(await screen.findByText("年度采购扩容")).toBeInTheDocument();
    expect(await screen.findByText("66.5%")).toBeInTheDocument();
  });

  it("打开预测详情抽屉展示驱动因子", async () => {
    render(<OpportunityForecast />);

    fireEvent.click(await screen.findByText("预测详情"));

    expect(await screen.findByText("驱动因子")).toBeInTheDocument();
    expect(await screen.findByText("当前阶段")).toBeInTheDocument();
  });

  it("提交暂停动作会调用暂停接口", async () => {
    render(<OpportunityForecast />);

    fireEvent.click(await screen.findByText("暂停"));

    const textarea = await screen.findByPlaceholderText("例如：等待预算审批");
    fireEvent.change(textarea, { target: { value: "等待预算审批" } });
    fireEvent.click(screen.getByText("确认暂停"));

    await waitFor(() => {
      expect(pauseApiMock).toHaveBeenCalledWith("opp-1", {
        pauseReason: "等待预算审批",
        version: 1,
      });
    });
  });
});
