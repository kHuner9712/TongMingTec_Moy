import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ConversationWorkbench from "../../pages/workbench/ConversationWorkbench";

vi.mock("../../services/conversation", () => ({
  conversationApi: {
    list: vi.fn(() =>
      Promise.resolve({ items: [], meta: { total: 0 } }),
    ),
    accept: vi.fn(),
    transfer: vi.fn(),
    close: vi.fn(),
  },
}));

vi.mock("../../services/ai-runtime", () => ({
  aiRuntimeApi: {
    executeAgent: vi.fn(),
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
  useAuthStore: Object.assign(
    vi.fn((selector?: (state: AuthState) => unknown) => {
      const state: AuthState = {
        user: { id: "1", username: "admin", permissions: ["PERM-CNV-VIEW", "PERM-CNV-ACCEPT", "PERM-CNV-TRANSFER", "PERM-CNV-CLOSE"] },
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
    { getState: () => ({ user: { id: "1", username: "admin" } }) },
  ),
}));

vi.mock("../../hooks/usePermission", () => ({
  usePermission: () => ({
    can: () => true,
    canAny: () => true,
    canAll: () => true,
  }),
}));

describe("ConversationWorkbench 页面 - 基础渲染", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("渲染页面标题", () => {
    render(<ConversationWorkbench />);
    expect(screen.getByText(/会话与跟进工作台/i)).toBeInTheDocument();
  });

  it("显示会话表格", () => {
    render(<ConversationWorkbench />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("显示状态筛选下拉框", () => {
    render(<ConversationWorkbench />);
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it("渲染页面包含交互元素", () => {
    render(<ConversationWorkbench />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("无排队会话时不显示 AI 提醒", () => {
    render(<ConversationWorkbench />);
    expect(screen.queryByText(/AI 助手提醒/i)).not.toBeInTheDocument();
  });
});
