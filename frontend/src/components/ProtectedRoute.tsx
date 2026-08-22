import { Navigate } from "react-router-dom";
import { useAuth, Role } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  allow,
}: {
  children: JSX.Element;
  allow?: Role[];
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) {
    return <Navigate to={user.role === "ADMIN" ? "/hr/dashboard" : "/employee/dashboard"} replace />;
  }
  return children;
}
