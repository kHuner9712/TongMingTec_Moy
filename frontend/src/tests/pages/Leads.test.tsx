import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import Leads from "../../pages/Leads";

vi.mock("../../services/lead", () => ({
  leadApi: {
    list: vi.fn(() => Promise.resolve({ items: [], meta: { total: 0 } })),
    get: vi.fn(),
    create: vi.fn(),
    assign: vi.fn(),
    addFollowUp: vi.fn(),
    convert: vi.fn(),
  },
}));

interface UserSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

vi.mock("../../components/UserSelect", () => ({
  default: ({ value, onChange, placeholder }: UserSelectProps) => (
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
