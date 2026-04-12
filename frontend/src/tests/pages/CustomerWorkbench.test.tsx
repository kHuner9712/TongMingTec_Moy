import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import CustomerWorkbench from "../../pages/workbench/CustomerWorkbench";

vi.mock("../../services/customer", () => ({
  customerApi: {
    list: vi.fn(() =>
      Promise.resolve({ items: [], meta: { total: 0 } }),
    ),
    get: vi.fn(),
    create: vi.fn(() => Promise.resolve({})),
    update: vi.fn(() => Promise.resolve({})),
    changeStatus: vi.fn(() => Promise.resolve({})),
  },
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

afterEach(() => {
  if (queryClient) {
    queryClient.clear();
  }
});

describe("CustomerWorkbench 页面 - 基础渲染", () => {
  it("渲染页面标题和新建按钮", () => {
    render(<CustomerWorkbench />, { wrapper: createWrapper() });
    expect(screen.getByText("客户经营工作台")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /新建客户/i }),
    ).toBeInTheDocument();
  });

  it("显示 AI 经营建议提示", () => {
    render(<CustomerWorkbench />, { wrapper: createWrapper() });
    expect(screen.getByText("AI 经营建议")).toBeInTheDocument();
  });

  it("显示客户列表表格", () => {
    render(<CustomerWorkbench />, { wrapper: createWrapper() });
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("显示筛选区域", () => {
    render(<CustomerWorkbench />, { wrapper: createWrapper() });
    expect(screen.getByText("状态筛选")).toBeInTheDocument();
    expect(screen.getByText("风险等级")).toBeInTheDocument();
  });
});

describe("CustomerWorkbench 页面 - 创建客户", () => {
  it("打开新建客户对话框", async () => {
    render(<CustomerWorkbench />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /新建客户/i }));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText("客户名称")).toBeInTheDocument();
    });
  });

  it("创建表单包含所有字段", async () => {
    render(<CustomerWorkbench />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /新建客户/i }));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("行业")).toBeInTheDocument();
    expect(screen.getByLabelText("客户等级")).toBeInTheDocument();
    expect(screen.getByLabelText("电话")).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("地址")).toBeInTheDocument();
    expect(screen.getByLabelText("备注")).toBeInTheDocument();
  });
});

describe("CustomerWorkbench 页面 - 视图切换", () => {
  it("显示表格和卡片视图切换按钮", () => {
    render(<CustomerWorkbench />, { wrapper: createWrapper() });
    const allButtons = screen.getAllByRole("button");
    const hasAppstoreIcon = allButtons.some(
      (b) => b.querySelector(".anticon-appstore") !== null,
    );
    const hasUnorderedListIcon = allButtons.some(
      (b) => b.querySelector(".anticon-unordered-list") !== null,
    );
    expect(hasAppstoreIcon).toBe(true);
    expect(hasUnorderedListIcon).toBe(true);
  });
});
