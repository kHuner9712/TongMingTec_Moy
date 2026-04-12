import { describe, it, expect, vi } from "vitest";
import { usePermission } from "../../hooks/usePermission";

vi.mock("../../stores/authStore", () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from "../../stores/authStore";

const mockedUseAuthStore = vi.mocked(useAuthStore);

function mockHasPermission(fn: (perm: string) => boolean) {
  mockedUseAuthStore.mockImplementation(
    ((selector: (state: { hasPermission: (p: string) => boolean }) => unknown) => {
      const state = { hasPermission: fn };
      return selector(state);
    }) as any,
  );
}

describe("usePermission Hook", () => {
  it("can delegates to hasPermission", () => {
    mockHasPermission((perm) => perm === "PERM-CM-VIEW");

    const { can } = usePermission();

    expect(can("PERM-CM-VIEW")).toBe(true);
    expect(can("PERM-CM-CREATE")).toBe(false);
  });

  it("canAny returns true when any permission matches", () => {
    mockHasPermission((perm) => perm === "PERM-CM-VIEW");

    const { canAny } = usePermission();

    expect(canAny("PERM-CM-VIEW", "PERM-CM-CREATE")).toBe(true);
    expect(canAny("PERM-CM-CREATE", "PERM-CM-UPDATE")).toBe(false);
  });

  it("canAll returns true when all permissions match", () => {
    const allowed = ["PERM-CM-VIEW", "PERM-CM-CREATE"];
    mockHasPermission((perm) => allowed.includes(perm));

    const { canAll } = usePermission();

    expect(canAll("PERM-CM-VIEW", "PERM-CM-CREATE")).toBe(true);
    expect(canAll("PERM-CM-VIEW", "PERM-CM-UPDATE")).toBe(false);
  });
});
