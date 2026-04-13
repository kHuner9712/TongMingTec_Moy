import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import OrderDetail from "../../pages/OrderDetail";

vi.mock("react-query", async () => {
  const actual = await vi.importActual("react-query");
  return actual;
});

vi.mock("../../services/order", () => {
  const data = {
    order: {
      id: "ord1",
      orderNo: "ORD-2024-001",
      contractId: "ct1",
      quoteId: "q1",
      customerId: "cust1",
      orderType: "new",
      status: "confirmed",
      currency: "CNY",
      totalAmount: 50000,
      activatedAt: null,
      version: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    items: [
      { id: "item1", itemType: "subscription", refId: "plan1", quantity: 10, unitPrice: 5000 },
    ],
  };
  return {
    orderApi: {
      get: vi.fn(() => Promise.resolve(data)),
      confirm: vi.fn(() => Promise.resolve(data.order)),
      activate: vi.fn(() => Promise.resolve(data.order)),
      complete: vi.fn(() => Promise.resolve(data.order)),
      cancel: vi.fn(() => Promise.resolve(data.order)),
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
      <MemoryRouter initialEntries={["/orders/ord1"]}>
        <Routes>
          <Route path="/orders/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

afterEach(() => { if (queryClient) queryClient.clear(); });

describe("OrderDetail 页面", () => {
  beforeEach(() => vi.clearAllMocks());

  it("展示客户跳转链接", async () => {
    render(<OrderDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("查看客户")).toBeInTheDocument();
    });
  });

  it("展示关联合同跳转链接", async () => {
    render(<OrderDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("查看合同")).toBeInTheDocument();
    });
  });

  it("展示关联报价跳转链接", async () => {
    render(<OrderDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("查看报价")).toBeInTheDocument();
    });
  });
});
