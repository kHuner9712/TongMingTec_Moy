import { useAuthStore } from "../stores/authStore";

export function usePermission() {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const can = (permission: string) => hasPermission(permission);

  const canAny = (...permissions: string[]) =>
    permissions.some((p) => hasPermission(p));

  const canAll = (...permissions: string[]) =>
    permissions.every((p) => hasPermission(p));

  return { can, canAny, canAll };
}
