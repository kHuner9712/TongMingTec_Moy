import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
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
                <Cockpit />
              </Suspense>
            }
          />

          <Route
            path="workbench/customer"
            element={
              <Suspense fallback={<PageLoader />}>
                <CustomerWorkbench />
              </Suspense>
            }
          />
          <Route
            path="workbench/conversation"
            element={
              <Suspense fallback={<PageLoader />}>
                <ConversationWorkbench />
              </Suspense>
            }
          />
          <Route
            path="workbench/ai-runs"
            element={
              <Suspense fallback={<PageLoader />}>
                <AiRunsWorkbench />
              </Suspense>
            }
          />
          <Route
            path="workbench/approvals"
            element={
              <Suspense fallback={<PageLoader />}>
                <ApprovalWorkbench />
              </Suspense>
            }
          />

          <Route
            path="customer-360/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <Customer360 />
              </Suspense>
            }
          />

          <Route
            path="risk-signals"
            element={
              <Suspense fallback={<PageLoader />}>
                <RiskSignals />
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
                <AgentHub />
              </Suspense>
            }
          />

          <Route
            path="dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="leads"
            element={
              <Suspense fallback={<PageLoader />}>
                <Leads />
              </Suspense>
            }
          />
          <Route
            path="opportunities"
            element={
              <Suspense fallback={<PageLoader />}>
                <Opportunities />
              </Suspense>
            }
          />
          <Route
            path="tickets"
            element={
              <Suspense fallback={<PageLoader />}>
                <Tickets />
              </Suspense>
            }
          />
          <Route
            path="users"
            element={
              <Suspense fallback={<PageLoader />}>
                <Users />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            }
          />
          <Route
            path="workbench"
            element={
              <Suspense fallback={<PageLoader />}>
                <Workbench />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
