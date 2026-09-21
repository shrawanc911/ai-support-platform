import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside>
      <div>
        <p>{user?.name}</p>
        <p>{user?.role}</p>
      </div>

      {!isLoginPage && (
        <button onClick={user ? handleLogout : () => navigate("/login")}>
          {user ? "Logout" : "Login"}
        </button>
      )}
    </aside>
  );
}
