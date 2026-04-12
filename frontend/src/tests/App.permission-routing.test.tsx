import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

const authState = {
  isAuthenticated: true,
  permissions: new Set<string>(),
};

vi.mock("../stores/authStore", () => ({
  useAuthStore: vi.fn((selector?: (state: unknown) => unknown) => {
    const state = {
      isAuthenticated: authState.isAuthenticated,
      user: { displayName: "tester" },
      logout: vi.fn(),
      hasPermission: (perm: string) => authState.permissions.has(perm),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock("../components/Layout", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  const router = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  const MockLayout = () =>
    React.createElement(
      "div",
      { "data-testid": "layout-shell" },
      React.createElement(router.Outlet),
    );

  return { default: MockLayout };
});

vi.mock("../pages/Login", () => ({
  default: () => <div>Login Page</div>,
}));
vi.mock("../pages/Customer360", () => ({
  default: () => <div>Customer360 Page</div>,
}));
vi.mock("../pages/Leads", () => ({
  default: () => <div>Leads Page</div>,
}));
vi.mock("../pages/Cockpit", () => ({
  default: () => <div>Cockpit Page</div>,
}));
vi.mock("../pages/workbench/CustomerWorkbench", () => ({
  default: () => <div>Customer Workbench Page</div>,
}));
vi.mock("../pages/workbench/ConversationWorkbench", () => ({
  default: () => <div>Conversation Workbench Page</div>,
}));
vi.mock("../pages/workbench/AiRunsWorkbench", () => ({
  default: () => <div>AI Runs Workbench Page</div>,
}));
vi.mock("../pages/workbench/ApprovalWorkbench", () => ({
  default: () => <div>Approval Workbench Page</div>,
}));
vi.mock("../pages/RiskSignals", () => ({
  default: () => <div>Risk Signals Page</div>,
}));
vi.mock("../pages/AgentHub", () => ({
  default: () => <div>Agent Hub Page</div>,
}));
vi.mock("../pages/Dashboard", () => ({
  default: () => <div>Dashboard Page</div>,
}));
vi.mock("../pages/Opportunities", () => ({
  default: () => <div>Opportunities Page</div>,
}));
vi.mock("../pages/Tickets", () => ({
  default: () => <div>Tickets Page</div>,
}));
vi.mock("../pages/Notifications", () => ({
  default: () => <div>Notifications Page</div>,
}));
vi.mock("../pages/Users", () => ({
  default: () => <div>Users Page</div>,
}));
vi.mock("../pages/Settings", () => ({
  default: () => <div>Settings Page</div>,
}));
vi.mock("../pages/Workbench", () => ({
  default: () => <div>Workbench Page</div>,
}));

function renderAt(path: string, permissions: string[] = []) {
  authState.permissions = new Set(permissions);
  window.history.pushState({}, "", path);
  return render(<App />);
}

describe("App route permission baseline", () => {
  beforeEach(() => {
    authState.isAuthenticated = true;
    authState.permissions = new Set();
  });

  it("blocks direct Customer360 route access when missing PERM-CM-VIEW", async () => {
    renderAt("/customer-360/cust-1");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Customer360 Page")).not.toBeInTheDocument();
  });

  it("allows Customer360 route access with PERM-CM-VIEW", async () => {
    renderAt("/customer-360/cust-1", ["PERM-CM-VIEW"]);
    expect(await screen.findByText("Customer360 Page")).toBeInTheDocument();
  });

  it("allows Leads route when any configured permission is present", async () => {
    renderAt("/leads", ["PERM-LM-ASSIGN"]);
    expect(await screen.findByText("Leads Page")).toBeInTheDocument();
  });

  it("blocks Leads route when all configured permissions are missing", async () => {
    renderAt("/leads");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Leads Page")).not.toBeInTheDocument();
  });

  it("blocks Notifications route when missing PERM-NTF-VIEW", async () => {
    renderAt("/notifications");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Notifications Page")).not.toBeInTheDocument();
  });

  it("allows Notifications route with PERM-NTF-VIEW", async () => {
    renderAt("/notifications", ["PERM-NTF-VIEW"]);
    expect(await screen.findByText("Notifications Page")).toBeInTheDocument();
  });
});
