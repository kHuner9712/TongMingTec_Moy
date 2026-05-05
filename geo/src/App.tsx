import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Diagnose from "./pages/Diagnose";
import Reports from "./pages/Reports";
import Login from "./pages/Login";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="diagnose" element={<Diagnose />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/:id" element={<Reports />} />
      </Route>
    </Routes>
  );
}

export default App;
