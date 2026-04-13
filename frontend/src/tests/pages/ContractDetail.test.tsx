import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ContractDetail from "../../pages/ContractDetail";

vi.mock("react-query", async () => {
  const actual = await vi.importActual("react-query");
  return actual;
});

vi.mock("../../services/contract", () => {
  const data = {
    contract: {
      id: "ct1",
      contractNo: "CT-2024-001",
      opportunityId: "opp1",
      customerId: "cust1",
      quoteId: "q1",
      status: "active",
      signedAt: "2024-06-01T00:00:00Z",
      startsOn: "2024-06-01",
      endsOn: "2025-06-01",
      version: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    approvals: [],
    documents: [],
  };
  return {
    contractApi: {
      get: vi.fn(() => Promise.resolve(data)),
      approve: vi.fn(() => Promise.resolve(data.contract)),
      sign: vi.fn(() => Promise.resolve(data.contract)),
      activate: vi.fn(() => Promise.resolve(data.contract)),
      terminate: vi.fn(() => Promise.resolve(data.contract)),
      submitApproval: vi.fn(() => Promise.resolve(data.contract)),
    },
  };
});

vi.mock("../../services/order", () => ({
  orderApi: {
    createFromContract: vi.fn(() => Promise.resolve({ id: "ord1" })),
  },
}));

vi.mock("../../stores/authStore", () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: "1", username: "admin", permissions: [] },
    tokens: { accessToken: "t", refreshToken: "r", expiresIn: 3600, tokenType: "Bearer" },
    isAuthenticated: true,
  })),
}));

vi.mock("../../hooks/usePermission", () => ({
  usePermission: () => ({ can: () => true, canAny: () => true, canAll: () => true }),
}));

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, cacheTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/contracts/ct1"]}>
        <Routes>
          <Route path="/contracts/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

afterEach(() => { if (queryClient) queryClient.clear(); });

describe("ContractDetail 页面", () => {
  beforeEach(() => vi.clearAllMocks());

  it("渲染合同编号", async () => {
    render(<ContractDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("CT-2024-001")).toBeInTheDocument();
    });
  });

  it("展示客户跳转链接", async () => {
    render(<ContractDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("查看客户")).toBeInTheDocument();
    });
  });

  it("active 状态展示转订单按钮", async () => {
    render(<ContractDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("转订单")).toBeInTheDocument();
    });
  });

  it("展示关联报价跳转", async () => {
    render(<ContractDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("查看报价")).toBeInTheDocument();
    });
  });
});
