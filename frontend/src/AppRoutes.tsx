import { BrowserRouter, Routes, Route } from "react-router";

import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import TicketPage from "./pages/TicketPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

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
          </Route>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
