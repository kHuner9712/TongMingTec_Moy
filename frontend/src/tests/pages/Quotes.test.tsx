import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import Quotes from "../../pages/Quotes";

vi.mock("react-query", async () => {
  const actual = await vi.importActual("react-query");
  return actual;
});

vi.mock("../../services/quote", () => {
  const data = {
    items: [
      {
        id: "q1",
        quoteNo: "QT-2024-001",
        customerId: "cust1",
        opportunityId: "opp1",
        currentVersionNo: 1,
        currency: "CNY",
        amount: 50000,
        status: "draft",
        validUntil: "2025-12-31",
        version: 1,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ],
    total: 1,
    page: 1,
    pageSize: 20,
  };
  return {
    quoteApi: {
      list: vi.fn(() => Promise.resolve(data)),
      create: vi.fn(() => Promise.resolve(data.items[0])),
      submitApproval: vi.fn(() => Promise.resolve(data.items[0])),
    },
  };
});

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

vi.mock("../../hooks/useWebSocket", () => ({
  useWebSocket: () => ({ lastEvent: null, connected: false }),
}));

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, cacheTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

afterEach(() => { if (queryClient) queryClient.clear(); });

describe("Quotes 列表页", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("渲染报价列表", async () => {
    render(<Quotes />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("QT-2024-001")).toBeInTheDocument();
    });
  });

  it("展示新建报价按钮", async () => {
    render(<Quotes />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("新建报价")).toBeInTheDocument();
    });
  });
});

