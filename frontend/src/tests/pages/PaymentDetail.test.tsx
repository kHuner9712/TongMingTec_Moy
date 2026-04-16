import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PaymentDetail from "../../pages/PaymentDetail";

vi.mock("react-query", async () => {
  const actual = await vi.importActual("react-query");
  return actual;
});

vi.mock("../../services/payment", () => {
  const data = {
    id: "pay1",
    paymentNo: "PAY-2024-001",
    orderId: "ord1",
    customerId: "cust1",
    paymentMethod: "bank_transfer",
    status: "processing",
    currency: "CNY",
    amount: 50000,
    paidAt: null,
    externalTxnId: null,
    remark: null,
    version: 1,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };
  return {
    paymentApi: {
      get: vi.fn(() => Promise.resolve(data)),
      process: vi.fn(() => Promise.resolve(data)),
      succeed: vi.fn(() => Promise.resolve(data)),
      fail: vi.fn(() => Promise.resolve(data)),
      refund: vi.fn(() => Promise.resolve(data)),
      void: vi.fn(() => Promise.resolve(data)),
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
      <MemoryRouter initialEntries={["/payments/pay1"]}>
        <Routes>
          <Route path="/payments/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

afterEach(() => { if (queryClient) queryClient.clear(); });

describe("PaymentDetail 页面", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("展示关联订单跳转链接", async () => {
    render(<PaymentDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("查看订单")).toBeInTheDocument();
    });
  });

  it("展示客户跳转链接", async () => {
    render(<PaymentDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("查看客户")).toBeInTheDocument();
    });
  });
});

