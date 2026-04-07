import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import Leads from "../../pages/Leads";
import * as leadApi from "../../services/lead";

vi.mock("../../services/lead");
vi.mock("../../components/UserSelect", () => ({
  default: ({ value, onChange, placeholder }: any) => (
    <select
      data-testid="user-select"
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
    >
      <option value="">{placeholder || "选择用户"}</option>
      <option value="1">张三</option>
    </select>
  ),
}));

vi.mock("../../hooks/useWebSocket", () => ({
  useWebSocket: vi.fn(() => ({ socket: null, isConnected: true })),
}));

vi.mock("../../stores/authStore", () => ({
  useAuthStore: vi.fn((selector: any) => {
    const state = {
      user: { id: "1", username: "admin", permissions: [] },
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

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

afterEach(() => {
  if (queryClient) {
    queryClient.clear();
  }
});

describe("Leads 页面 - 基础渲染", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (leadApi.leadApi.list as any).mockResolvedValue({
      items: [],
      meta: { total: 0 },
    });
  });

  it("渲染页面标题", () => {
    render(<Leads />, { wrapper: createWrapper() });
    expect(
      screen.getByRole("button", { name: /新建线索/i }),
    ).toBeInTheDocument();
  });

  it("显示表格", () => {
    render(<Leads />, { wrapper: createWrapper() });
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
