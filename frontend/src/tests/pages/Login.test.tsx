import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../../pages/Login";

interface AuthActions {
  setUser: vi.Mock;
  setTokens: vi.Mock;
}

const mockNavigate = vi.fn();
const mockSetUser = vi.fn();
const mockSetTokens = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../stores/authStore", () => ({
  useAuthStore: () => ({
    setUser: mockSetUser,
    setTokens: mockSetTokens,
    user: null,
    tokens: null,
    isAuthenticated: false,
  }),
}));

vi.mock("../../utils/api", () => ({
  default: {
    post: vi.fn(() =>
      Promise.resolve({
        user: { id: "1", username: "admin", orgId: "org-1" },
        tokens: {
          accessToken: "test-access",
          refreshToken: "test-refresh",
          expiresIn: 3600,
          tokenType: "Bearer",
        },
      }),
    ),
  },
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

describe("Login 页面 - 基础渲染", () => {
  it("渲染登录表单", () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/用户名/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/密码/i)).toBeInTheDocument();
  });

  it("渲染登录按钮", () => {
    renderLogin();
    const submitBtn = screen.getByRole("button");
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn.getAttribute("type")).toBe("submit");
  });

  it("渲染 MOY 标题", () => {
    renderLogin();
    expect(screen.getByText(/MOY 墨言/i)).toBeInTheDocument();
  });
});

describe("Login 页面 - 表单验证", () => {
  it("用户名为空时显示验证提示", async () => {
    renderLogin();
    const submitBtn = screen.getByRole("button");
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/请输入用户名/i)).toBeInTheDocument();
    });
  });
});

describe("Login 页面 - 登录流程", () => {
  it("登录成功后调用 setUser 和 setTokens", async () => {
    renderLogin();
    const usernameInput = screen.getByPlaceholderText(/用户名/i);
    const passwordInput = screen.getByPlaceholderText(/密码/i);
    const submitBtn = screen.getByRole("button");

    fireEvent.change(usernameInput, { target: { value: "admin" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalled();
      expect(mockSetTokens).toHaveBeenCalled();
    });
  });

  it("登录成功后跳转到 /dashboard", async () => {
    renderLogin();
    const usernameInput = screen.getByPlaceholderText(/用户名/i);
    const passwordInput = screen.getByPlaceholderText(/密码/i);
    const submitBtn = screen.getByRole("button");

    fireEvent.change(usernameInput, { target: { value: "admin" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });
});
