import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PermissionGate from "../../components/PermissionGate";

vi.mock("../../stores/authStore", () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from "../../stores/authStore";

const mockedUseAuthStore = vi.mocked(useAuthStore);

function mockPermissionSet(permissions: string[]) {
  mockedUseAuthStore.mockImplementation(
    ((selector: (state: { hasPermission: (perm: string) => boolean }) => unknown) =>
      selector({
        hasPermission: (perm: string) => permissions.includes(perm),
      })) as any,
  );
}

describe("PermissionGate", () => {
  it("renders children when permission is granted", () => {
    mockPermissionSet(["PERM-CM-VIEW"]);

    render(
      <PermissionGate anyOf={["PERM-CM-VIEW"]}>
        <div>allowed-content</div>
      </PermissionGate>,
    );

    expect(screen.getByText("allowed-content")).toBeInTheDocument();
  });

  it("renders fallback alert when permission is missing", () => {
    mockPermissionSet([]);

    render(
      <PermissionGate anyOf={["PERM-CM-VIEW"]}>
        <div>blocked-content</div>
      </PermissionGate>,
    );

    expect(screen.queryByText("blocked-content")).not.toBeInTheDocument();
    expect(screen.getByText("无权限访问")).toBeInTheDocument();
  });
});

