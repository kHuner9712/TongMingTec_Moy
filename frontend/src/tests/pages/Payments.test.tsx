import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import Payments from "../../pages/Payments";

vi.mock("react-query", async () => {
  const actual = await vi.importActual("react-query");
  return actual;
});

vi.mock("../../services/payment", () => {
  const data = {
    items: [
      {
        id: "pay1",
        paymentNo: "PAY-2024-001",
        orderId: "ord1",
        customerId: "cust1",
        paymentMethod: "bank_transfer",
        status: "pending",
        currency: "CNY",
        amount: 50000,
        paidAt: null,
        externalTxnId: null,
        remark: null,
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
    paymentApi: {
      list: vi.fn(() => Promise.resolve(data)),
      create: vi.fn(() => Promise.resolve(data.items[0])),
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

describe("Payments 列表页", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("渲染付款列表", async () => {
    render(<Payments />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("PAY-2024-001")).toBeInTheDocument();
    });
  });

  it("展示记录付款按钮", async () => {
    render(<Payments />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("记录付款")).toBeInTheDocument();
    });
  });
});

