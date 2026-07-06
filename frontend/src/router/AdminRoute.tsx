import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/** Ruta que requiere rol admin. FR-025, FR-032 */
export function AdminRoute() {
  const { currentUser, isAdmin, loading } = useAuth();
  if (loading) return <div className="loading">Cargando...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/mis-turnos" replace />;
  return <Outlet />;
}
