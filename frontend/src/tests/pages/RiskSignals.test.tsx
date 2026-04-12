import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import RiskSignals from "../../pages/RiskSignals";
import * as customerMemoryService from "../../services/customer-memory";
import type { CustomerRisk } from "../../types";

vi.mock("../../services/customer-memory");
vi.mock("../../hooks/usePermission", () => ({
  usePermission: () => ({ can: () => true, canAny: () => true, canAll: () => true }),
}));

const mockListRisks = customerMemoryService.customerMemoryApi
  .listRisks as ReturnType<typeof vi.fn>;

describe("RiskSignals page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps risk records and renders risk tab data", async () => {
    const risks: CustomerRisk[] = [
      {
        id: "risk-1",
        orgId: "org-1",
        customerId: "cust-high-001",
        riskLevel: "high",
        riskFactors: { overdueBills: 2, hint: "overdue-risk" },
        assessedAt: "2026-04-10T08:00:00.000Z",
        createdAt: "2026-04-10T08:00:00.000Z",
        updatedAt: "2026-04-10T08:00:00.000Z",
        version: 1,
      },
      {
        id: "risk-2",
        orgId: "org-1",
        customerId: "cust-low-001",
        riskLevel: "low",
        riskFactors: {},
        assessedAt: "2026-04-10T09:00:00.000Z",
        createdAt: "2026-04-10T09:00:00.000Z",
        updatedAt: "2026-04-10T09:00:00.000Z",
        version: 1,
      },
    ];

    mockListRisks.mockResolvedValue({
      items: risks,
      meta: { page: 1, pageSize: 50, total: 2 },
    });

    render(<RiskSignals />);

    await waitFor(() => {
      expect(mockListRisks).toHaveBeenCalledWith({ riskLevel: undefined });
    });

    expect(await screen.findByText("overdue-risk")).toBeInTheDocument();
    expect(screen.getByText("cust-hig")).toBeInTheDocument();
    expect(screen.queryByText("cust-low")).not.toBeInTheDocument();
  });
});

