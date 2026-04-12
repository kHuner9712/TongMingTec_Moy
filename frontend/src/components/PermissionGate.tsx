import { ReactNode } from "react";
import { Alert } from "antd";
import { useAuthStore } from "../stores/authStore";

interface PermissionGateProps {
  anyOf?: string[];
  children: ReactNode;
}

export default function PermissionGate({
  anyOf,
  children,
}: PermissionGateProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  if (!anyOf || anyOf.length === 0) {
    return <>{children}</>;
  }

  const allowed = anyOf.some((perm) => hasPermission(perm));

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <div style={{ maxWidth: 560, margin: "48px auto" }}>
      <Alert
        type="error"
        showIcon
        message="无权限访问"
        description="当前账号缺少页面访问权限，请联系管理员授权。"
      />
    </div>
  );
}

