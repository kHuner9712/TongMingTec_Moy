import { describe, it, expect, vi } from "vitest";
import { usePermission } from "../../hooks/usePermission";

vi.mock("../../stores/authStore", () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from "../../stores/authStore";

const mockedUseAuthStore = vi.mocked(useAuthStore);

describe("usePermission Hook", () => {
  it("can() 委托给 hasPermission", () => {
    mockedUseAuthStore.mockImplementation(
      (selector?: (state: { hasPermission: (p: string) => boolean }) => unknown) => {
        const state = {
          hasPermission: (perm: string) => perm === "PERM-CM-VIEW",
        };
        return selector ? selector(state) : state;
      },
    );
    const { can } = usePermission();
    expect(can("PERM-CM-VIEW")).toBe(true);
    expect(can("PERM-CM-CREATE")).toBe(false);
  });

  it("canAny() 任一权限匹配返回 true", () => {
    mockedUseAuthStore.mockImplementation(
      (selector?: (state: { hasPermission: (p: string) => boolean }) => unknown) => {
        const state = {
          hasPermission: (perm: string) => perm === "PERM-CM-VIEW",
        };
        return selector ? selector(state) : state;
      },
    );
    const { canAny } = usePermission();
    expect(canAny("PERM-CM-VIEW", "PERM-CM-CREATE")).toBe(true);
    expect(canAny("PERM-CM-CREATE", "PERM-CM-UPDATE")).toBe(false);
  });

  it("canAll() 全部权限匹配返回 true", () => {
    const allowed = ["PERM-CM-VIEW", "PERM-CM-CREATE"];
    mockedUseAuthStore.mockImplementation(
      (selector?: (state: { hasPermission: (p: string) => boolean }) => unknown) => {
        const state = {
          hasPermission: (perm: string) => allowed.includes(perm),
        };
        return selector ? selector(state) : state;
      },
    );
    const { canAll } = usePermission();
    expect(canAll("PERM-CM-VIEW", "PERM-CM-CREATE")).toBe(true);
    expect(canAll("PERM-CM-VIEW", "PERM-CM-UPDATE")).toBe(false);
  });
});
