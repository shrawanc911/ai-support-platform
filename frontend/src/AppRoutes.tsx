import { BrowserRouter, Routes, Route } from "react-router";

import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import TicketPage from "./pages/TicketPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import UsersPage from "./pages/admin/UsersPage";
import RoleRoute from "./components/RoleRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tickets" element={<TicketPage />} />
            <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
            <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin/users" element={<UsersPage />} />
            </Route>
          </Route>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
