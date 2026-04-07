import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import { Spin } from 'antd';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const Leads = lazy(() => import('./pages/Leads'));
const Opportunities = lazy(() => import('./pages/Opportunities'));
const Conversations = lazy(() => import('./pages/Conversations'));
const Tickets = lazy(() => import('./pages/Tickets'));
const Users = lazy(() => import('./pages/Users'));
const Settings = lazy(() => import('./pages/Settings'));

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
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="dashboard" 
            element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            } 
          />
          <Route 
            path="customers" 
            element={
              <Suspense fallback={<PageLoader />}>
                <Customers />
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
            path="conversations" 
            element={
              <Suspense fallback={<PageLoader />}>
                <Conversations />
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
