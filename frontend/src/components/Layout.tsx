import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">AI Support</div>
        <nav>
          <a href="/">Dashboard</a>
          <a href="/tickets">Tickets</a>
          <a href="/cutomers">Customers</a>
          <a href="/knowledge">Knowledge</a>
          <a href="/analytics">Analytics</a>
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
