import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import Opportunities from "../../pages/Opportunities";

vi.mock("../../services/opportunity", () => ({
  opportunityApi: {
    list: vi.fn(() => Promise.resolve({ items: [], meta: { total: 0 } })),
    get: vi.fn(() => Promise.resolve({ stageHistory: [] })),
    getSummary: vi.fn(() =>
      Promise.resolve({
        total: 0,
        totalAmount: 0,
        byStage: {
          discovery: 0,
          qualification: 0,
          proposal: 0,
          negotiation: 0,
        },
        byResult: { won: 0, lost: 0 },
      }),
    ),
    create: vi.fn(),
    update: vi.fn(),
    changeStage: vi.fn(),
    markResult: vi.fn(),
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
      <option value="1">测试公司A</option>
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

describe("Opportunities 页面 - 基础渲染", () => {
  it("渲染页面标题和新建按钮", () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    expect(
      screen.getByRole("button", { name: /新建商机/i }),
    ).toBeInTheDocument();
  });

  it("显示商机列表表格", () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("显示汇总卡统计数据", async () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("商机总数")).toBeInTheDocument();
      expect(screen.getByText("总金额")).toBeInTheDocument();
      expect(screen.getByText("赢单数")).toBeInTheDocument();
    });
  });

  it("显示阶段分布统计", async () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("阶段分布")).toBeInTheDocument();
    });
  });

  it("打开新建商机对话框", async () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /新建商机/i }));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText(/商机名称/i)).toBeInTheDocument();
    });
  });
});

describe("Opportunities 页面 - 权限验证", () => {
  it("有权限时显示新建按钮", () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    expect(
      screen.getByRole("button", { name: /新建商机/i }),
    ).toBeInTheDocument();
  });
});

describe("Opportunities 页面 - WebSocket", () => {
  it("页面渲染成功", async () => {
    render(<Opportunities />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("商机总数")).toBeInTheDocument();
    });
  });
});
