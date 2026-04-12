import { Outlet, useLocation, useNavigate } from "react-router-dom";
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
  BellOutlined,
} from "@ant-design/icons";
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
    type: "group",
    label: "Operations Center",
    children: [
      {
        key: "/cockpit",
        icon: <DashboardOutlined />,
        label: "Cockpit",
        permission: "PERM-SYS-VIEW",
      },
    ],
  },
  {
    type: "group",
    label: "Workbench",
    children: [
      {
        key: "/workbench/customer",
        icon: <TeamOutlined />,
        label: "Customer Workbench",
        permission: "PERM-CM-VIEW",
      },
      {
        key: "/workbench/conversation",
        icon: <CustomerServiceOutlined />,
        label: "Conversation Workbench",
        permission: "PERM-CNV-VIEW",
      },
      {
        key: "/workbench/ai-runs",
        icon: <RobotOutlined />,
        label: "AI Runs",
        permission: "PERM-AI-EXECUTE",
      },
      {
        key: "/workbench/approvals",
        icon: <AuditOutlined />,
        label: "Approvals",
        permission: "PERM-AI-APPROVE",
      },
    ],
  },
  {
    type: "group",
    label: "Risk & Insights",
    children: [
      {
        key: "/risk-signals",
        icon: <WarningOutlined />,
        label: "Risk Signals",
        permission: "PERM-CM-VIEW",
      },
    ],
  },
  {
    type: "group",
    label: "Business",
    children: [
      {
        key: "/leads",
        icon: <UserOutlined />,
        label: "Leads",
        permission: "PERM-LM-CREATE",
      },
      {
        key: "/opportunities",
        icon: <PhoneOutlined />,
        label: "Opportunities",
        permission: "PERM-OM-CREATE",
      },
      {
        key: "/tickets",
        icon: <FileTextOutlined />,
        label: "Tickets",
        permission: "PERM-TK-VIEW",
      },
      {
        key: "/notifications",
        icon: <BellOutlined />,
        label: "Notifications",
        permission: "PERM-NTF-VIEW",
      },
    ],
  },
  {
    type: "group",
    label: "System",
    children: [
      {
        key: "/agents",
        icon: <ThunderboltOutlined />,
        label: "Agent Hub",
        permission: "PERM-AI-AGENT_MANAGE",
      },
      {
        key: "/users",
        icon: <UserSwitchOutlined />,
        label: "Users",
        permission: "PERM-USR-MANAGE",
      },
      {
        key: "/settings",
        icon: <SettingOutlined />,
        label: "Settings",
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
    if (path.startsWith("/workbench/customer") || path.startsWith("/customer-360"))
      return ["/workbench/customer"];
    if (path.startsWith("/workbench/conversation"))
      return ["/workbench/conversation"];
    if (path.startsWith("/workbench/ai-runs")) return ["/workbench/ai-runs"];
    if (path.startsWith("/workbench/approvals")) return ["/workbench/approvals"];
    if (path.startsWith("/risk-signals")) return ["/risk-signals"];
    if (path.startsWith("/customers")) return ["/workbench/customer"];
    if (path.startsWith("/conversations")) return ["/workbench/conversation"];
    if (path.startsWith("/approvals")) return ["/workbench/approvals"];
    return [path];
  };

  const filteredMenuItems = menuItems
    .map((group) => {
      const filteredChildren = group.children.filter(
        (item) => !item.permission || hasPermission(item.permission),
      );
      if (filteredChildren.length === 0) return null;
      return {
        ...group,
        children: filteredChildren.map((item) => {
          if (item.key === "/workbench/approvals" && pendingApprovals.length > 0) {
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
      <Sider width={240} theme="light">
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, color: "#1677ff" }}>MOY</h1>
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
              style={{ fontSize: 18, cursor: "pointer", color: "#1677ff" }}
              title="AI Copilot"
            />
            <span>{user?.displayName}</span>
            <LogoutOutlined style={{ cursor: "pointer" }} onClick={handleLogout} />
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
