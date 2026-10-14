import type { ReactNode } from "react";
import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Building2,
  BookOpen,
  BarChart3,
  UserRound,
} from "lucide-react";

import UserMenu from "./UserMenu";
import { useAuth } from "../context/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const canAccessKnowledge = ["AGENT", "MANAGER", "ADMIN"].includes(
    user?.role ?? "",
  );
  const canAccessAnalytics = ["MANAGER", "ADMIN"].includes(user?.role ?? "");

  const mainNavigation: NavigationItem[] = [
    {
      label: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Tickets",
      path: "/tickets",
      icon: Ticket,
    },
    // {
    //   label: "Customers",
    //   path: "/customers",
    //   icon: Users,
    // },
  ];

  const managementNavigation: NavigationItem[] = [];

  if (canAccessKnowledge) {
    managementNavigation.push({
      label: "Knowledge Base",
      path: "/knowledge",
      icon: BookOpen,
    });
  }

  // if (canAccessAnalytics) {
  //   managementNavigation.push({
  //     label: "Analytics",
  //     path: "/analytics",
  //     icon: BarChart3,
  //   });
  // }

  if (isAdmin) {
    managementNavigation.push({
      label: "Organizations",
      path: "/organizations",
      icon: Building2,
    });

    // managementNavigation.push({
    //   label: "Users",
    //   path: "/admin/users",
    //   icon: UserRound,
    // });
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
              AI
            </div>

            <div>
              <h1 className="text-sm font-semibold text-slate-900">
                AI Support
              </h1>

              <p className="text-xs text-slate-500">Support Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <NavigationSection title="Workspace" items={mainNavigation} />

          {managementNavigation.length > 0 && (
            <NavigationSection
              title="Management"
              items={managementNavigation}
            />
          )}
        </div>

        {/* User menu */}
        <div className="border-t border-slate-200 p-3">
          <UserMenu />
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-70 mr-5 min-h-screen flex-1">{children}</main>
    </div>
  );
}

function NavigationSection({
  title,
  items,
}: {
  title: string;
  items: NavigationItem[];
}) {
  return (
    <div className="mb-7">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5",
                  "text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-600"
                    }
                  />

                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
