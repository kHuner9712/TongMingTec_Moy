import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import QuoteDetail from "../../pages/QuoteDetail";

vi.mock("react-query", async () => {
  const actual = await vi.importActual("react-query");
  return actual;
});

vi.mock("../../services/quote", () => {
  const data = {
    quote: {
      id: "q1",
      quoteNo: "QT-2024-001",
      opportunityId: "opp1",
      customerId: "cust1",
      currentVersionNo: 1,
      currency: "CNY",
      amount: 50000,
      status: "approved",
      validUntil: "2025-12-31",
      sentAt: null,
      acceptedAt: null,
      version: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    versions: [{ versionNo: 1, totalAmount: 50000, createdAt: "2024-01-01T00:00:00Z" }],
    approvals: [],
  };
  return {
    quoteApi: {
      get: vi.fn(() => Promise.resolve(data)),
      approve: vi.fn(() => Promise.resolve(data.quote)),
      send: vi.fn(() => Promise.resolve(data.quote)),
      submitApproval: vi.fn(() => Promise.resolve(data.quote)),
    },
  };
});

vi.mock("../../services/contract", () => ({
  contractApi: {
    createFromQuote: vi.fn(() => Promise.resolve({ id: "ct1" })),
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
      <MemoryRouter initialEntries={["/quotes/q1"]}>
        <Routes>
          <Route path="/quotes/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

afterEach(() => { if (queryClient) queryClient.clear(); });

describe("QuoteDetail 页面", () => {
  beforeEach(() => vi.clearAllMocks());

  it("渲染报价编号", async () => {
    render(<QuoteDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("QT-2024-001")).toBeInTheDocument();
    });
  });

  it("展示客户跳转链接", async () => {
    render(<QuoteDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("查看客户")).toBeInTheDocument();
    });
  });

  it("展示商机跳转链接", async () => {
    render(<QuoteDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("查看商机")).toBeInTheDocument();
    });
  });

  it("approved 状态展示转合同按钮", async () => {
    render(<QuoteDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("转合同")).toBeInTheDocument();
    });
  });
});
