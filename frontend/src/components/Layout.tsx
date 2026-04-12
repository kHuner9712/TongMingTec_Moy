import { Outlet } from "react-router-dom";
import { Layout as AntLayout, Menu, Badge } from "antd";
import {
  TeamOutlined,
  UserOutlined,
  UserSwitchOutlined,
  PhoneOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  RobotOutlined,
  AuditOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useApprovalStore } from "../stores/approvalStore";
import { CopilotPanel } from "./AiCopilot";

const { Sider, Content, Header } = AntLayout;

interface MenuItemWithPermission {
  key: string;
  icon?: React.ReactNode;
  label: React.ReactNode;
  permission?: string;
}

interface MenuGroupWithPermission {
  type: "group";
  label: string;
  children: MenuItemWithPermission[];
}

const menuItems: MenuGroupWithPermission[] = [
  {
    type: "group" as const,
    label: "经营中心",
    children: [
      {
        key: "/cockpit",
        icon: <DashboardOutlined />,
        label: "经营驾驶舱",
        permission: "PERM-SYS-VIEW",
      },
    ],
  },
  {
    type: "group" as const,
    label: "工作台",
    children: [
      {
        key: "/workbench/customer",
        icon: <TeamOutlined />,
        label: "客户经营",
        permission: "PERM-CM-VIEW",
      },
      {
        key: "/workbench/conversation",
        icon: <CustomerServiceOutlined />,
        label: "会话跟进",
        permission: "PERM-CNV-VIEW",
      },
      {
        key: "/workbench/ai-runs",
        icon: <RobotOutlined />,
        label: "AI 执行流",
        permission: "PERM-AI-EXECUTE",
      },
      {
        key: "/workbench/approvals",
        icon: <AuditOutlined />,
        label: "审批流",
        permission: "PERM-AI-APPROVE",
      },
    ],
  },
  {
    type: "group" as const,
    label: "预警与洞察",
    children: [
      {
        key: "/risk-signals",
        icon: <WarningOutlined />,
        label: "风险预警台",
        permission: "PERM-CM-VIEW",
      },
    ],
  },
  {
    type: "group" as const,
    label: "业务管理",
    children: [
      {
        key: "/leads",
        icon: <UserOutlined />,
        label: "线索管理",
        permission: "PERM-LM-CREATE",
      },
      {
        key: "/opportunities",
        icon: <PhoneOutlined />,
        label: "商机管理",
        permission: "PERM-OM-CREATE",
      },
      {
        key: "/tickets",
        icon: <FileTextOutlined />,
        label: "工单管理",
        permission: "PERM-TK-VIEW",
      },
    ],
  },
  {
    type: "group" as const,
    label: "系统",
    children: [
      {
        key: "/agents",
        icon: <ThunderboltOutlined />,
        label: "Agent 管理",
        permission: "PERM-AI-AGENT_MANAGE",
      },
      {
        key: "/users",
        icon: <UserSwitchOutlined />,
        label: "用户管理",
        permission: "PERM-USR-MANAGE",
      },
      {
        key: "/settings",
        icon: <SettingOutlined />,
        label: "系统设置",
        permission: "PERM-SYS-MANAGE",
      },
    ],
  },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuthStore();
  const { pendingApprovals } = useApprovalStore();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path === "/cockpit") return ["/cockpit"];
    if (
      path.startsWith("/workbench/customer") ||
      path.startsWith("/customer-360")
    )
      return ["/workbench/customer"];
    if (path.startsWith("/workbench/conversation"))
      return ["/workbench/conversation"];
    if (path.startsWith("/workbench/ai-runs")) return ["/workbench/ai-runs"];
    if (path.startsWith("/workbench/approvals"))
      return ["/workbench/approvals"];
    if (path.startsWith("/risk-signals")) return ["/risk-signals"];
    if (path.startsWith("/customers")) return ["/workbench/customer"];
    if (path.startsWith("/conversations")) return ["/workbench/conversation"];
    if (path.startsWith("/approvals")) return ["/workbench/approvals"];
    return [path];
  };

  const filteredMenuItems = menuItems
    .map((group) => {
      if (group.type !== "group" || !group.children) return group;
      const filteredChildren = group.children.filter(
        (item) => !item.permission || hasPermission(item.permission),
      );
      if (filteredChildren.length === 0) return null;
      return {
        ...group,
        children: filteredChildren.map((item) => {
          if (
            item.key === "/workbench/approvals" &&
            pendingApprovals.length > 0
          ) {
            return {
              ...item,
              label: (
                <Badge count={pendingApprovals.length} offset={[6, 0]}>
                  {item.label}
                </Badge>
              ),
            };
          }
          return item;
        }),
      };
    })
    .filter(Boolean);

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider width={220} theme="light">
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, color: "#1890ff" }}>
            MOY 墨言
          </h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={filteredMenuItems as any}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <div />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <RobotOutlined
              style={{ fontSize: 18, cursor: "pointer", color: "#1890ff" }}
              title="AI Copilot"
            />
            <span>{user?.displayName}</span>
            <LogoutOutlined
              style={{ cursor: "pointer" }}
              onClick={handleLogout}
            />
          </div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: "#fff",
            borderRadius: 8,
            minHeight: 280,
            overflow: "auto",
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
      <CopilotPanel />
    </AntLayout>
  );
}
