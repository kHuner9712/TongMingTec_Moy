import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Customer360 from "../../pages/Customer360";

vi.mock("../../services/ai-runtime", () => ({
  aiRuntimeApi: {
    getCustomer360: vi.fn(),
  },
}));

vi.mock("../../stores/customerContextStore", () => ({
  useCustomerContextStore: vi.fn(),
}));

vi.mock("../../hooks/usePermission", () => ({
  usePermission: vi.fn(),
}));

import { aiRuntimeApi } from "../../services/ai-runtime";
import { useCustomerContextStore } from "../../stores/customerContextStore";
import { usePermission } from "../../hooks/usePermission";

const mockAiRuntimeApi = vi.mocked(aiRuntimeApi);
const mockStoreHook = vi.mocked(useCustomerContextStore);
const mockPermissionHook = vi.mocked(usePermission);

const mockLoadCustomerContext = vi.fn(() => Promise.resolve());

const baseStoreState = {
  loadCustomerContext: mockLoadCustomerContext,
  nextActions: [
    {
      id: "action-1",
      customerId: "cust-1",
      actionType: "follow_up",
      priority: 1,
      reasoning: "need follow up",
      suggestedBy: "ai",
      suggestedAt: "2026-01-01T00:00:00.000Z",
      status: "pending" as const,
      orgId: "org-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      version: 1,
    },
  ],
  timeline: [],
  aiRuns: [],
  snapshots: [],
  acceptAction: vi.fn(() => Promise.resolve()),
  dismissAction: vi.fn(() => Promise.resolve()),
};

const customer360Data = {
  customer: {
    id: "cust-1",
    orgId: "org-1",
    name: "Customer A",
    industry: null,
    level: null,
    ownerUserId: "user-1",
    status: "active",
    phone: null,
    email: null,
    address: null,
    remark: null,
    lastContactAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    version: 1,
  },
  contacts: [],
  leads: [],
  opportunities: [],
  conversations: [],
  tickets: [],
  latestContext: null,
  currentIntent: null,
  riskLevel: null,
  nextActions: [],
};

describe("Customer360 page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAiRuntimeApi.getCustomer360.mockResolvedValue(customer360Data as any);
    mockStoreHook.mockReturnValue(baseStoreState as any);
    mockPermissionHook.mockReturnValue({
      can: () => true,
      canAny: () => true,
      canAll: () => true,
    });
  });

  it("shows action buttons for pending suggestion when update permission exists", async () => {
    render(
      <MemoryRouter initialEntries={["/customer-360/cust-1"]}>
        <Routes>
          <Route path="customer-360/:id" element={<Customer360 />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Customer A")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /接受/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /忽略/ })).toBeInTheDocument();
  });

  it("hides action buttons without update permission", async () => {
    mockPermissionHook.mockReturnValue({
      can: () => false,
      canAny: () => false,
      canAll: () => false,
    });

    render(
      <MemoryRouter initialEntries={["/customer-360/cust-1"]}>
        <Routes>
          <Route path="customer-360/:id" element={<Customer360 />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Customer A")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /接受/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /忽略/ })).not.toBeInTheDocument();
  });
});
