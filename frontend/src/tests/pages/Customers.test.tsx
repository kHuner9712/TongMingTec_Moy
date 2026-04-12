import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import Customers from "../../pages/Customers";

vi.mock("../../services/customer", () => ({
  customerApi: {
    list: vi.fn(() =>
      Promise.resolve({ items: [], meta: { total: 0 } }),
    ),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    changeStatus: vi.fn(),
  },
}));

interface CustomerSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

vi.mock("../../components/CustomerSelect", () => ({
  default: ({ value, onChange, placeholder }: CustomerSelectProps) => (
    <select
      data-testid="customer-select"
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
    >
      <option value="">{placeholder || "选择客户"}</option>
      <option value="1">测试客户</option>
    </select>
  ),
}));

interface AuthState {
  user: { id: string; username: string; permissions: string[] };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
  isAuthenticated: boolean;
}

vi.mock("../../stores/authStore", () => ({
  useAuthStore: vi.fn((selector?: (state: AuthState) => unknown) => {
    const state: AuthState = {
      user: { id: "1", username: "admin", permissions: ["PERM-CM-VIEW", "PERM-CM-CREATE", "PERM-CM-UPDATE", "PERM-CM-STATUS"] },
      tokens: {
        accessToken: "test-token",
        refreshToken: "test-refresh",
        expiresIn: 3600,
        tokenType: "Bearer",
      },
      isAuthenticated: true,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock("../../hooks/usePermission", () => ({
  usePermission: () => ({
    can: () => true,
    canAny: () => true,
    canAll: () => true,
  }),
}));

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, cacheTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

afterEach(() => {
  if (queryClient) queryClient.clear();
});

describe("Customers 页面 - 基础渲染", () => {
  it("渲染新建客户按钮", () => {
    render(<Customers />, { wrapper: createWrapper() });
    expect(
      screen.getByRole("button", { name: /新建客户/i }),
    ).toBeInTheDocument();
  });

  it("显示客户表格", () => {
    render(<Customers />, { wrapper: createWrapper() });
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("显示状态筛选下拉框", () => {
    render(<Customers />, { wrapper: createWrapper() });
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it("显示搜索框", () => {
    render(<Customers />, { wrapper: createWrapper() });
    expect(
      screen.getByPlaceholderText(/搜索客户/i),
    ).toBeInTheDocument();
  });
});

describe("Customers 页面 - 数据展示", () => {
  it("空数据时表格存在", () => {
    render(<Customers />, { wrapper: createWrapper() });
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
