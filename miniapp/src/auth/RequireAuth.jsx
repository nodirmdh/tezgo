import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Splash from "../components/Splash";

const roleToPath = {
  client: "/client",
  partner: "/restaurant",
  courier: "/courier"
};

export default function RequireAuth({ role, children }) {
  const { user, loading, mustChangePassword } = useAuth();
  const location = useLocation();
  const basePath = roleToPath[role] || "/";

  if (loading) {
    return <Splash />;
  }

  if (!user) {
    return <Navigate to={`${basePath}/login`} state={{ from: location }} replace />;
  }

  if (user.role !== role) {
    return <Navigate to={`${basePath}/login`} replace />;
  }

  if (mustChangePassword && location.pathname !== `${basePath}/change-password`) {
    return <Navigate to={`${basePath}/change-password`} replace />;
  }

  return children;
}
