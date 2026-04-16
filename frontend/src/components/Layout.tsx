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
  ShoppingCartOutlined,
  FileProtectOutlined,
  AccountBookOutlined,
  SafetyCertificateOutlined,
  HeartOutlined,
  BookOutlined,
  FormOutlined,
  ProjectOutlined,
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
        permission: "PERM-DASH-VIEW",
      },
    ],
  },
  {
    type: "group",
    label: "Dashboards",
    children: [
      {
        key: "/dashboards/sales",
        icon: <PhoneOutlined />,
        label: "Sales Dashboard",
        permission: "PERM-DASH-VIEW",
      },
      {
        key: "/dashboards/service",
        icon: <CustomerServiceOutlined />,
        label: "Service Dashboard",
        permission: "PERM-DASH-VIEW",
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
        key: "/opportunities/forecast",
        icon: <PhoneOutlined />,
        label: "Opportunity Forecast",
        permission: "PERM-OM-FORECAST",
      },
      {
        key: "/quotes",
        icon: <FileProtectOutlined />,
        label: "Quotes",
        permission: "PERM-QT-MANAGE",
      },
      {
        key: "/contracts",
        icon: <FileTextOutlined />,
        label: "Contracts",
        permission: "PERM-CT-MANAGE",
      },
      {
        key: "/orders",
        icon: <ShoppingCartOutlined />,
        label: "Orders",
        permission: "PERM-ORD-MANAGE",
      },
      {
        key: "/payments",
        icon: <AccountBookOutlined />,
        label: "Payments",
        permission: "PERM-PAY-MANAGE",
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
    label: "Post-Sales",
    children: [
      {
        key: "/subscriptions",
        icon: <SafetyCertificateOutlined />,
        label: "Subscriptions",
        permission: "PERM-SUB-MANAGE",
      },
      {
        key: "/deliveries",
        icon: <ProjectOutlined />,
        label: "Deliveries",
        permission: "PERM-DLV-VIEW",
      },
      {
        key: "/workbench/csm/health",
        icon: <HeartOutlined />,
        label: "Customer Health",
        permission: "PERM-CSM-VIEW",
      },
      {
        key: "/workbench/csm/plans",
        icon: <FileTextOutlined />,
        label: "Success Plans",
        permission: "PERM-CSM-VIEW",
      },
      {
        key: "/workbench/csm/visits",
        icon: <FormOutlined />,
        label: "Return Visits",
        permission: "PERM-CSM-VIEW",
      },
      {
        key: "/automation",
        icon: <ThunderboltOutlined />,
        label: "Automation",
        permission: "PERM-AUTO-MANAGE",
      },
    ],
  },
  {
    type: "group",
    label: "Knowledge",
    children: [
      {
        key: "/knowledge",
        icon: <BookOutlined />,
        label: "Knowledge Base",
        permission: "PERM-KB-READ",
      },
      {
        key: "/knowledge/manage",
        icon: <FormOutlined />,
        label: "Knowledge Manage",
        permission: "PERM-KB-MANAGE",
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
    if (path.startsWith("/dashboards/sales")) return ["/dashboards/sales"];
    if (path.startsWith("/dashboards/service")) return ["/dashboards/service"];
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
    if (path.startsWith("/opportunities/forecast"))
      return ["/opportunities/forecast"];
    if (path.startsWith("/quotes")) return ["/quotes"];
    if (path.startsWith("/contracts")) return ["/contracts"];
    if (path.startsWith("/orders")) return ["/orders"];
    if (path.startsWith("/payments")) return ["/payments"];
    if (path.startsWith("/subscriptions")) return ["/subscriptions"];
    if (path.startsWith("/deliveries")) return ["/deliveries"];
    if (path.startsWith("/workbench/csm/health"))
      return ["/workbench/csm/health"];
    if (path.startsWith("/workbench/csm/plans"))
      return ["/workbench/csm/plans"];
    if (path.startsWith("/workbench/csm/visits"))
      return ["/workbench/csm/visits"];
    if (path.startsWith("/knowledge/manage")) return ["/knowledge/manage"];
    if (path.startsWith("/knowledge")) return ["/knowledge"];
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
