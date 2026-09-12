import type { ReactNode } from "react";
import { NavLink } from "react-router";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">AI Support</div>
        <nav>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/tickets">Tickets</NavLink>
          <NavLink to="/cutomers">Customers</NavLink>
          <NavLink to="/knowledge">Knowledge</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
