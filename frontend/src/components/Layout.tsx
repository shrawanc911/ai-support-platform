import type { ReactNode } from "react";
import { NavLink } from "react-router";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">AI Support</div>
        <nav>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/tickets">Tickets</NavLink>
          <NavLink to="/cutomers">Customers</NavLink>
          {["AGENT", "MANAGER", "ADMIN"].includes(user?.role ?? "") && (
            <NavLink to="/knowledge">Knowledge Base</NavLink>
          )}
          {["MANAGER", "ADMIN"].includes(user?.role ?? "") && (
            <NavLink to="/analytics">Analytics</NavLink>
          )}
        </nav>
        <Sidebar />
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
