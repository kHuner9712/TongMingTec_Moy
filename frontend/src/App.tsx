import { lazy, Suspense, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import PermissionGate from './components/PermissionGate';
import { Spin } from 'antd';

const Login = lazy(() => import('./pages/Login'));
const Workbench = lazy(() => import('./pages/Workbench'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customer360 = lazy(() => import('./pages/Customer360'));
const Leads = lazy(() => import('./pages/Leads'));
const Opportunities = lazy(() => import('./pages/Opportunities'));
const Tickets = lazy(() => import('./pages/Tickets'));
const AgentHub = lazy(() => import('./pages/AgentHub'));
const Users = lazy(() => import('./pages/Users'));
const Settings = lazy(() => import('./pages/Settings'));

const Cockpit = lazy(() => import('./pages/Cockpit'));
const CustomerWorkbench = lazy(() => import('./pages/workbench/CustomerWorkbench'));
const ConversationWorkbench = lazy(() => import('./pages/workbench/ConversationWorkbench'));
const AiRunsWorkbench = lazy(() => import('./pages/workbench/AiRunsWorkbench'));
const ApprovalWorkbench = lazy(() => import('./pages/workbench/ApprovalWorkbench'));
const RiskSignals = lazy(() => import('./pages/RiskSignals'));

const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  }}>
    <Spin size="large" />
  </div>
);

const withPermission = (element: ReactNode, anyOf: string[]) => (
  <PermissionGate anyOf={anyOf}>{element}</PermissionGate>
);

function App() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/cockpit" replace />} />

          <Route
            path="cockpit"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<Cockpit />, ['PERM-SYS-VIEW'])}
              </Suspense>
            }
          />

          <Route
            path="workbench/customer"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<CustomerWorkbench />, ['PERM-CM-VIEW'])}
              </Suspense>
            }
          />
          <Route
            path="workbench/conversation"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<ConversationWorkbench />, ['PERM-CNV-VIEW'])}
              </Suspense>
            }
          />
          <Route
            path="workbench/ai-runs"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<AiRunsWorkbench />, ['PERM-AI-EXECUTE'])}
              </Suspense>
            }
          />
          <Route
            path="workbench/approvals"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<ApprovalWorkbench />, ['PERM-AI-APPROVE'])}
              </Suspense>
            }
          />

          <Route
            path="customer-360/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<Customer360 />, ['PERM-CM-VIEW'])}
              </Suspense>
            }
          />

          <Route
            path="risk-signals"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<RiskSignals />, ['PERM-CM-VIEW'])}
              </Suspense>
            }
          />

          <Route path="customers" element={<Navigate to="/workbench/customer" replace />} />
          <Route path="conversations" element={<Navigate to="/workbench/conversation" replace />} />
          <Route path="approvals" element={<Navigate to="/workbench/approvals" replace />} />

          <Route
            path="agents"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<AgentHub />, ['PERM-AI-AGENT_MANAGE'])}
              </Suspense>
            }
          />

          <Route
            path="dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<Dashboard />, ['PERM-SYS-VIEW', 'PERM-DASH-VIEW'])}
              </Suspense>
            }
          />
          <Route
            path="leads"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<Leads />, [
                  'PERM-LM-CREATE',
                  'PERM-LM-ASSIGN',
                  'PERM-LM-FOLLOW_UP',
                  'PERM-LM-CONVERT',
                ])}
              </Suspense>
            }
          />
          <Route
            path="opportunities"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<Opportunities />, [
                  'PERM-OM-CREATE',
                  'PERM-OM-STAGE',
                  'PERM-OM-RESULT',
                ])}
              </Suspense>
            }
          />
          <Route
            path="tickets"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<Tickets />, ['PERM-TK-VIEW'])}
              </Suspense>
            }
          />
          <Route
            path="users"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<Users />, ['PERM-USR-MANAGE'])}
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<Settings />, ['PERM-SYS-MANAGE'])}
              </Suspense>
            }
          />
          <Route
            path="workbench"
            element={
              <Suspense fallback={<PageLoader />}>
                {withPermission(<Workbench />, ['PERM-SYS-VIEW'])}
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
