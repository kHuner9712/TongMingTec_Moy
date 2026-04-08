import { Outlet } from 'react-router-dom';
import { Layout as AntLayout, Menu, Badge } from 'antd';
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
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useApprovalStore } from '../stores/approvalStore';
import { CopilotPanel } from './AiCopilot';

const { Sider, Content, Header } = AntLayout;

const menuItems = [
  {
    type: 'group' as const,
    label: '经营中心',
    children: [
      { key: '/cockpit', icon: <DashboardOutlined />, label: '经营驾驶舱' },
    ],
  },
  {
    type: 'group' as const,
    label: '工作台',
    children: [
      { key: '/workbench/customer', icon: <TeamOutlined />, label: '客户经营' },
      { key: '/workbench/conversation', icon: <CustomerServiceOutlined />, label: '会话跟进' },
      { key: '/workbench/ai-runs', icon: <RobotOutlined />, label: 'AI 执行流' },
      { key: '/workbench/approvals', icon: <AuditOutlined />, label: '审批流' },
    ],
  },
  {
    type: 'group' as const,
    label: '预警与洞察',
    children: [
      { key: '/risk-signals', icon: <WarningOutlined />, label: '风险预警台' },
    ],
  },
  {
    type: 'group' as const,
    label: '业务管理',
    children: [
      { key: '/leads', icon: <UserOutlined />, label: '线索管理' },
      { key: '/opportunities', icon: <PhoneOutlined />, label: '商机管理' },
      { key: '/tickets', icon: <FileTextOutlined />, label: '工单管理' },
    ],
  },
  {
    type: 'group' as const,
    label: '系统',
    children: [
      { key: '/agents', icon: <ThunderboltOutlined />, label: 'Agent 管理' },
      { key: '/users', icon: <UserSwitchOutlined />, label: '用户管理' },
      { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
    ],
  },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { pendingApprovals } = useApprovalStore();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path === '/cockpit') return ['/cockpit'];
    if (path.startsWith('/workbench/customer') || path.startsWith('/customer-360')) return ['/workbench/customer'];
    if (path.startsWith('/workbench/conversation')) return ['/workbench/conversation'];
    if (path.startsWith('/workbench/ai-runs')) return ['/workbench/ai-runs'];
    if (path.startsWith('/workbench/approvals')) return ['/workbench/approvals'];
    if (path.startsWith('/risk-signals')) return ['/risk-signals'];
    if (path.startsWith('/customers')) return ['/workbench/customer'];
    if (path.startsWith('/conversations')) return ['/workbench/conversation'];
    if (path.startsWith('/approvals')) return ['/workbench/approvals'];
    return [path];
  };

  const menuItemsWithBadge = menuItems.map((group) => {
    if (group.type !== 'group' || !group.children) return group;
    return {
      ...group,
      children: group.children.map((item) => {
        if (item.key === '/workbench/approvals' && pendingApprovals.length > 0) {
          return { ...item, label: <Badge count={pendingApprovals.length} offset={[6, 0]}>{item.label}</Badge> };
        }
        return item;
      }),
    };
  });

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="light">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, color: '#1890ff' }}>MOY 墨言</h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={menuItemsWithBadge}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <RobotOutlined
              style={{ fontSize: 18, cursor: 'pointer', color: '#1890ff' }}
              title="AI Copilot"
            />
            <span>{user?.displayName}</span>
            <LogoutOutlined
              style={{ cursor: 'pointer' }}
              onClick={handleLogout}
            />
          </div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 280,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
      <CopilotPanel />
    </AntLayout>
  );
}
