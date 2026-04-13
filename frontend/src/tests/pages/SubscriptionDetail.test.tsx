import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SubscriptionDetail from "../../pages/SubscriptionDetail";

vi.mock("react-query", async () => {
  const actual = await vi.importActual("react-query");
  return actual;
});

vi.mock("../../services/subscription", () => {
  const data = {
    subscription: {
      id: "sub1",
      orderId: "ord1",
      customerId: "cust1",
      planId: "plan1",
      status: "active",
      startsAt: "2024-01-01T00:00:00Z",
      endsAt: "2025-01-01T00:00:00Z",
      autoRenew: true,
      seatCount: 10,
      usedCount: 5,
      lastBillAt: null,
      version: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    seats: [
      { id: "seat1", userId: "user1", status: "active", assignedAt: "2024-01-01T00:00:00Z" },
    ],
  };
  return {
    subscriptionApi: {
      get: vi.fn(() => Promise.resolve(data)),
      suspend: vi.fn(() => Promise.resolve(data.subscription)),
      cancel: vi.fn(() => Promise.resolve(data.subscription)),
      update: vi.fn(() => Promise.resolve(data.subscription)),
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
      <MemoryRouter initialEntries={["/subscriptions/sub1"]}>
        <Routes>
          <Route path="/subscriptions/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

afterEach(() => { if (queryClient) queryClient.clear(); });

describe("SubscriptionDetail 页面", () => {
  beforeEach(() => vi.clearAllMocks());

  it("渲染订阅信息", async () => {
    render(<SubscriptionDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("生效中")).toBeInTheDocument();
    });
  });

  it("展示客户跳转链接", async () => {
    render(<SubscriptionDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("查看客户")).toBeInTheDocument();
    });
  });

  it("展示关联订单跳转链接", async () => {
    render(<SubscriptionDetail />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("查看订单")).toBeInTheDocument();
    });
  });
});
