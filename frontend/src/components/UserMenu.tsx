import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronUp, LogOut, Settings, UserRound } from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function UserMenu() {
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user) {
    return (
      <div className="space-y-2">
        <Link
          to="/login"
          className="flex w-full items-center justify-center rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Login
        </Link>

        <Link
          to="/register"
          className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Register
        </Link>
      </div>
    );
  }

  const initials = user.name?.trim().charAt(0).toUpperCase() || "U";

  return (
    <div ref={menuRef} className="relative">
      {/* User button */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-100"
      >
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          {initials}
        </div>

        {/* User information */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {user.name}
          </p>

          <p className="truncate text-xs text-slate-500">{user.role}</p>
        </div>

        <ChevronUp
          size={17}
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {/* User information */}
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user.name}
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {user.email}
            </p>
          </div>

          {/* Menu items */}
          {/* <div className="p-1.5">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              <UserRound size={17} className="text-slate-400" />
              <span>Profile</span>
            </Link>

            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              <Settings size={17} className="text-slate-400" />
              <span>Settings</span>
            </Link>
          </div> */}

          {/* Logout */}
          <div className="border-t border-slate-100 p-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
