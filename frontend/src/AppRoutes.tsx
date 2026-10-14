import { BrowserRouter, Routes, Route } from "react-router";

import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import TicketPage from "./pages/TicketPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import LoginPage from "./pages/auth/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import UsersPage from "./pages/admin/UsersPage";
import RoleRoute from "./components/RoleRoute";
import KnowledgeBasePage from "./pages/knowledge/KnowledgeBasePage";
import KnowledgeDocumentPage from "./pages/knowledge/KnowledgeDocumentPage";
import OrganizationsPage from "./pages/organizations/OrganizationsPage";
import CreateOrganizationPage from "./pages/organizations/CreateOrganizationPage";
import RegisterPage from "./pages/auth/RegisterPage";
import TicketsPage from "./pages/admin/TicketsPage";
import TicketDetailsPage from "./pages/admin/TicketDetailsPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route
                path="/organizations/new"
                element={<CreateOrganizationPage />}
              />
            </Route>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tickets" element={<TicketPage />} />
            <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
            <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
              <Route
                path="/organizations/:organizationId/users"
                element={<UsersPage />}
              />
              <Route path="/admin/tickets" element={<TicketsPage />} />
              <Route
                path="/admin/tickets/:ticketId"
                element={<TicketDetailsPage />}
              />
            </Route>
            <Route
              element={
                <RoleRoute allowedRoles={["AGENT", "MANAGER", "ADMIN"]} />
              }
            >
              <Route path="/knowledge" element={<KnowledgeBasePage />} />
              <Route
                path="/knowledge/:documentId"
                element={<KnowledgeDocumentPage />}
              />
            </Route>
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
