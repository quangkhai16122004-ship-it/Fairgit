import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function RequireAuth({ allowRoles }: { allowRoles?: string[] }) {
  const { state } = useAuth();

  if (state.status === "loading") {
    return <div className="p-6 text-sm text-gray-600">Loading...</div>;
  }

  if (state.status === "guest") {
    return <Navigate to="/login" replace />;
  }

  // authed
  if (allowRoles && !allowRoles.includes(state.role)) {
    return <div className="p-6">Bạn không có quyền truy cập trang này.</div>;
  }

  return <Outlet />;
}