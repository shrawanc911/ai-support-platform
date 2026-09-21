import { Navigate, Outlet } from "react-router";

import { useAuth } from "../context/AuthContext";

interface RoleRouteProps {
  allowedRoles: string[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
